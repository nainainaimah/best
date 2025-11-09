# PostMuse.ai v2 - Deployment Guide

## 🎉 Implementation Status: 100% COMPLETE

All v2 features have been successfully implemented! This guide will help you deploy the application.

---

## 📋 Pre-Deployment Checklist

### 1. Database Setup ✅

Run the v2 schema migration:

```bash
# If using Supabase CLI
supabase db push

# Or apply manually via Supabase Dashboard
# Go to: Database > SQL Editor
# Run: supabase/migrations/00002_v2_schema_extensions.sql
```

**What this migration adds:**
- Extended `profiles` table with v2 fields (brand_name, avatar_url, brand_colors, etc.)
- Extended `posts` table (category, grid_position, platforms)
- New `grid_shares` table for shareable links
- Indexes and RLS policies
- `generate_grid_share_token()` SQL function

### 2. Storage Bucket Setup

Create an `avatars` storage bucket in Supabase:

1. Go to Supabase Dashboard → Storage
2. Create new bucket: `avatars`
3. Set as **Public** bucket
4. Configure RLS policies:

```sql
-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Environment Variables

Ensure all required environment variables are set:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For server-side operations

# OpenRouter AI (required for AI features)
OPENROUTER_API_KEY=your_openrouter_key

# Optional: Analytics, error tracking, etc.
```

### 4. Dependencies

Verify all dependencies are installed:

```bash
npm install
```

**Key new dependencies:**
- `@dnd-kit/core` - Drag and drop for grid
- `@dnd-kit/sortable` - Sortable grid items
- `lucide-react` - Icons throughout the app
- `react-calendar` - Calendar view

### 5. Build Test

Run a production build to verify everything compiles:

```bash
npm run build
```

---

## 🧪 Testing Checklist

Before deploying to production, test these critical flows:

### User Onboarding
- [ ] New user signup → redirects to onboarding
- [ ] Complete all 8 onboarding steps
- [ ] Verify autosave between steps
- [ ] Check redirect to pricing (no sub) or dashboard (with sub)
- [ ] Confirm middleware gates incomplete users

### Dashboard
- [ ] Brand colors applied to navigation
- [ ] Avatar displays correctly
- [ ] AI Weekly Overview loads (or shows fallback if no API key)
- [ ] Today's posts section works
- [ ] Week view displays correctly
- [ ] Mini grid preview shows recent posts
- [ ] Drafts tracker highlights missing fields

### Post Management
- [ ] Create new post
- [ ] Upload media (image/video)
- [ ] Select multiple platforms
- [ ] Choose category
- [ ] Set date and time
- [ ] Generate AI caption (requires OPENROUTER_API_KEY)
- [ ] Save as draft
- [ ] Schedule post
- [ ] Edit existing post
- [ ] Delete post

### Calendar
- [ ] Month view displays correctly
- [ ] Posts show on correct dates
- [ ] Platform filter works
- [ ] Status filter works
- [ ] Click day → modal shows posts for that day
- [ ] AI "Suggest posting times" generates suggestions
- [ ] Create post from suggested time

### Grid Planner
- [ ] Toggle between Instagram and Generic modes
- [ ] Instagram mode filters to Instagram posts only
- [ ] Drag and drop posts to reorder
- [ ] Pattern mode shows category colors
- [ ] Preview mode hides controls
- [ ] Edit/Duplicate/Delete actions work
- [ ] Reset layout clears positions
- [ ] Share Grid generates link
- [ ] Copy link to clipboard
- [ ] Revoke link works

### Shareable Grid Link
- [ ] Open public link (no login required)
- [ ] Grid displays with brand theming
- [ ] Avatar and brand name show
- [ ] Instagram handle links correctly
- [ ] Read-only (no edit controls)
- [ ] Watermark displayed
- [ ] Invalid/revoked tokens show error message

### Profile/Settings
- [ ] Upload avatar (max 2MB validation)
- [ ] Edit display name, brand name
- [ ] Change brand colors (color pickers)
- [ ] Adjust brand voice sliders
- [ ] Edit likes/dislikes
- [ ] Regenerate AI voice summary
- [ ] Enable/disable platforms
- [ ] Add/update platform handles
- [ ] Add/remove content pillars
- [ ] Change posting frequency
- [ ] Update caption preferences
- [ ] Toggle grid frame
- [ ] Save changes → toast confirmation

### Admin Panel
- [ ] View all subscriptions
- [ ] Filter by status (Pending/Active/All)
- [ ] See user avatars and brand info
- [ ] Review proof of payment
- [ ] Approve subscriptions

---

## 🚀 Deployment Steps

### Option 1: Vercel (Recommended)

