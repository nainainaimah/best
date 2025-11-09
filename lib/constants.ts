// PostMuse.ai Constants

export const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F' },
  { id: 'facebook', name: 'Facebook', icon: '👍', color: '#1877F2' },
  { id: 'x', name: 'X (Twitter)', icon: '𝕏', color: '#000000' },
  { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#25D366' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0A66C2' },
  { id: 'blogger', name: 'Blogger', icon: '✍️', color: '#FF5722' },
  { id: 'newsletter', name: 'Newsletter', icon: '📧', color: '#6B7280' },
  { id: 'pinterest', name: 'Pinterest', icon: '📌', color: '#E60023' },
];

export const POST_CATEGORIES = [
  { id: 'LISTING', name: 'Listing', description: 'Property or product listings' },
  { id: 'QUOTE', name: 'Quote', description: 'Inspirational or motivational quotes' },
  { id: 'TIP', name: 'Tip', description: 'Helpful tips and advice' },
  { id: 'STORY', name: 'Story', description: 'Personal or brand stories' },
  { id: 'TUTORIAL', name: 'Tutorial', description: 'How-to guides and tutorials' },
  { id: 'TESTIMONIAL', name: 'Testimonial', description: 'Customer reviews and testimonials' },
  { id: 'ANNOUNCEMENT', name: 'Announcement', description: 'News and announcements' },
  { id: 'BEHIND_THE_SCENES', name: 'Behind the Scenes', description: 'BTS content' },
  { id: 'PRODUCT', name: 'Product', description: 'Product showcases' },
  { id: 'OTHER', name: 'Other', description: 'Other content types' },
];

export const CONTENT_PILLAR_SUGGESTIONS: Record<string, string[]> = {
  'real estate': ['Property Listings', 'Market Tips', 'Testimonials', 'Local Area Guides', 'Home Staging'],
  'fashion': ['Outfit Ideas', 'Style Tips', 'New Arrivals', 'Behind the Scenes', 'Customer Stories'],
  'fitness': ['Workout Tips', 'Nutrition Advice', 'Transformation Stories', 'Exercise Tutorials', 'Motivation'],
  'food': ['Recipes', 'Restaurant Reviews', 'Cooking Tips', 'Food Photography', 'Meal Prep Ideas'],
  'tech': ['Product Reviews', 'Tutorials', 'Industry News', 'Tips & Tricks', 'Tech Comparisons'],
  'beauty': ['Product Reviews', 'Tutorials', 'Before & After', 'Skincare Tips', 'Trends'],
  'travel': ['Destination Guides', 'Travel Tips', 'Packing Lists', 'Travel Stories', 'Local Cuisine'],
  'business': ['Industry Insights', 'Tips & Advice', 'Case Studies', 'Behind the Scenes', 'Team Spotlights'],
  'default': ['Educational Content', 'Inspirational Quotes', 'Behind the Scenes', 'Customer Stories', 'Tips & Tricks'],
};

export const ROLES = [
  { id: 'social_media_manager', name: 'Social Media Manager' },
  { id: 'business_owner', name: 'Business Owner' },
  { id: 'creator', name: 'Content Creator' },
  { id: 'agency', name: 'Agency' },
  { id: 'marketer', name: 'Marketer' },
  { id: 'other', name: 'Other' },
];

export const GRID_PATTERNS = [
  { id: 'checkerboard', name: 'Checkerboard', description: 'Alternating pattern' },
  { id: 'diagonal', name: 'Diagonal', description: 'Diagonal lines across the grid' },
  { id: 'clustered', name: 'Clustered', description: 'Group similar content together' },
  { id: 'none', name: 'None', description: 'No specific pattern' },
];

export const DEFAULT_BRAND_COLORS = {
  primary: '#6366F1', // Indigo
  secondary: '#8B5CF6', // Purple
  accent: '#EC4899', // Pink
};

export const CAPTION_LENGTH_OPTIONS = [
  { id: 'short', name: 'Short', description: 'Under 100 characters', maxChars: 100 },
  { id: 'medium', name: 'Medium', description: '100-250 characters', maxChars: 250 },
  { id: 'long', name: 'Long', description: '250+ characters', maxChars: 500 },
];

export const HASHTAG_COUNT_OPTIONS = [
  { id: 'minimal', name: 'Minimal', count: 3, description: 'Just the essentials' },
  { id: 'standard', name: 'Standard', count: 6, description: 'Good balance' },
  { id: 'extended', name: 'Extended', count: 12, description: 'Maximum reach' },
];
