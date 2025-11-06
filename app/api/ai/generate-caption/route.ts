import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { topic, tone, language } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const prompt = language === 'swa'
      ? `Unda maelezo ya Instagram kuhusu "${topic}". ${tone ? `Tumia toni ya ${tone}.` : ''} Fanya kuwa fupi, ya kuvutia, na chenye nguvu. Jumuisha emoji zinazofaa.`
      : `Generate an engaging Instagram caption about "${topic}". ${tone ? `Use a ${tone} tone.` : ''} Make it short, catchy, and impactful. Include relevant emojis.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'PostMuse.ai',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('OpenRouter API request failed');
    }

    const data = await response.json();
    const caption = data.choices[0]?.message?.content || '';

    return NextResponse.json({ caption });
  } catch (error) {
    console.error('AI caption generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate caption' },
      { status: 500 }
    );
  }
}
