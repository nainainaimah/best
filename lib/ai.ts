// PostMuse.ai Central AI Helper Module
// Consolidates all AI operations with OpenRouter

import type {
  BrandVoiceData,
  Profile,
  Post,
  AIWeeklyInsights,
  AISuggestedTime,
  GenerateCaptionRequest
} from './types';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// Helper to call OpenRouter API
async function callAI(prompt: string, model: string = 'openai/gpt-4o-mini', maxTokens: number = 500) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': SITE_URL,
      'X-Title': 'PostMuse.ai',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter API error:', response.status, errorText);
    throw new Error(`AI service error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content?.trim() || '';
}

/**
 * Generate a social media caption
 */
export async function generateCaption(params: GenerateCaptionRequest): Promise<string> {
  const {
    topic,
    tone,
    language = 'en',
    maxLength = 250,
    hashtagCount = 6,
    brandVoice,
    platform = 'instagram'
  } = params;

  const brandContext = brandVoice?.summary
    ? `Brand voice: ${brandVoice.summary}\n`
    : '';

  const languageInstruction = language === 'swa'
    ? 'Write in Swahili language.'
    : 'Write in English.';

  const prompt = `
${brandContext}
Generate an engaging ${platform} caption about "${topic}".
${tone ? `Use a ${tone} tone.` : ''}
${languageInstruction}
Keep it under ${maxLength} characters.
Include ${hashtagCount} relevant hashtags at the end.
Make it catchy, authentic, and impactful.
Include relevant emojis where appropriate.
`.trim();

  return await callAI(prompt, 'openai/gpt-4o', 300);
}

/**
 * Summarize brand voice from slider values and preferences
 */
export async function summarizeBrandVoice(
  sliders: { formal_casual?: number; playful_serious?: number; bold_soft?: number },
  likes?: string,
  dislikes?: string
): Promise<string> {
  const getTone = (value: number, lowLabel: string, highLabel: string) => {
    if (value < 30) return `very ${lowLabel}`;
    if (value < 45) return lowLabel;
    if (value < 55) return 'balanced';
    if (value < 70) return highLabel;
    return `very ${highLabel}`;
  };

  const toneDescription = `
Brand voice characteristics:
- Formality: ${getTone(sliders.formal_casual || 50, 'formal', 'casual')}
- Playfulness: ${getTone(sliders.playful_serious || 50, 'playful', 'serious')}
- Boldness: ${getTone(sliders.bold_soft || 50, 'bold', 'soft')}
${likes ? `- Often uses words like: ${likes}` : ''}
${dislikes ? `- Avoids words like: ${dislikes}` : ''}

Generate a 1-2 sentence brand voice summary that captures this tone for use in social media content generation.
  `.trim();

  return await callAI(toneDescription, 'openai/gpt-4o-mini', 100);
}

/**
 * Suggest content pillars based on industry/niche
 */
export async function suggestContentPillars(industry: string, brandName?: string): Promise<string[]> {
  const prompt = `
Given a ${industry} business${brandName ? ` called "${brandName}"` : ''}, suggest 5 content pillar categories for their social media strategy.

Return ONLY a JSON array of 5 short pillar names (2-3 words each), like:
["Industry Tips", "Case Studies", "Behind the Scenes", "Product Showcases", "Customer Stories"]

Industry: ${industry}
`.trim();

  const result = await callAI(prompt, 'openai/gpt-4o-mini', 150);

  try {
    // Extract JSON array from response
    const jsonMatch = result.match(/\[.*\]/s);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('Failed to parse AI pillar suggestions:', err);
  }

  // Fallback
  return ['Educational Content', 'Behind the Scenes', 'Customer Stories', 'Tips & Tricks', 'Industry News'];
}

/**
 * Generate dashboard insights for the week
 */
export async function generateDashboardInsights(
  profile: Profile,
  postsThisWeek: Post[]
): Promise<AIWeeklyInsights> {
  const platformCounts = postsThisWeek.reduce((acc, post) => {
    (post.platforms || []).forEach(platform => {
      acc[platform] = (acc[platform] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const categoryCounts = postsThisWeek.reduce((acc, post) => {
    if (post.category) {
      acc[post.category] = (acc[post.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const prompt = `
You are a social media strategist analyzing a user's posting schedule.

User's brand: ${profile.brand_name || profile.display_name}
Content pillars: ${profile.content_pillars?.join(', ') || 'Not set'}
Enabled platforms: ${profile.platforms?.filter(p => p.enabled).map(p => p.platform).join(', ') || 'None'}

This week's posting plan:
- Total posts: ${postsThisWeek.length}
- Platform breakdown: ${JSON.stringify(platformCounts)}
- Category breakdown: ${JSON.stringify(categoryCounts)}

Generate:
1. A brief 1-sentence summary of their posting activity
2. 2-3 actionable suggestions to improve their content strategy

Return ONLY valid JSON in this format:
{
  "summary": "one sentence here",
  "suggestions": [
    {"text": "suggestion 1", "actionLink": "/dashboard"},
    {"text": "suggestion 2", "actionLink": "/grid"}
  ]
}
`.trim();

  const result = await callAI(prompt, 'openai/gpt-4o-mini', 300);

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('Failed to parse AI insights:', err);
  }

  // Fallback
  return {
    summary: `You have ${postsThisWeek.length} posts scheduled this week.`,
    suggestions: [
      { text: 'Consider posting at optimal times for engagement', actionLink: '/calendar' },
      { text: 'Balance your content across different pillars', actionLink: '/grid' }
    ]
  };
}

/**
 * Suggest optimal posting times for the week
 */
export async function suggestPostingTimes(
  profile: Profile,
  existingPosts: Post[],
  targetPlatform?: string
): Promise<AISuggestedTime[]> {
  const platform = targetPlatform || profile.grid_preferences?.primaryPlatform || 'instagram';
  const existingTimes = existingPosts
    .filter(p => p.scheduled_at)
    .map(p => new Date(p.scheduled_at!).toISOString());

  const prompt = `
You are a social media timing expert.

Platform: ${platform}
Brand industry: ${profile.brand_name || 'general'}
Current posting schedule: ${existingTimes.length > 0 ? existingTimes.join(', ') : 'No scheduled posts'}

Suggest 5 optimal posting times for the next 7 days that:
1. Avoid conflicts with existing posts (at least 4 hours apart)
2. Target peak engagement times for ${platform}
3. Spread across different days
4. Consider typical audience behavior

Return ONLY valid JSON array:
[
  {"date": "2025-11-10", "time": "09:00", "reason": "Morning engagement peak"},
  ...
]
`.trim();

  const result = await callAI(prompt, 'openai/gpt-4o-mini', 400);

  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('Failed to parse AI time suggestions:', err);
  }

  // Fallback: suggest basic times
  const today = new Date();
  const suggestions: AISuggestedTime[] = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i + 1);
    suggestions.push({
      date: date.toISOString().split('T')[0],
      time: i % 2 === 0 ? '09:00' : '15:00',
      reason: 'Suggested optimal time'
    });
  }
  return suggestions;
}

/**
 * Suggest a grid pattern based on user's posts
 */
export async function suggestGridPattern(
  profile: Profile,
  posts: Post[]
): Promise<string> {
  const categoryCounts = posts.reduce((acc, post) => {
    if (post.category) {
      acc[post.category] = (acc[post.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const prompt = `
Analyze this Instagram grid and suggest a visual pattern.

Posts count: ${posts.length}
Category distribution: ${JSON.stringify(categoryCounts)}
Brand style: ${profile.brand_voice_data?.summary || 'Not specified'}

Recommend ONE of these patterns and explain why in 1-2 sentences:
- checkerboard (alternating categories)
- diagonal (categories flow diagonally)
- clustered (group similar content)
- none (chronological is fine)

Return format: "pattern: reason"
`.trim();

  const result = await callAI(prompt, 'openai/gpt-4o-mini', 150);
  return result;
}

/**
 * Evaluate current grid aesthetics
 */
export async function evaluateGrid(
  profile: Profile,
  posts: Post[]
): Promise<string> {
  const categoryCounts = posts.reduce((acc, post) => {
    if (post.category) {
      acc[post.category] = (acc[post.category] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const prompt = `
Evaluate this Instagram grid for visual cohesion.

Posts: ${posts.length}
Categories: ${JSON.stringify(categoryCounts)}
Brand colors: ${JSON.stringify(profile.brand_colors)}

Provide brief feedback (2-3 sentences) on:
1. Visual balance
2. Category distribution
3. One improvement suggestion
`.trim();

  const result = await callAI(prompt, 'openai/gpt-4o-mini', 200);
  return result;
}

/**
 * Rewrite caption for a different platform
 */
export async function rewriteForPlatform(
  caption: string,
  targetPlatform: string,
  brandVoice?: BrandVoiceData
): Promise<string> {
  const brandContext = brandVoice?.summary
    ? `Brand voice: ${brandVoice.summary}\n`
    : '';

  const platformGuidelines: Record<string, string> = {
    instagram: 'Keep it visual, use emojis, hashtags work well',
    linkedin: 'Professional tone, focus on insights and value, minimal emojis',
    x: 'Concise (280 chars max), punchy, use line breaks strategically',
    tiktok: 'Fun, trendy, use current slang, encourage engagement',
    facebook: 'Conversational, longer form okay, ask questions',
    pinterest: 'Descriptive, keyword-rich, actionable'
  };

  const guideline = platformGuidelines[targetPlatform] || platformGuidelines.instagram;

  const prompt = `
${brandContext}
Rewrite this caption for ${targetPlatform}.

Original caption:
${caption}

Guidelines for ${targetPlatform}: ${guideline}

Adapt the tone, length, and style while keeping the core message. Return only the rewritten caption.
`.trim();

  return await callAI(prompt, 'openai/gpt-4o', 300);
}

/**
 * Expand a title/topic into a full post with caption and hashtags
 */
export async function expandToFullPost(
  title: string,
  pillar: string,
  platform: string,
  brandVoice?: BrandVoiceData
): Promise<{ caption: string; hashtags: string[] }> {
  const brandContext = brandVoice?.summary
    ? `Brand voice: ${brandVoice.summary}\n`
    : '';

  const prompt = `
${brandContext}
Create a complete ${platform} post.

Title: ${title}
Content pillar: ${pillar}

Generate:
1. An engaging caption (150-250 characters)
2. 6-8 relevant hashtags

Return ONLY valid JSON:
{
  "caption": "the caption text with emojis",
  "hashtags": ["hashtag1", "hashtag2", ...]
}
`.trim();

  const result = await callAI(prompt, 'openai/gpt-4o', 300);

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error('Failed to parse full post expansion:', err);
  }

  // Fallback
  return {
    caption: `${title} - share your thoughts! 💭`,
    hashtags: ['socialmedia', 'content', pillar.toLowerCase().replace(/\s+/g, '')]
  };
}
