'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import LanguageToggle from '@/components/LanguageToggle';
import LogoutButton from '@/components/LogoutButton';
import Toast from '@/components/Toast';
import type { Profile, Platform, ContentPillar } from '@/lib/types';
import { PLATFORMS, POST_CATEGORIES, CONTENT_PILLAR_SUGGESTIONS } from '@/lib/constants';
import { getContentPillars, createPillar, migratePillars, updatePillarColor } from '@/lib/pillarUtils';
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

      // Upload to Supabase Storage with user folder structure
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message || 'Failed to upload to storage');
      }

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate summary');
      }

      const data = await response.json();

      // Update profile with new summary
      const updatedProfile = {
        ...profile,
        brand_voice_data: {
          ...profile.brand_voice_data!,
          summary: data.summary,
        },
      };

      setProfile(updatedProfile);

      // Auto-save the updated profile to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            brand_voice_data: updatedProfile.brand_voice_data,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error saving profile:', updateError);
          showToast('Summary generated but failed to save. Please click Save manually.', 'warning');
          return;
        }
      }

      showToast('Brand voice summary regenerated and saved!', 'success');
    } catch (error: any) {
      console.error('Error regenerating voice:', error);
      showToast(error.message || 'Failed to regenerate voice. Please check your settings and try again.', 'error');
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
    const pillarName = prompt('Enter a new content pillar:');
    if (pillarName && pillarName.trim()) {
      const currentPillars = migratePillars(profile.content_pillars || []);
      const newPillar = createPillar(pillarName.trim(), currentPillars);

      // Check if pillar already exists
      if (currentPillars.some(p => p.id === newPillar.id)) {
        showToast('A pillar with this name already exists', 'error');
        return;
      }

      setProfile({
        ...profile,
        content_pillars: [...currentPillars, newPillar],
      });
    }
  };

  const removeContentPillar = (index: number) => {
    const currentPillars = migratePillars(profile.content_pillars || []);
    setProfile({
      ...profile,
      content_pillars: currentPillars.filter((_, i) => i !== index),
    });
  };

  const changePillarColor = (index: number, newColor: string) => {
    const currentPillars = migratePillars(profile.content_pillars || []);
    const updatedPillars = currentPillars.map((p, i) =>
      i === index ? { ...p, color: newColor } : p
    );
    setProfile({
      ...profile,
      content_pillars: updatedPillars,
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
                  { key: 'formal_casual', left: 'Formal', right: 'Casual' },
                  { key: 'playful_serious', left: 'Playful', right: 'Serious' },
                  { key: 'bold_soft', left: 'Bold', right: 'Soft' },
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
                  <div>
                    <label className="text-sm font-medium">Content Pillars</label>
                    <p className="text-xs text-gray-500 mt-1">
                      Define your main content types. These will be used in Create Post and Pattern Mode.
                    </p>
                  </div>
                  <button onClick={addContentPillar} className="btn btn-secondary btn-sm">
                    + Add Pillar
                  </button>
                </div>
                <div className="space-y-2">
                  {migratePillars(profile.content_pillars || []).map((pillar, index) => (
                    <div key={pillar.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {/* Color Picker */}
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={pillar.color}
                          onChange={(e) => changePillarColor(index, e.target.value)}
                          className="w-10 h-10 rounded border-2 border-gray-300 cursor-pointer"
                          title="Change pillar color"
                        />
                      </div>

                      {/* Pillar Name with Color Badge */}
                      <div
                        className="px-3 py-1 rounded-md text-white font-medium flex-1"
                        style={{ backgroundColor: pillar.color }}
                      >
                        {pillar.name}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeContentPillar(index)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium px-2"
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

                {/* Info Box */}
                {migratePillars(profile.content_pillars || []).length > 0 && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      <strong>Tip:</strong> These pillars will appear as categories when creating posts,
                      and you can use them to create visual patterns in your Instagram grid.
                    </p>
                  </div>
                )}
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
                <p className="text-sm text-gray-600">
                  These settings will be used as defaults when generating AI captions for your posts. You can always adjust them individually for each post.
                </p>

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
                    <option value="none">None - No emojis in captions</option>
                    <option value="minimal">Minimal (1-2) - Light emoji usage</option>
                    <option value="medium">Medium (3-5) - Balanced emoji presence</option>
                    <option value="heavy">Heavy (6+) - Emoji-rich captions</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Controls how many emojis appear in AI-generated captions. Choose based on your brand personality.
                  </p>
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
                    <option value="none">None - No hashtags</option>
                    <option value="minimal">Minimal (1-3) - Focused hashtags</option>
                    <option value="medium">Medium (5-10) - Balanced reach</option>
                    <option value="heavy">Heavy (15+) - Maximum reach</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Determines hashtag quantity for generated content. More hashtags = broader reach but may look spammy. Instagram allows up to 30.
                  </p>
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
                    <option value="none">None - No CTA</option>
                    <option value="subtle">Subtle - "Let us know your thoughts"</option>
                    <option value="direct">Direct - "Click the link in bio"</option>
                    <option value="urgent">Urgent - "Limited time! Act now"</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    How aggressively captions should encourage audience action. Subtle works for engagement, Direct for conversions, Urgent for sales.
                  </p>
                </div>
              </div>

              {/* Grid Preferences */}
              <div className="space-y-4">
                <h4 className="font-semibold">Grid Preferences</h4>

                <div>
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
                  <p className="text-xs text-gray-500 mt-1 ml-8">
                    Adds a colored border using your brand colors to each post in the grid preview. Helps visualize your brand consistency.
                  </p>
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
                    <option value="checkerboard">Checkerboard - Alternating content pillars</option>
                    <option value="row_theme">Row Theme - Each row is a different pillar</option>
                    <option value="diagonal">Diagonal - Content types flow diagonally</option>
                    <option value="rainbow">Rainbow - Sorted by content pillar order</option>
                  </select>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                    <p className="text-xs text-blue-900 font-medium mb-2">What is a Preferred Pattern?</p>
                    <p className="text-xs text-blue-800 mb-2">
                      A pattern defines how your posts are arranged in your Instagram grid based on your content pillars (e.g., Educational, Offers, Behind the Scenes).
                    </p>
                    <p className="text-xs text-blue-800 mb-2">
                      <strong>Examples:</strong>
                    </p>
                    <ul className="text-xs text-blue-800 space-y-1 ml-4">
                      <li>• <strong>Checkerboard:</strong> Educational post → Offer → Educational → Offer (creates diagonal lines)</li>
                      <li>• <strong>Row Theme:</strong> Top row: Educational, Middle row: Personal, Bottom row: Offers</li>
                      <li>• <strong>Diagonal:</strong> Content types flow diagonally across the grid for visual interest</li>
                      <li>• <strong>Rainbow:</strong> Cycles through all your content pillars in order</li>
                    </ul>
                    <p className="text-xs text-blue-800 mt-2">
                      Your pattern makes your grid visually cohesive and helps balance different content types. This setting is used in the Grid Planner when you apply patterns.
                    </p>
                  </div>
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
