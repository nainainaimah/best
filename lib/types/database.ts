export type Profile = {
  id: string;
  email: string | null;
  created_at: string;
};

export type Project = {
  id: string;
  user_id: string;
  name: string;
  country_code: string;
  country_name: string;
  market_topic: string;
  goal: string;
  created_at: string;
};

export type MacroCache = {
  id: string;
  country_code: string;
  payload: any;
  fetched_at: string;
};

export type AnalysisRow = {
  id: string;
  project_id: string;
  user_id: string;
  input: any;
  result: any;
  created_at: string;
};
