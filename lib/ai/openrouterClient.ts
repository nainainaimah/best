import type { MarketMuseInput, MarketMuseOutput } from '../types/marketMuse';

const SYSTEM_PROMPT = `You are MarketMuse.ai, a cautious and honest international market research assistant.
You receive structured macroeconomic data and a project brief.
Your priorities:
- Clearly distinguish between facts (from data), estimates, and assumptions.
- Show where data is missing, noisy, or outdated.
- Always include an explicit "honesty" section listing assumptions and data gaps.
- Never give legal, tax, or investment advice. Instead, recommend consulting licensed professionals.
- If you do not know something, say so clearly and avoid making it up.
Return ONLY valid JSON matching the provided schema.`;

export async function runMarketAnalysis(
  input: MarketMuseInput
): Promise<MarketMuseOutput> {
  const res = await fetch(`${process.env.OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY!}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `You will receive a JSON payload with project and macro data. Analyse it and respond with valid JSON matching this schema:

{
  "executive_summary": "string",
  "market_overview": {
    "narrative": "string",
    "key_metrics": [{ "label": "string", "value": "string", "source": "string (optional)" }]
  },
  "opportunity_analysis": {
    "segments": [{ "name": "string", "description": "string", "why_now": "string" }]
  },
  "risk_and_constraints": {
    "headline": "string",
    "details": ["string"],
    "legal_or_regulatory_flags": ["string"],
    "data_limitations": ["string"]
  },
  "scenario_outlook": {
    "optimistic": "string",
    "base_case": "string",
    "downside": "string"
  },
  "recommended_next_steps": ["string"],
  "honesty_block": {
    "assumptions_made": ["string"],
    "missing_data_to_verify": ["string"],
    "suggested_professional_advisors": ["string"]
  },
  "presentation_outline": {
    "title": "string",
    "slides": [{ "title": "string", "bullets": ["string"] }]
  }
}

Input data:
${JSON.stringify(input, null, 2)}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content returned from OpenRouter');
  }

  const parsed: MarketMuseOutput =
    typeof content === 'string' ? JSON.parse(content) : content;

  return parsed;
}
