import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { caption, topic, pillar, platforms, hashtagCount, industry, targetAudience } = await request.json();

    if (!process.env.OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not set');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Determine hashtag count based on preference
    let count = 5;
    if (hashtagCount === 'none') {
      return NextResponse.json({ hashtags: [] });
    } else if (hashtagCount === 'minimal') {
      count = 3;
    } else if (hashtagCount === 'medium') {
      count = 8;
    } else if (hashtagCount === 'heavy') {
      count = 15;
    }

    // Build prompt based on available context
    let prompt = `Generate ${count} relevant hashtags for a social media post.\n\n`;

    if (topic) {
      prompt += `Topic: ${topic}\n`;
    }

    if (caption) {
      prompt += `Caption: ${caption}\n`;
    }

    if (pillar) {
      prompt += `Content Type: ${pillar}\n`;
    }

    if (industry) {
      prompt += `Industry: ${industry}\n`;
    }

    if (targetAudience) {
      prompt += `Target Audience: ${targetAudience}\n`;
    }

    if (platforms && platforms.length > 0) {
      prompt += `Platforms: ${platforms.join(', ')}\n`;

      // Platform-specific guidance
      if (platforms.includes('instagram')) {
        prompt += '\nNote: Instagram allows up to 30 hashtags but 8-15 is optimal.\n';
      }
      if (platforms.includes('x') || platforms.includes('twitter')) {
        prompt += '\nNote: For X/Twitter, use fewer hashtags (1-3) for better engagement.\n';
      }
      if (platforms.includes('linkedin')) {
        prompt += '\nNote: For LinkedIn, use 3-5 professional hashtags.\n';
      }
    }

    prompt += '\nGenerate hashtags that are:\n';
    prompt += '- Relevant and specific to the content\n';
    prompt += '- Mix of popular and niche hashtags\n';
    prompt += '- Mix of broad and specific topics\n';
    prompt += '- Industry-appropriate\n';
    prompt += '- NO spaces, NO special characters except #\n';
    prompt += '- Proper capitalization for readability (e.g., #SocialMediaMarketing)\n';
    prompt += '\nReturn ONLY the hashtags separated by spaces, nothing else.';

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
        max_tokens: 150,
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
    const hashtagsText = data.choices[0]?.message?.content?.trim() || '';

    if (!hashtagsText) {
      return NextResponse.json(
        { error: 'No hashtags generated' },
        { status: 500 }
      );
    }

    // Parse hashtags from response
    const hashtags = hashtagsText
      .split(/\s+/)
      .map(tag => tag.trim())
      .filter(tag => tag.startsWith('#'))
      .map(tag => tag.replace(/[^a-zA-Z0-9#_]/g, '')) // Clean special chars
      .slice(0, count); // Limit to requested count

    return NextResponse.json({ hashtags });
  } catch (error: any) {
    console.error('AI hashtag generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate hashtags' },
      { status: 500 }
    );
  }
}
