import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { caption, topic, pillar, platforms, brandVoice } = await request.json();

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not set');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Build prompt based on available context
    let prompt = 'Generate a compelling, concise post title that captures attention.\n\n';

    if (topic) {
      prompt += `Topic: ${topic}\n`;
    }

    if (caption) {
      prompt += `Caption: ${caption}\n`;
    }

    if (pillar) {
      prompt += `Content Type: ${pillar}\n`;
    }

    if (platforms && platforms.length > 0) {
      prompt += `Platforms: ${platforms.join(', ')}\n`;
    }

    if (brandVoice) {
      prompt += `Brand Voice: ${brandVoice}\n`;
    }

    prompt += '\nGenerate a title that is:\n';
    prompt += '- 3-8 words long\n';
    prompt += '- Attention-grabbing\n';
    prompt += '- Clear and specific\n';
    prompt += '- Matches the brand voice and content type\n';
    prompt += '- NO emojis, NO hashtags, NO quotation marks\n';
    prompt += '\nReturn ONLY the title, nothing else.';

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
            content: prompt,
          },
        ],
        max_tokens: 50,
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
    const title = data.choices[0]?.message?.content?.trim() || '';

    if (!title) {
      return NextResponse.json(
        { error: 'No title generated' },
        { status: 500 }
      );
    }

    // Clean up the title (remove quotes if AI added them)
    const cleanTitle = title.replace(/^["']|["']$/g, '').trim();

    return NextResponse.json({ title: cleanTitle });
  } catch (error: any) {
    console.error('AI title generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate title' },
      { status: 500 }
    );
  }
}