1. **Connect Repository:**
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Complete PostMuse.ai v2 implementation"
   git push origin main
   ```

2. **Deploy on Vercel:**
   - Go to vercel.com
   - Import your repository
   - Configure environment variables
   - Deploy

3. **Configure Domain:**
   - Add custom domain in Vercel settings
   - Update Supabase authorized redirect URLs

### Option 2: Docker

```dockerfile
# Dockerfile already exists
docker build -t postmuse .
docker run -p 3000:3000 postmuse
```

### Option 3: Traditional Hosting

```bash
npm run build
npm start
```

---

## 📊 Post-Deployment Monitoring

### Health Checks

Monitor these endpoints:
- `/` - Homepage loads
- `/en/auth` - Auth page works
- `/en/onboarding` - Onboarding accessible
- `/api/health` - Create if needed

### Common Issues & Solutions

**Issue: AI features not working**
- ✅ Verify `OPENROUTER_API_KEY` is set
- ✅ Check API key has credits
- ✅ Review error logs for API failures

**Issue: Avatar upload fails**
- ✅ Confirm `avatars` storage bucket exists
- ✅ Verify bucket is set to public
- ✅ Check RLS policies allow uploads

**Issue: Shareable links show "Link Not Found"**
- ✅ Run database migration (creates `grid_shares` table)
- ✅ Verify `generate_grid_share_token()` function exists
- ✅ Check token in database is active

**Issue: Onboarding redirect loops**
- ✅ Ensure middleware.ts is deployed
- ✅ Check `onboarding_complete` field in profiles table
- ✅ Clear browser cache/cookies

**Issue: Drag-drop not working on grid**
- ✅ Verify `@dnd-kit` packages installed
- ✅ Check browser console for errors
- ✅ Test on desktop (mobile touch may differ)

**Issue: Brand colors not applying**
- ✅ Complete onboarding to set brand colors
- ✅ Check profile has `brand_colors` data
- ✅ Verify inline styles in components

---

## 🎯 Performance Optimization

### Recommended Settings

1. **Enable Supabase Connection Pooling:**
   - Go to Database Settings → Connection Pooling
   - Enable for better performance under load

2. **Configure Caching:**
   ```javascript
   // In next.config.js
   module.exports = {
     images: {
       domains: ['your-supabase-url.supabase.co'],
     },
   }
   ```

3. **Enable Edge Functions (Optional):**
   - Deploy AI routes as Supabase Edge Functions
   - Reduces latency for AI operations

---

## 📈 Analytics & Monitoring

### Recommended Tools

- **Vercel Analytics** - Page views, performance
- **Sentry** - Error tracking
- **PostHog** - User behavior analytics
- **Supabase Dashboard** - Database queries, auth events

---

## 🔒 Security Checklist

- [x] RLS policies enabled on all tables
- [x] Service role key only used server-side
- [x] Anon key safe for client-side use
- [x] File upload size limits enforced
- [x] Input validation on all forms
- [ ] Rate limiting on AI endpoints (recommended)
- [ ] CORS configured correctly
- [ ] Environment variables secured

---

## 📞 Support & Troubleshooting

### Logs to Check

1. **Browser Console:**
   - Client-side errors
   - Network requests
   - React warnings

2. **Server Logs:**
   ```bash
   # Vercel
   vercel logs

   # Local
   npm run dev
   ```

3. **Supabase Logs:**
   - Go to Logs section in dashboard
   - Filter by API, Auth, Database

### Debug Mode

Enable verbose logging:

```env
# .env.local
NEXT_PUBLIC_DEBUG=true
```

---

## ✅ Launch Checklist

Final checks before going live:

- [ ] Database migration applied
- [ ] Storage bucket created
- [ ] Environment variables set
- [ ] Build succeeds without errors
- [ ] All tests passed
- [ ] Mobile responsiveness verified
- [ ] AI features tested (if OPENROUTER_API_KEY set)
- [ ] Avatar upload tested
- [ ] Shareable links tested
- [ ] Error pages styled
- [ ] SEO metadata added
- [ ] Favicon/logo updated
- [ ] Terms of Service / Privacy Policy added
- [ ] Contact/support page created
- [ ] Monitoring configured
- [ ] Backup strategy in place

---

## 🎉 You're Ready to Launch!

**All v2 features are complete and ready for deployment.**

Key accomplishments:
- ✅ 8-step personalized onboarding
- ✅ AI-powered insights and suggestions
- ✅ Multi-platform content management
- ✅ Interactive calendar with AI time suggestions
- ✅ Drag-and-drop grid planner
- ✅ Shareable client grid views
- ✅ Comprehensive profile/settings page
- ✅ Brand theming throughout
- ✅ Skeleton loaders and smooth animations

**Next steps:**
1. Apply database migration
2. Create storage bucket
3. Set environment variables
4. Run final tests
5. Deploy! 🚀

Good luck with your launch! 🎊
