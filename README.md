# PostMuse.ai

AI-Powered Social Content Assistant built with Next.js 14, Supabase, and OpenRouter.

## Summary

PostMuse.ai is a complete SaaS application that helps content creators generate AI-powered Instagram captions, schedule posts, visualize their content grid, and manage posting workflows. The app uses manual payment processing via Selcom bank transfer with admin approval, AI caption generation via OpenRouter, and supports both English and Swahili languages.

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Database & Auth**: Supabase
- **Styling**: Tailwind CSS
- **Internationalization**: next-intl (English + Swahili)
- **AI**: OpenRouter (GPT-4o)
- **Testing**: Jest + Playwright

## Features

- User authentication with Supabase Auth
- Manual payment system with Selcom bank transfer
- Admin dashboard for subscription approval
- AI-powered caption generation
- Content calendar with scheduling
- 3×3 Instagram grid planner
- Post Now feature with clipboard + Instagram deep link
- Multilingual support (English/Swahili)
- Simple in-app and browser notifications
- Comprehensive test coverage

## Project Structure

```
postmuse-ai/
├── app/
│   ├── [locale]/
│   │   ├── admin/
│   │   │   └── page.tsx
│   │   ├── auth/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── grid/
│   │   │   └── page.tsx
│   │   ├── onboarding/
│   │   │   └── page.tsx
│   │   ├── post/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── pricing/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/
│   │   └── ai/
│   │       └── generate-caption/
│   │           └── route.ts
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── LanguageToggle.tsx
│   ├── PlanCard.tsx
│   ├── PostNowButton.tsx
│   └── UploadProof.tsx
├── e2e/
│   └── basic-flow.spec.ts
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   └── types.ts
├── messages/
│   ├── en.json
│   └── swa.json
├── supabase/
│   └── migrations/
│       └── 00001_initial_schema.sql
├── __tests__/
│   ├── LanguageToggle.test.tsx
│   └── PostNowButton.test.tsx
├── .env.example
├── .gitignore
├── i18n.ts
├── jest.config.js
├── jest.setup.js
├── middleware.ts
├── next.config.js
├── package.json
├── playwright.config.ts
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_api_key
ADMIN_EMAILS=admin@example.com
```

### 2. Supabase Setup

1. Create a new Supabase project at https://supabase.com
2. Run the migration in `supabase/migrations/00001_initial_schema.sql` in the Supabase SQL Editor
3. Create a storage bucket named `uploads` with public access for payment proof screenshots
4. Copy your project URL and anon key to `.env.local`

### 3. OpenRouter Setup

1. Create an account at https://openrouter.ai
2. Generate an API key
3. Add the key to `.env.local`

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm test             # Run Jest tests
npm run test:watch   # Run Jest in watch mode
npm run test:e2e     # Run Playwright E2E tests
npm run test:e2e:ui  # Run Playwright with UI
```

## Deployment to Netlify

1. Push your code to a Git repository
2. Connect your repository to Netlify
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Add environment variables in Netlify dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENROUTER_API_KEY`
   - `ADMIN_EMAILS`
5. Deploy!

## User Flow

### New User Registration

1. Visit landing page and click "Sign Up"
2. Create account with email/password
3. Complete onboarding (display name, brand voice)
4. View pricing page with Selcom payment details
5. Make bank transfer and upload payment proof
6. Wait for admin approval

### Admin Approval

1. Admin visits `/admin` page
2. Reviews pending subscriptions
3. Views payment screenshots
4. Approves or rejects subscriptions

### Content Creation

1. User accesses dashboard after approval
2. Creates new post with title and caption
3. Uses AI to generate caption (optional)
4. Schedules post for specific date/time
5. Views posts in calendar or 3×3 grid
6. Uses "Post Now" to copy caption and open Instagram

## Payment Details (Selcom)

**Bank**: Selcom Microfinance Bank Tanzania Limited
**Account Name**: NAIMAN PASCAL KUNAMBI
**Account Number**: 55251 03068 129 OR 255 623 580 603
**Currency**: TZS
**SWIFT**: ACTZT ZTZ

**Plans**:
- Monthly: TZS 9,999
- Yearly: TZS 99,999

## Testing

### Unit Tests

```bash
npm test
```

Tests cover:
- LanguageToggle component (locale switching)
- PostNowButton component (clipboard and deep linking)

### E2E Tests

```bash
npm run test:e2e
```

Tests cover:
- Landing page navigation
- Auth page functionality
- Pricing page display
- Language toggle

## Internationalization

The app supports two locales:
- English (`en`)
- Swahili (`swa`)

Translations are stored in `messages/en.json` and `messages/swa.json`. Users can toggle between languages using the LanguageToggle component in the navigation bar.

## Database Schema

### profiles
- User profile information
- Brand voice settings

### subscriptions
- Payment records
- Subscription status (pending/active/rejected/cancelled)
- Admin approval tracking

### posts
- Post content (title, caption)
- Scheduling information
- Status (draft/scheduled/posted)

### push_subscriptions
- Reserved for future push notification features

## Features Explained

### AI Caption Generation

Uses OpenRouter's GPT-4o model to generate engaging Instagram captions based on:
- Topic
- Tone (optional)
- Language (English or Swahili)

### Post Now Button

1. Copies caption to clipboard using Navigator Clipboard API
2. Attempts to open Instagram via deep link (`instagram://camera`)
3. Shows fallback modal with instructions if deep link fails

### Grid Planner

Displays next 9 scheduled posts in a 3×3 grid to preview Instagram feed layout.

### Admin Dashboard

Protected route (access controlled by `ADMIN_EMAILS` env variable) where admins can:
- View all subscriptions
- Filter by pending status
- Approve or reject payments
- View payment proof screenshots

## Middleware Protection

Protected routes require:
- Authentication (via Supabase Auth)
- Active subscription (except onboarding)
- Admin email (for `/admin` route only)

## License

MIT

## Support

For issues and feature requests, contact the development team.
