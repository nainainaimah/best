-- profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner" on public.profiles
  for select using (auth.uid() = id);

create policy "Profiles are insertable by owner" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Profiles are updatable by owner" on public.profiles
  for update using (auth.uid() = id);

-- projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  country_code text not null,
  country_name text not null,
  market_topic text not null,
  goal text not null,
  created_at timestamptz default now()
);

alter table public.projects enable row level security;

create policy "Projects are viewable by owner" on public.projects
  for select using (auth.uid() = user_id);

create policy "Projects are insertable by owner" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Projects are updatable by owner" on public.projects
  for update using (auth.uid() = user_id);

create policy "Projects are deletable by owner" on public.projects
  for delete using (auth.uid() = user_id);

-- macro_cache table
create table if not exists public.macro_cache (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  payload jsonb not null,
  fetched_at timestamptz default now()
);

alter table public.macro_cache enable row level security;

create policy "Macro cache readable to all authenticated" on public.macro_cache
  for select using (auth.role() = 'authenticated');

create policy "Macro cache insertable to service" on public.macro_cache
  for insert to authenticated with check (true);

-- analyses table
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  input jsonb not null,
  result jsonb not null,
  created_at timestamptz default now()
);

alter table public.analyses enable row level security;

create policy "Analyses viewable by owner" on public.analyses
  for select using (auth.uid() = user_id);

create policy "Analyses insertable by owner" on public.analyses
  for insert with check (auth.uid() = user_id);
