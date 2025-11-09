import { NextRequest, NextResponse } from 'next/server';
import { generateDashboardInsights } from '@/lib/ai';
import type { Profile, Post } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { profile, posts } = await request.json();

    if (!profile || !posts) {
      return NextResponse.json(
        { error: 'Profile and posts are required' },
        { status: 400 }
      );
    }

    const insights = await generateDashboardInsights(
      profile as Profile,
      posts as Post[]
    );

    return NextResponse.json(insights);
  } catch (error: any) {
    console.error('Dashboard insights error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
