import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Lazy-init OpenAI to avoid crash if OPENAI_API_KEY not set at startup
let _openai: any = null;
function getOpenAI() {
  if (!_openai) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { default: OpenAI } = require('openai');
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

router.post('/', authenticate, async (req: Request, res: Response) => {
  const { summary, lang = 'af' } = req.body;
  const isAf = lang === 'af';
  const langLabel = isAf ? 'in Afrikaans' : 'in English';

  const prompt = 'You are an agricultural AI analyst for South African farms. Analyse this farm data summary and identify 3-5 meaningful patterns. Return JSON only.\n\nFarm data: ' + JSON.stringify(summary) + '\n\nReturn this exact JSON structure:\n{\n  "patterns": [\n    {\n      "category": "string (' + langLabel + ')",\n      "insight": "string (specific observation from the data, ' + langLabel + ')",\n      "trend": "up|down|stable",\n      "confidence": "number (50-95)",\n      "action": "string (specific actionable recommendation, ' + langLabel + ')",\n      "emoji": "single relevant emoji"\n    }\n  ]\n}\n\nFocus on: expense patterns, livestock health trends, rainfall impact, seasonal cycles, financial health. Be specific to SA farming context.';

  try {
    const openai = getOpenAI();
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
