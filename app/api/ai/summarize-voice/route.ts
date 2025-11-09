import { NextRequest, NextResponse } from 'next/server';
import type { BrandVoiceSliders } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { sliders, likes, dislikes } = await request.json();

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not set');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Build a descriptive prompt based on slider values
    const formalCasual = sliders?.formal_casual || 50;
    const playfulSerious = sliders?.playful_serious || 50;
    const boldSoft = sliders?.bold_soft || 50;

    const getTone = (value: number, lowLabel: string, highLabel: string) => {
      if (value < 30) return `very ${lowLabel}`;
      if (value < 45) return `${lowLabel}`;
      if (value < 55) return 'balanced';
      if (value < 70) return `${highLabel}`;
      return `very ${highLabel}`;
    };

    const toneDescription = `
Brand voice characteristics:
- Formality: ${getTone(formalCasual, 'formal', 'casual')}
- Playfulness: ${getTone(playfulSerious, 'playful', 'serious')}
- Boldness: ${getTone(boldSoft, 'bold', 'soft')}
${likes ? `- Often uses words like: ${likes}` : ''}
${dislikes ? `- Avoids words like: ${dislikes}` : ''}

Generate a 1-2 sentence brand voice summary that captures this tone for use in social media content generation.
    `.trim();

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'PostMuse.ai',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: toneDescription,
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, errorText);
      return NextResponse.json(
        { error: `AI service error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content?.trim() || '';

    if (!summary) {
      return NextResponse.json(
        { error: 'No summary generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('AI voice summary error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
