import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getCountryMacro } from '@/lib/data/worldBank';
import { runMarketAnalysis } from '@/lib/ai/openrouterClient';
import type { MarketMuseInput } from '@/lib/types/marketMuse';

export const dynamic = 'force-dynamic';

export async function POST(
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

  try {
    const macro = await getCountryMacro(project.country_code, project.country_name);

    const input: MarketMuseInput = {
      project: {
        id: project.id,
        name: project.name,
        countryCode: project.country_code,
        countryName: project.country_name,
        marketTopic: project.market_topic,
        goal: project.goal,
      },
      macro,
    };

    const result = await runMarketAnalysis(input);

    const { data: analysis, error: insertError } = await supabase
      .from('analyses')
      .insert({
        project_id: project.id,
        user_id: user.id,
        input,
        result,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ analysis });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
