-- PostMuse.ai v2 Schema Extensions
-- This migration extends the existing schema with new fields for enhanced branding, AI, and grid features

-- ============================================
-- 1. EXTEND PROFILES TABLE
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS brand_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS brand_colors JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS brand_voice_data JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS platforms JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS content_pillars JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS posting_habits JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS caption_preferences JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS grid_preferences JSONB DEFAULT '{}';

-- Update brand_voice column comment for clarity (TEXT field stays for backward compatibility)
COMMENT ON COLUMN profiles.brand_voice IS 'Legacy text field - v2 uses brand_voice_data JSONB';
COMMENT ON COLUMN profiles.brand_voice_data IS 'Brand voice data with sliders, likes, dislikes, and AI summary';

-- Add index for onboarding checks
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_complete ON profiles(onboarding_complete);

-- ============================================
-- 2. EXTEND POSTS TABLE
-- ============================================

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS grid_position INTEGER,
  ADD COLUMN IF NOT EXISTS platforms JSONB DEFAULT '[]';

-- Add indexes for grid and category queries
CREATE INDEX IF NOT EXISTS idx_posts_grid_position ON posts(grid_position) WHERE grid_position IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category) WHERE category IS NOT NULL;

-- Add GIN index for JSONB platform queries
CREATE INDEX IF NOT EXISTS idx_posts_platforms ON posts USING GIN (platforms);

-- ============================================
-- 3. CREATE GRID_SHARES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS grid_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  CONSTRAINT token_length CHECK (LENGTH(token) >= 16)
);

-- Create indexes for grid_shares
CREATE INDEX IF NOT EXISTS idx_grid_shares_user_id ON grid_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_grid_shares_token ON grid_shares(token) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_grid_shares_active ON grid_shares(is_active);

-- Enable Row Level Security
ALTER TABLE grid_shares ENABLE ROW LEVEL SECURITY;

-- Grid shares policies (user management)
CREATE POLICY "Users can view own grid shares"
  ON grid_shares FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own grid shares"
  ON grid_shares FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grid shares"
  ON grid_shares FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own grid shares"
  ON grid_shares FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Function to generate a secure random token for grid shares
CREATE OR REPLACE FUNCTION generate_grid_share_token()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..32 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. DATA MIGRATION / BACKFILL
-- ============================================

-- Backfill existing users with default preferences
UPDATE profiles
SET
  caption_preferences = COALESCE(caption_preferences, '{
    "defaultLength": "medium",
    "defaultHashtagCount": 6,
    "hashtagPlacement": "separate",
    "defaultLanguage": "en"
  }'::jsonb),
  grid_preferences = COALESCE(grid_preferences, '{
    "primaryPlatform": "instagram",
    "careAboutPatterns": false,
    "pattern": "none",
    "showBrandFrame": false,
    "showPlatformIcons": true,
    "showCategoryLabels": false
  }'::jsonb)
WHERE caption_preferences = '{}' OR grid_preferences = '{}';

-- ============================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE grid_shares IS 'Shareable read-only grid links for client previews';
COMMENT ON COLUMN profiles.brand_colors IS 'JSON object with primary, secondary, and accent colors (HEX format)';
COMMENT ON COLUMN profiles.platforms IS 'Array of platform objects with platform, enabled, handle, url, defaultAspect';
COMMENT ON COLUMN profiles.content_pillars IS 'Array of content pillar names (strings)';
COMMENT ON COLUMN profiles.posting_habits IS 'Preferred posting days, times, and frequency';
COMMENT ON COLUMN profiles.caption_preferences IS 'Default caption length, hashtag count, placement, language';
COMMENT ON COLUMN profiles.grid_preferences IS 'Grid display preferences: platform, patterns, frames, icons';
COMMENT ON COLUMN posts.category IS 'Content category (LISTING, QUOTE, TIP, STORY, etc.)';
COMMENT ON COLUMN posts.grid_position IS 'Manual grid ordering position (NULL = auto-sort by date)';
COMMENT ON COLUMN posts.platforms IS 'Array of platforms this post is intended for';
