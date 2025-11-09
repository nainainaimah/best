import { NextRequest, NextResponse } from 'next/server';
import { suggestPostingTimes } from '@/lib/ai';
import type { Profile, Post } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { profile, existingPosts, targetPlatform } = await request.json();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile is required' },
        { status: 400 }
      );
    }

    const suggestions = await suggestPostingTimes(
      profile as Profile,
      (existingPosts || []) as Post[],
      targetPlatform
    );

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error('Time suggestions error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate time suggestions' },
      { status: 500 }
    );
  }
}
