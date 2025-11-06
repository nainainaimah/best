export type Profile = {
  id: string;
  user_id: string;
  display_name: string | null;
  brand_voice: string | null;
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
  created_at: string;
  updated_at: string;
};

export type PushSubscription = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
};
