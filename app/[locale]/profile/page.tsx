'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import LanguageToggle from '@/components/LanguageToggle';
import LogoutButton from '@/components/LogoutButton';
import Toast from '@/components/Toast';
import type { Profile, Platform } from '@/lib/types';
import { PLATFORMS, POST_CATEGORIES, CONTENT_PILLAR_SUGGESTIONS } from '@/lib/constants';
import { User, Palette, MessageSquare, Settings, Grid3x3, FileText } from 'lucide-react';

export default function ProfilePage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'brand' | 'platforms' | 'content' | 'preferences'>('basic');
  const [profile, setProfile] = useState<Partial<Profile>>({
    display_name: '',
    brand_name: '',
    avatar_url: '',
    brand_colors: { primary: '#6366F1', secondary: '#EC4899' },
    brand_voice_data: {
      role: '',
      sliders: {
        casual_professional: 5,
        playful_serious: 5,
        short_detailed: 5,
        formal_conversational: 5,
      },
      likes: '',
      dislikes: '',
      summary: '',
    },
    platforms: [],
    content_pillars: [],
    caption_preferences: {
      default_emoji_count: 'medium',
      default_hashtag_count: 'medium',
      default_cta_style: 'subtle',
    },
    grid_preferences: {
      showBrandFrame: false,
      preferredPattern: 'checkerboard',
    },
    posting_habits: {
      preferred_times: [],
      frequency: 'daily',
    },
  });
  const [userEmail, setUserEmail] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [regeneratingVoice, setRegeneratingVoice] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email || '');

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (profileData) {
        setProfile({
          display_name: profileData.display_name || '',
          brand_name: profileData.brand_name || '',
          avatar_url: profileData.avatar_url || '',
          brand_colors: profileData.brand_colors || { primary: '#6366F1', secondary: '#EC4899' },
          brand_voice_data: profileData.brand_voice_data || {
            role: '',
            sliders: {
              casual_professional: 5,
              playful_serious: 5,
              short_detailed: 5,
              formal_conversational: 5,
            },
            likes: '',
            dislikes: '',
            summary: '',
          },
          platforms: profileData.platforms || [],
          content_pillars: profileData.content_pillars || [],
          caption_preferences: profileData.caption_preferences || {
            default_emoji_count: 'medium',
            default_hashtag_count: 'medium',
            default_cta_style: 'subtle',
          },
          grid_preferences: profileData.grid_preferences || {
            showBrandFrame: false,
            preferredPattern: 'checkerboard',
          },
          posting_habits: profileData.posting_habits || {
            preferred_times: [],
            frequency: 'daily',
          },
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be less than 2MB', 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setProfile({ ...profile, avatar_url: publicUrl });
      showToast('Avatar uploaded successfully!', 'success');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      showToast(error.message || 'Failed to upload avatar', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRegenerateVoice = async () => {
    setRegeneratingVoice(true);
    try {
      const response = await fetch('/api/ai/summarize-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sliders: profile.brand_voice_data?.sliders,
          likes: profile.brand_voice_data?.likes,
          dislikes: profile.brand_voice_data?.dislikes,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate summary');

      const data = await response.json();
      setProfile({
        ...profile,
        brand_voice_data: {
          ...profile.brand_voice_data!,
          summary: data.summary,
        },
      });
      showToast('Brand voice summary regenerated!', 'success');
    } catch (error: any) {
      console.error('Error regenerating voice:', error);
      showToast(error.message || 'Failed to regenerate voice', 'error');
    } finally {
      setRegeneratingVoice(false);
    }
  };

  const togglePlatform = (platformId: string) => {
    const platforms = profile.platforms || [];
    const existingIndex = platforms.findIndex((p: Platform) => p.platform === platformId);

    if (existingIndex >= 0) {
      // Remove platform
      setProfile({
        ...profile,
        platforms: platforms.filter((p: Platform) => p.platform !== platformId),
      });
    } else {
      // Add platform
      setProfile({
        ...profile,
        platforms: [...platforms, { platform: platformId, handle: '', enabled: true }],
      });
    }
  };

  const updatePlatformHandle = (platformId: string, handle: string) => {
    const platforms = profile.platforms || [];
    const updatedPlatforms = platforms.map((p: Platform) =>
      p.platform === platformId ? { ...p, handle } : p
    );
    setProfile({ ...profile, platforms: updatedPlatforms });
  };

  const addContentPillar = () => {
    const pillar = prompt('Enter a new content pillar:');
    if (pillar && pillar.trim()) {
      setProfile({
        ...profile,
        content_pillars: [...(profile.content_pillars || []), pillar.trim()],
      });
    }
  };

  const removeContentPillar = (index: number) => {
    setProfile({
      ...profile,
      content_pillars: (profile.content_pillars || []).filter((_, i) => i !== index),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: profile.display_name,
          brand_name: profile.brand_name,
          avatar_url: profile.avatar_url,
          brand_colors: profile.brand_colors,
          brand_voice_data: profile.brand_voice_data,
          platforms: profile.platforms,
          content_pillars: profile.content_pillars,
          caption_preferences: profile.caption_preferences,
          grid_preferences: profile.grid_preferences,
          posting_habits: profile.posting_habits,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      showToast('Profile updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error saving profile:', error);
      showToast(error.message || 'Failed to save profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const brandColor = profile.brand_colors?.primary || '#6366F1';

  const tabs = [
    { id: 'basic' as const, label: 'Basic Info', icon: User },
    { id: 'brand' as const, label: 'Brand Voice', icon: MessageSquare },
    { id: 'platforms' as const, label: 'Platforms', icon: Settings },
    { id: 'content' as const, label: 'Content', icon: FileText },
    { id: 'preferences' as const, label: 'Preferences', icon: Grid3x3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b-4" style={{ borderColor: brandColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href={`/${locale}/dashboard`}>
              <h1 className="text-2xl font-bold" style={{ color: brandColor }}>
                PostMuse.ai
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link href={`/${locale}/dashboard`} className="btn btn-secondary">
                📊 Dashboard
              </Link>
              <LanguageToggle />
              <LogoutButton locale={locale} />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href={`/${locale}/dashboard`} className="text-primary-600 hover:underline mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h2 className="text-3xl font-bold mb-2">⚙️ Profile & Settings</h2>
          <p className="text-gray-600">Customize your brand identity and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="card">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4">Basic Information</h3>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="input bg-gray-100 cursor-not-allowed"
                />
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {/* Avatar */}
              <div>
                <label className="block text-sm font-medium mb-2">Avatar</label>
                <div className="flex items-center gap-4">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-20 h-20 rounded-full object-cover border-4"
                      style={{ borderColor: brandColor }}
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                      style={{ backgroundColor: brandColor }}
                    >
                      {(profile.display_name || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <label className="btn btn-secondary cursor-pointer">
                      {uploadingAvatar ? 'Uploading...' : 'Upload New Avatar'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">Max 2MB, JPG or PNG</p>
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <input
                  type="text"
                  value={profile.display_name || ''}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  className="input"
                  placeholder="Your name"
                />
              </div>

              {/* Brand Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Brand Name</label>
                <input
                  type="text"
                  value={profile.brand_name || ''}
                  onChange={(e) => setProfile({ ...profile, brand_name: e.target.value })}
                  className="input"
                  placeholder="Your business/brand name"
                />
              </div>

              {/* Brand Colors */}
              <div>
                <label className="block text-sm font-medium mb-4">Brand Colors</label>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm mb-2">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={profile.brand_colors?.primary || '#6366F1'}
                        onChange={(e) => setProfile({
                          ...profile,
                          brand_colors: { ...profile.brand_colors!, primary: e.target.value }
                        })}
                        className="w-16 h-10 rounded border-2 border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={profile.brand_colors?.primary || '#6366F1'}
                        onChange={(e) => setProfile({
                          ...profile,
                          brand_colors: { ...profile.brand_colors!, primary: e.target.value }
                        })}
                        className="input flex-1"
                        placeholder="#6366F1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm mb-2">Secondary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={profile.brand_colors?.secondary || '#EC4899'}
                        onChange={(e) => setProfile({
                          ...profile,
                          brand_colors: { ...profile.brand_colors!, secondary: e.target.value }
                        })}
                        className="w-16 h-10 rounded border-2 border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={profile.brand_colors?.secondary || '#EC4899'}
                        onChange={(e) => setProfile({
                          ...profile,
                          brand_colors: { ...profile.brand_colors!, secondary: e.target.value }
                        })}
                        className="input flex-1"
                        placeholder="#EC4899"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Brand Voice Tab */}
          {activeTab === 'brand' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Brand Voice</h3>
                <button
                  onClick={handleRegenerateVoice}
                  disabled={regeneratingVoice}
                  className="btn btn-secondary text-sm"
                >
                  {regeneratingVoice ? 'Regenerating...' : '✨ Regenerate AI Summary'}
                </button>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium mb-2">Your Role/Industry</label>
                <input
                  type="text"
                  value={profile.brand_voice_data?.role || ''}
                  onChange={(e) => setProfile({
                    ...profile,
                    brand_voice_data: { ...profile.brand_voice_data!, role: e.target.value }
                  })}
                  className="input"
                  placeholder="e.g., Fitness Coach, SaaS Founder, Fashion Designer"
                />
              </div>

              {/* Voice Sliders */}
              <div className="space-y-4">
                <h4 className="font-semibold">Tone Preferences</h4>

                {[
                  { key: 'casual_professional', left: 'Casual', right: 'Professional' },
                  { key: 'playful_serious', left: 'Playful', right: 'Serious' },
                  { key: 'short_detailed', left: 'Short & Punchy', right: 'Detailed' },
                  { key: 'formal_conversational', left: 'Formal', right: 'Conversational' },
                ].map(({ key, left, right }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>{left}</span>
                      <span className="font-semibold text-primary-600">
                        {profile.brand_voice_data?.sliders?.[key as keyof typeof profile.brand_voice_data.sliders] || 5}
                      </span>
                      <span>{right}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={profile.brand_voice_data?.sliders?.[key as keyof typeof profile.brand_voice_data.sliders] || 5}
                      onChange={(e) => setProfile({
                        ...profile,
                        brand_voice_data: {
                          ...profile.brand_voice_data!,
                          sliders: {
                            ...profile.brand_voice_data!.sliders!,
                            [key]: parseInt(e.target.value),
                          }
                        }
                      })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                    />
                  </div>
                ))}
              </div>

              {/* Likes/Dislikes */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">What to Include</label>
                  <textarea
                    value={profile.brand_voice_data?.likes || ''}
                    onChange={(e) => setProfile({
                      ...profile,
                      brand_voice_data: { ...profile.brand_voice_data!, likes: e.target.value }
                    })}
                    className="input min-h-[100px]"
                    placeholder="e.g., motivational quotes, emojis, questions"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">What to Avoid</label>
                  <textarea
                    value={profile.brand_voice_data?.dislikes || ''}
                    onChange={(e) => setProfile({
                      ...profile,
                      brand_voice_data: { ...profile.brand_voice_data!, dislikes: e.target.value }
                    })}
                    className="input min-h-[100px]"
                    placeholder="e.g., jargon, negativity, politics"
                  />
                </div>
              </div>

              {/* AI Summary */}
              {profile.brand_voice_data?.summary && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">✨ AI Brand Voice Summary</h4>
                  <p className="text-sm text-purple-800">{profile.brand_voice_data.summary}</p>
                </div>
              )}
            </div>
          )}

          {/* Platforms Tab */}
          {activeTab === 'platforms' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4">Social Media Platforms</h3>
              <p className="text-sm text-gray-600 mb-4">
                Select platforms you want to post to and add your handles
              </p>

              <div className="space-y-4">
                {PLATFORMS.map((platform) => {
                  const userPlatform = (profile.platforms || []).find((p: Platform) => p.platform === platform.id);
                  const isEnabled = !!userPlatform;

                  return (
                    <div key={platform.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => togglePlatform(platform.id)}
                        className="w-5 h-5 accent-primary-600"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{platform.icon}</span>
                          <span className="font-semibold">{platform.name}</span>
                        </div>
                        {isEnabled && (
                          <input
                            type="text"
                            value={userPlatform?.handle || ''}
                            onChange={(e) => updatePlatformHandle(platform.id, e.target.value)}
                            className="input w-full"
                            placeholder={`Your ${platform.name} handle (optional)`}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4">Content Strategy</h3>

              {/* Content Pillars */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium">Content Pillars</label>
                  <button onClick={addContentPillar} className="btn btn-secondary btn-sm">
                    + Add Pillar
                  </button>
                </div>
                <div className="space-y-2">
                  {(profile.content_pillars || []).map((pillar, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="flex-1">{pillar}</span>
                      <button
                        onClick={() => removeContentPillar(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {(profile.content_pillars || []).length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No content pillars yet. Add your main content themes!
                    </p>
                  )}
                </div>
              </div>

              {/* Posting Frequency */}
              <div>
                <label className="block text-sm font-medium mb-2">Posting Frequency</label>
                <select
                  value={profile.posting_habits?.frequency || 'daily'}
                  onChange={(e) => setProfile({
                    ...profile,
                    posting_habits: { ...profile.posting_habits!, frequency: e.target.value }
                  })}
                  className="input"
                >
                  <option value="multiple_daily">Multiple times per day</option>
                  <option value="daily">Once per day</option>
                  <option value="few_weekly">Few times per week</option>
                  <option value="weekly">Once per week</option>
                  <option value="flexible">Flexible/No schedule</option>
                </select>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold mb-4">Caption & Grid Preferences</h3>

              {/* Caption Preferences */}
              <div className="space-y-4">
                <h4 className="font-semibold">Default Caption Settings</h4>

                <div>
                  <label className="block text-sm font-medium mb-2">Emoji Count</label>
                  <select
                    value={profile.caption_preferences?.default_emoji_count || 'medium'}
                    onChange={(e) => setProfile({
                      ...profile,
                      caption_preferences: { ...profile.caption_preferences!, default_emoji_count: e.target.value }
                    })}
                    className="input"
                  >
                    <option value="none">None</option>
                    <option value="minimal">Minimal (1-2)</option>
                    <option value="medium">Medium (3-5)</option>
                    <option value="heavy">Heavy (6+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Hashtag Count</label>
                  <select
                    value={profile.caption_preferences?.default_hashtag_count || 'medium'}
                    onChange={(e) => setProfile({
                      ...profile,
                      caption_preferences: { ...profile.caption_preferences!, default_hashtag_count: e.target.value }
                    })}
                    className="input"
                  >
                    <option value="none">None</option>
                    <option value="minimal">Minimal (1-3)</option>
                    <option value="medium">Medium (5-10)</option>
                    <option value="heavy">Heavy (15+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Call-to-Action Style</label>
                  <select
                    value={profile.caption_preferences?.default_cta_style || 'subtle'}
                    onChange={(e) => setProfile({
                      ...profile,
                      caption_preferences: { ...profile.caption_preferences!, default_cta_style: e.target.value }
                    })}
                    className="input"
                  >
                    <option value="none">None</option>
                    <option value="subtle">Subtle</option>
                    <option value="direct">Direct</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Grid Preferences */}
              <div className="space-y-4">
                <h4 className="font-semibold">Grid Preferences</h4>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={profile.grid_preferences?.showBrandFrame || false}
                    onChange={(e) => setProfile({
                      ...profile,
                      grid_preferences: { ...profile.grid_preferences!, showBrandFrame: e.target.checked }
                    })}
                    className="w-5 h-5 accent-primary-600"
                  />
                  <label className="text-sm">Show brand color frame around grid tiles</label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Pattern</label>
                  <select
                    value={profile.grid_preferences?.preferredPattern || 'checkerboard'}
                    onChange={(e) => setProfile({
                      ...profile,
                      grid_preferences: { ...profile.grid_preferences!, preferredPattern: e.target.value }
                    })}
                    className="input"
                  >
                    <option value="checkerboard">Checkerboard</option>
                    <option value="row_theme">Row Theme</option>
                    <option value="diagonal">Diagonal</option>
                    <option value="rainbow">Rainbow</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button (Sticky) */}
        <div className="sticky bottom-4 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary w-full shadow-lg"
            style={{ backgroundColor: saving ? undefined : brandColor }}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </span>
            ) : (
              '💾 Save Changes'
            )}
          </button>
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
