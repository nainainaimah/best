// PostMuse.ai v2 TypeScript Types

// ============================================
// Brand & Onboarding Types
// ============================================

export type BrandColors = {
  primary?: string;
  secondary?: string;
  accent?: string;
};

export type BrandVoiceSliders = {
  formal_casual?: number; // 0-100, 0=very formal, 100=very casual
  playful_serious?: number; // 0-100, 0=very playful, 100=very serious
  bold_soft?: number; // 0-100, 0=very bold, 100=very soft
};

export type BrandVoiceData = {
  role?: string; // Social media manager, Business owner, Creator, etc.
  sliders?: BrandVoiceSliders;
  likes?: string; // Words I use often
  dislikes?: string; // Words to avoid
  summary?: string; // AI-generated tone summary
};

export type Platform = {
  platform: string; // instagram, facebook, x, tiktok, whatsapp, linkedin, blogger, newsletter, pinterest, other
  enabled: boolean;
  handle?: string; // e.g., @postmuse
  url?: string; // Profile URL
  defaultAspect?: string; // e.g., "1:1", "4:5", "9:16"
};

export type PostingHabits = {
  desiredDays?: string[]; // ["monday", "wednesday", "friday"]
  desiredTimes?: string[]; // ["09:00", "15:00"]
  frequency?: string; // "3x per week", "daily", etc.
};

export type CaptionPreferences = {
  defaultLength?: 'short' | 'medium' | 'long' | 'custom';
  customMaxChars?: number;
  defaultHashtagCount?: number; // 3, 6, 10+
  hashtagPlacement?: 'inline' | 'separate';
  defaultLanguage?: 'en' | 'swa' | 'both';
};

export type GridPreferences = {
  primaryPlatform?: 'generic' | 'instagram' | 'pinterest';
  careAboutPatterns?: boolean;
  pattern?: 'checkerboard' | 'diagonal' | 'clustered' | 'none';
  showBrandFrame?: boolean;
  showPlatformIcons?: boolean;
  showCategoryLabels?: boolean;
};

// ============================================
// Database Table Types
// ============================================

export type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
  brand_name: string | null;
  avatar_url: string | null;
  brand_voice: string | null; // Legacy TEXT field
  brand_voice_data: BrandVoiceData;
  onboarding_complete: boolean;
  brand_colors: BrandColors;
  platforms: Platform[];
  content_pillars: string[]; // Array of pillar names
  posting_habits: PostingHabits;
  caption_preferences: CaptionPreferences;
  grid_preferences: GridPreferences;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: 'monthly' | 'yearly';
  status: 'pending' | 'active' | 'rejected' | 'cancelled';
  reference_number: string | null;
  screenshot_url: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  title: string;
  caption: string;
  media_url: string | null;
  status: 'draft' | 'scheduled' | 'posted';
  scheduled_at: string | null;
  category: string | null; // LISTING, QUOTE, TIP, STORY, etc.
  grid_position: number | null; // Manual ordering for grid
  platforms: string[]; // Array of platform names
  created_at: string;
  updated_at: string;
  hashtags?: string[];
};

export type GridShare = {
  id: string;
  user_id: string;
  token: string;
  is_active: boolean;
  title: string | null;
  created_at: string;
  revoked_at: string | null;
};

export type PushSubscription = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};

// ============================================
// UI & Component Types
// ============================================

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type PostCategory =
  | 'LISTING'
  | 'QUOTE'
  | 'TIP'
  | 'STORY'
  | 'TUTORIAL'
  | 'TESTIMONIAL'
  | 'ANNOUNCEMENT'
  | 'BEHIND_THE_SCENES'
  | 'PRODUCT'
  | 'OTHER';

// ============================================
// AI Request/Response Types
// ============================================

export type GenerateCaptionRequest = {
  topic: string;
  tone?: string;
  language?: 'en' | 'swa';
  maxLength?: number;
  hashtagCount?: number;
  brandVoice?: BrandVoiceData;
  platform?: string;
};

export type GenerateCaptionResponse = {
  caption: string;
  hashtags?: string[];
  error?: string;
};

export type AIWeeklyInsights = {
  summary: string;
  suggestions: Array<{
    text: string;
    actionLink?: string;
  }>;
};

export type AISuggestedTime = {
  date: string; // ISO date string
  time: string; // HH:mm format
  reason?: string; // Why this time is suggested
};
