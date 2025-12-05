# MarketMuse.ai – Phase 1

International market research powered by AI.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with your credentials:

```bash
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

3. Run database migrations in Supabase SQL Editor:

Execute the SQL from `supabase/migrations/001_initial_schema.sql`

4. Start development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Features

- Email/password authentication
- Create market research projects
- AI-powered analysis using Claude via OpenRouter
- World Bank macro-economic data integration
- Export analysis as Markdown or slide outline
- Beautiful dashboard UI

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Auth + Database)
- OpenRouter (Claude API)
