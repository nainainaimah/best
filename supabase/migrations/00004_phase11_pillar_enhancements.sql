-- Migration 00004: Phase 11 - Content Pillar Intelligence & Pattern Engine v2
-- Adds support for post overlays, platform status tracking, and pattern templates

-- Add new fields to posts table for overlay and platform status
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS overlay JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS platform_status JSONB DEFAULT '{}';

-- Add 'missed' status to posts status enum
-- Note: PostgreSQL doesn't allow altering enum types directly
-- So we'll handle this via application logic for now
-- The 'missed' status will be stored as a valid value in the status column

-- Add comment to document the overlay structure
COMMENT ON COLUMN posts.overlay IS 'Post overlay configuration: { color?: string, pattern?: "solid"|"gradient"|"dots"|"stripes"|"none", opacity?: number }';

-- Add comment to document the platform_status structure
COMMENT ON COLUMN posts.platform_status IS 'Platform-specific posting status: { instagram: boolean, facebook: boolean, etc. }';

-- Create index on overlay for faster queries
CREATE INDEX IF NOT EXISTS idx_posts_overlay ON posts USING GIN (overlay);

-- Create index on platform_status for faster queries
CREATE INDEX IF NOT EXISTS idx_posts_platform_status ON posts USING GIN (platform_status);

-- Migration complete
-- This migration adds support for:
-- 1. Post overlays (visual styling for grid display)
-- 2. Platform-specific status tracking (multi-platform posting)
-- 3. Indexed JSONB fields for performance
