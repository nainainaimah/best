# Troubleshooting Guide

## Authentication & API Errors Fixed

The 500 errors and authentication issues have been resolved. The following changes were made:

1. Updated Supabase client to use `@supabase/ssr` with proper cookie handling
2. Fixed middleware authentication flow
3. Added `force-dynamic` export to all API routes

## Steps to Fix Your Local Environment

### 1. Restart the Development Server

```bash
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

### 2. Verify Database Setup

Make sure you've run the database migrations in Supabase:

1. Go to https://supabase.com/dashboard
2. Select your project: `lokkfeszxxmjwdvjtqbi`
3. Navigate to SQL Editor
4. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
5. Click "Run" to execute

### 3. Clear Browser Data

If you're still having issues:
1. Open DevTools (F12)
2. Go to Application tab
3. Clear all cookies and storage for localhost
4. Refresh the page

### 4. Test the Flow

1. Navigate to http://localhost:3000
2. You should be redirected to `/auth`
3. Sign up with an email and password
4. After signup, you should be redirected to `/dashboard`
5. Click "New Project" to create a project
6. Fill in the form and create the project
7. Click "Run Analysis" to test the AI integration

## Common Issues

### "Host is not supported" Errors
These are from browser extensions and can be ignored.

### 422 Error on Signup
This means the email might already be registered. Try:
- Using a different email
- OR go to Supabase Dashboard > Authentication > Users and delete the test user

### 500 Error on /api/projects
This should now be fixed. If you still see it:
1. Restart your dev server
2. Check that `.env.local` has all the correct values
3. Verify the database migrations have been run

### Infinite Redirect Loop
Clear your browser cookies and try again.

## Verification Checklist

✓ `.env.local` has all 6 environment variables set
✓ Database migrations executed in Supabase SQL Editor
✓ Development server restarted
✓ Browser cookies cleared
✓ Can access http://localhost:3000/auth

## Still Having Issues?

Check the terminal where `npm run dev` is running for error messages. Look for:
- Missing environment variables
- Database connection errors
- Authentication errors

The most common issue is forgetting to run the database migrations.
