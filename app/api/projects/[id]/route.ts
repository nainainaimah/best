import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  const { data: analyses } = await supabase
    .from('analyses')
    .select('*')
    .eq('project_id', params.id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  const latestAnalysis = analyses && analyses.length > 0 ? analyses[0] : null;

  return NextResponse.json({ project, analysis: latestAnalysis });
}
