import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const { summary, lang = 'af' } = req.body;
  const isAf = lang === 'af';

  const prompt = `You are an agricultural AI analyst for South African farms. Analyse this farm data summary and identify 3-5 meaningful patterns. Return JSON only.

Farm data: ${JSON.stringify(summary)}

Return this exact JSON structure:
{
  "patterns": [
    {
      "category": "string (${isAf ? 'in Afrikaans' : 'in English'})",
      "insight": "string (specific observation from the data, ${isAf ? 'in Afrikaans' : 'in English'})",
      "trend": "up|down|stable",
      "confidence": number (50-95),
      "action": "string (specific actionable recommendation, ${isAf ? 'in Afrikaans' : 'in English'})",
      "emoji": "single relevant emoji"
    }
  ]
}

Focus on: expense patterns, livestock health trends, rainfall impact, seasonal cycles, financial health. Be specific to SA farming context.`;

  try {
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });
    const content = r.choices[0].message.content || '{"patterns":[]}';
    res.json(JSON.parse(content));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
