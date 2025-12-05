import { createSupabaseServerClient } from '../supabase/server';
import type { TimeSeriesPoint, CountryMacro } from '../types/marketMuse';

const WORLD_BANK_BASE = 'https://api.worldbank.org/v2';

type WorldBankResponse = Array<any>;

async function fetchIndicator(
  countryCode: string,
  indicator: string
): Promise<TimeSeriesPoint[]> {
  const url = `${WORLD_BANK_BASE}/country/${countryCode}/indicator/${indicator}?format=json&per_page=100`;

  const res = await fetch(url);
  if (!res.ok) {
    return [];
  }

  const data: WorldBankResponse = await res.json();
  if (!Array.isArray(data) || data.length < 2) {
    return [];
  }

  const records = data[1];
  if (!Array.isArray(records)) {
    return [];
  }

  return records
    .map((r: any) => ({
      year: parseInt(r.date, 10),
      value: r.value !== null && r.value !== undefined ? parseFloat(r.value) : null,
    }))
    .filter((p: TimeSeriesPoint) => !isNaN(p.year))
    .sort((a, b) => a.year - b.year);
}

export async function getCountryMacro(
  countryCode: string,
  countryName: string
): Promise<CountryMacro> {
  const supabase = createSupabaseServerClient();

  const { data: cached } = await supabase
    .from('macro_cache')
    .select('*')
    .eq('country_code', countryCode)
    .gte('fetched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('fetched_at', { ascending: false })
    .limit(1)
    .single();

  if (cached && cached.payload) {
    return cached.payload as CountryMacro;
  }

  const [gdpCurrentUsd, gdpPerCapitaUsd, population, unemploymentRatePct, exportsPctGdp, fdiPctGdp] =
    await Promise.all([
      fetchIndicator(countryCode, 'NY.GDP.MKTP.CD'),
      fetchIndicator(countryCode, 'NY.GDP.PCAP.CD'),
      fetchIndicator(countryCode, 'SP.POP.TOTL'),
      fetchIndicator(countryCode, 'SL.UEM.TOTL.ZS'),
      fetchIndicator(countryCode, 'NE.EXP.GNFS.ZS'),
      fetchIndicator(countryCode, 'BX.KLT.DINV.WD.GD.ZS'),
    ]);

  const macro: CountryMacro = {
    countryCode,
    countryName,
    gdpCurrentUsd,
    gdpPerCapitaUsd,
    population,
    unemploymentRatePct,
    exportsPctGdp,
    fdiPctGdp,
  };

  await supabase.from('macro_cache').insert({
    country_code: countryCode,
    payload: macro,
    fetched_at: new Date().toISOString(),
  });

  return macro;
}
