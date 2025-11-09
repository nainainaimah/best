import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test 1: List buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      return NextResponse.json({
        error: 'Failed to list buckets',
        details: bucketsError
      }, { status: 500 });
    }

    // Test 2: Check if 'uploads' bucket exists
    const uploadsBucket = buckets?.find(b => b.name === 'uploads');

    if (!uploadsBucket) {
      return NextResponse.json({
        error: 'uploads bucket not found',
        availableBuckets: buckets?.map(b => b.name) || []
      }, { status: 404 });
    }

    // Test 3: Try to list files in uploads bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('uploads')
      .list();

    if (filesError) {
      return NextResponse.json({
        error: 'Failed to access uploads bucket',
        details: filesError,
        bucket: uploadsBucket
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Storage is working!',
      bucket: uploadsBucket,
      filesCount: files?.length || 0
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Unexpected error',
      details: error.message
    }, { status: 500 });
  }
}
