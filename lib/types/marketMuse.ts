export type TimeSeriesPoint = {
  year: number;
  value: number | null;
};

export type CountryMacro = {
  countryCode: string;
  countryName: string;
  gdpCurrentUsd?: TimeSeriesPoint[];
  gdpPerCapitaUsd?: TimeSeriesPoint[];
  population?: TimeSeriesPoint[];
  unemploymentRatePct?: TimeSeriesPoint[];
  exportsPctGdp?: TimeSeriesPoint[];
  fdiPctGdp?: TimeSeriesPoint[];
};

export type MarketMuseInput = {
  project: {
    id: string;
    name: string;
    countryCode: string;
    countryName: string;
    marketTopic: string;
    goal: string;
  };
  macro: CountryMacro;
};

export type MarketMuseOutput = {
  executive_summary: string;
  market_overview: {
    narrative: string;
    key_metrics: { label: string; value: string; source?: string }[];
  };
  opportunity_analysis: {
    segments: { name: string; description: string; why_now: string }[];
  };
  risk_and_constraints: {
    headline: string;
    details: string[];
    legal_or_regulatory_flags: string[];
    data_limitations: string[];
  };
  scenario_outlook: {
    optimistic: string;
    base_case: string;
    downside: string;
  };
  recommended_next_steps: string[];
  honesty_block: {
    assumptions_made: string[];
    missing_data_to_verify: string[];
    suggested_professional_advisors: string[];
  };
  presentation_outline: {
    title: string;
    slides: { title: string; bullets: string[] }[];
  };
};
