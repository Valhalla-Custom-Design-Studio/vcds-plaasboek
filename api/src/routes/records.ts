
import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticate } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /records
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.id;
    const { type, category, from, to, tax_year, limit = 100, offset = 0 } = req.query;
    let q = 'SELECT * FROM farm_records WHERE user_id=$1';
    const params: any[] = [uid];
    if (type) { q += ` AND type=$${params.length+1}`; params.push(type); }
    if (category) { q += ` AND category ILIKE $${params.length+1}`; params.push(`%${category}%`); }
    if (from) { q += ` AND record_date >= $${params.length+1}`; params.push(from); }
    if (to) { q += ` AND record_date <= $${params.length+1}`; params.push(to); }
    if (tax_year) { q += ` AND tax_year=$${params.length+1}`; params.push(tax_year); }
    q += ` ORDER BY record_date DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(limit, offset);
    const result = await pool.query(q, params);
    res.json({ success: true, records: result.rows, count: result.rows.length });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// GET /records/summary
router.get('/summary', authenticate, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.id;
    const { tax_year, month } = req.query;
    const year = tax_year || new Date().getFullYear();
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(amount_zar) FILTER (WHERE type='income'),0) as total_income,
        COALESCE(SUM(amount_zar) FILTER (WHERE type='expense'),0) as total_expenses,
        COALESCE(SUM(amount_zar) FILTER (WHERE type='income'),0) - COALESCE(SUM(amount_zar) FILTER (WHERE type='expense'),0) as net_profit,
        COUNT(*) FILTER (WHERE type='income') as income_count,
        COUNT(*) FILTER (WHERE type='expense') as expense_count,
        COALESCE(SUM(vat_amount),0) as total_vat
      FROM farm_records WHERE user_id=$1 AND tax_year=$2
    `, [uid, year]);
    res.json({ success: true, summary: result.rows[0], tax_year: year });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// GET /records/monthly-breakdown
router.get('/monthly-breakdown', authenticate, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.id;
    const year = req.query.tax_year || new Date().getFullYear();
    const result = await pool.query(`
      SELECT 
        TO_CHAR(record_date,'YYYY-MM') as month,
        COALESCE(SUM(amount_zar) FILTER (WHERE type='income'),0) as income,
        COALESCE(SUM(amount_zar) FILTER (WHERE type='expense'),0) as expenses
      FROM farm_records WHERE user_id=$1 AND tax_year=$2
      GROUP BY month ORDER BY month
    `, [uid, year]);
    res.json({ success: true, breakdown: result.rows });
  } catch { res.status(500).json({ error: 'Failed' }); }
});

// POST /records
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.id;
    const { type, category, description, amount_zar, vat_amount, receipt_url, record_date, tags, farm_section, voice_transcript, ai_parsed } = req.body;
    if (!type || !category || !description || !amount_zar) return res.status(400).json({ error: 'type, category, description, amount_zar required' });
    const taxYear = new Date(record_date || Date.now()).getFullYear();
    const result = await pool.query(
      `INSERT INTO farm_records (id,user_id,type,category,description,amount_zar,vat_amount,receipt_url,record_date,tax_year,tags,farm_section,voice_transcript,ai_parsed)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [uuidv4(), uid, type, category, description, amount_zar, vat_amount||0, receipt_url, record_date||new Date().toISOString().split('T')[0], taxYear, tags, farm_section, voice_transcript, ai_parsed||false]
    );
    res.status(201).json({ success: true, record: result.rows[0] });
  } catch { res.status(500).json({ error: 'Failed to create record' }); }
});

// PUT /records/:id
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.id;
    const { type, category, description, amount_zar, vat_amount, receipt_url, record_date, tags, farm_section } = req.body;
    const result = await pool.query(
      `UPDATE farm_records SET type=COALESCE($1,type), category=COALESCE($2,category), description=COALESCE($3,description),
       amount_zar=COALESCE($4,amount_zar), vat_amount=COALESCE($5,vat_amount), receipt_url=COALESCE($6,receipt_url),
       record_date=COALESCE($7,record_date), tags=COALESCE($8,tags), farm_section=COALESCE($9,farm_section), updated_at=NOW()
       WHERE id=$10 AND user_id=$11 RETURNING *`,
      [type, category, description, amount_zar, vat_amount, receipt_url, record_date, tags, farm_section, req.params.id, uid]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, record: result.rows[0] });
  } catch { res.status(500).json({ error: 'Update failed' }); }
});

// DELETE /records/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM farm_records WHERE id=$1 AND user_id=$2', [req.params.id, (req as any).user.id]);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Delete failed' }); }
});

// POST /records/ai-parse — Voice/text to record
router.post('/ai-parse', authenticate, async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });

    // AI parser — rule-based NLP (LLM-ready)
    const lower = text.toLowerCase();
    let type = lower.includes('verkoop') || lower.includes('sold') || lower.includes('ontvang') || lower.includes('received') ? 'income' : 'expense';

    // Extract amount
    const amountMatch = text.match(/R?\s*(\d[\d,\.]+)/);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',','')) : 0;

    // Extract category
    const categories: Record<string, string[]> = {
      'Livestock Sales': ['lam','skaap','bees','sold','verkoop','dier'],
      'Feed & Supplements': ['voer','kos','supplement','feed'],
      'Veterinary': ['veearts','vet','medisyne','medicine'],
      'Fuel': ['diesel','petrol','brandstof','fuel'],
      'Labour': ['werker','labour','loon','salary','wages'],
      'Equipment': ['trekker','tractor','equipment','masjien'],
      'Crop Sales': ['koring','mielies','wheat','maize','crop'],
      'Repairs': ['herstel','repair','fix'],
    };
    let category = 'General';
    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(k => lower.includes(k))) { category = cat; break; }
    }

    res.json({ success: true, parsed: { type, category, amount_zar: amount, description: text, ai_parsed: true, record_date: new Date().toISOString().split('T')[0] } });
  } catch { res.status(500).json({ error: 'AI parse failed' }); }
});

// GET /records/agrifinance-score
router.get('/agrifinance-score', authenticate, async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user.id;
    const year = new Date().getFullYear();
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(amount_zar) FILTER (WHERE type='income'),0) as income,
        COALESCE(SUM(amount_zar) FILTER (WHERE type='expense'),0) as expenses,
        COUNT(DISTINCT TO_CHAR(record_date,'YYYY-MM')) as active_months
      FROM farm_records WHERE user_id=$1 AND tax_year=$2
    `, [uid, year]);
    const { income, expenses, active_months } = result.rows[0];
    const profit = income - expenses;
    const ratio = income > 0 ? expenses / income : 1;
    let score = 500;
    if (income > 100000) score += 100;
    if (income > 500000) score += 150;
    if (ratio < 0.6) score += 100;
    if (ratio < 0.4) score += 100;
    if (active_months >= 6) score += 50;
    if (profit > 0) score += 100;
    score = Math.min(850, Math.max(300, score));
    const grade = score >= 750 ? 'A' : score >= 650 ? 'B' : score >= 550 ? 'C' : score >= 450 ? 'D' : 'F';
    res.json({ success: true, score, grade, income: Number(income), expenses: Number(expenses), profit, ratio: Number(ratio).toFixed(2), recommendation: grade === 'A' ? 'Excellent — qualify for Land Bank Agri-Business loan' : grade === 'B' ? 'Good — qualify for standard agricultural credit' : 'Improve income consistency to strengthen credit profile' });
  } catch { res.status(500).json({ error: 'Score calculation failed' }); }
});

export default router;
