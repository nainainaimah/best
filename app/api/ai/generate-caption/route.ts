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

    // Check if API key exists
    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not set');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const prompt = language === 'swa'
      ? `Unda maelezo ya Instagram kuhusu "${topic}". ${tone ? `Tumia toni ya ${tone}.` : ''} Fanya kuwa fupi, ya kuvutia, na chenye nguvu. Jumuisha emoji zinazofaa.`
      : `Generate an engaging Instagram caption about "${topic}". ${tone ? `Use a ${tone} tone.` : ''} Make it short, catchy, and impactful. Include relevant emojis.`;

    console.log('Generating caption for topic:', topic);

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
        max_tokens: 150,
        temperature: 0.8,
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
    const caption = data.choices[0]?.message?.content || '';

    if (!caption) {
      console.error('No caption generated from AI');
      return NextResponse.json(
        { error: 'No caption generated' },
        { status: 500 }
      );
    }

    console.log('Caption generated successfully');
    return NextResponse.json({ caption });
  } catch (error: any) {
    console.error('AI caption generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate caption' },
      { status: 500 }
    );
  }
}
