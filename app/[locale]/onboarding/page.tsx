'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import type {
  Profile,
  BrandColors,
  BrandVoiceData,
  Platform,
  CaptionPreferences,
  GridPreferences
} from '@/lib/types';
import {
  PLATFORMS,
  ROLES,
  CONTENT_PILLAR_SUGGESTIONS,
  GRID_PATTERNS,
  DEFAULT_BRAND_COLORS,
  CAPTION_LENGTH_OPTIONS,
  HASHTAG_COUNT_OPTIONS
} from '@/lib/constants';

type OnboardingData = {
  display_name: string;
  brand_name: string;
  avatar_url: string | null;
  brand_colors: BrandColors;
  brand_voice_data: BrandVoiceData;
  platforms: Platform[];
  content_pillars: string[];
  caption_preferences: CaptionPreferences;
  grid_preferences: GridPreferences;
};

export default function OnboardingPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    display_name: '',
    brand_name: '',
    avatar_url: null,
    brand_colors: DEFAULT_BRAND_COLORS,
    brand_voice_data: {
      role: '',
      sliders: {
        formal_casual: 50,
        playful_serious: 50,
        bold_soft: 50,
      },
      likes: '',
      dislikes: '',
      summary: '',
    },
    platforms: PLATFORMS.map(p => ({
      platform: p.id,
      enabled: false,
      handle: '',
      url: '',
      defaultAspect: p.id === 'instagram' ? '1:1' : '16:9',
    })),
    content_pillars: [],
    caption_preferences: {
      defaultLength: 'medium',
      defaultHashtagCount: 6,
      hashtagPlacement: 'separate',
      defaultLanguage: 'en',
    },
    grid_preferences: {
      primaryPlatform: 'instagram',
      careAboutPatterns: false,
      pattern: 'none',
      showBrandFrame: false,
      showPlatformIcons: true,
      showCategoryLabels: false,
    },
  });

  // Load existing profile data if user is resuming onboarding
  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profile && !profile.onboarding_complete) {
        // Resume onboarding with existing data
        setData(prevData => ({
          ...prevData,
          display_name: profile.display_name || '',
          brand_name: profile.brand_name || '',
          avatar_url: profile.avatar_url || null,
          brand_colors: profile.brand_colors || DEFAULT_BRAND_COLORS,
          brand_voice_data: profile.brand_voice_data || prevData.brand_voice_data,
          platforms: profile.platforms?.length > 0 ? profile.platforms : prevData.platforms,
          content_pillars: profile.content_pillars || [],
          caption_preferences: profile.caption_preferences || prevData.caption_preferences,
          grid_preferences: profile.grid_preferences || prevData.grid_preferences,
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  // Autosave on step change
  const saveProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('profiles').upsert({
        user_id: user.id,
        display_name: data.display_name,
        brand_name: data.brand_name,
        avatar_url: data.avatar_url,
        brand_colors: data.brand_colors,
        brand_voice_data: data.brand_voice_data,
        platforms: data.platforms,
        content_pillars: data.content_pillars,
        caption_preferences: data.caption_preferences,
        grid_preferences: data.grid_preferences,
        onboarding_complete: false,
      }, {
        onConflict: 'user_id'
      });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleNext = async () => {
    if (currentStep < 8) {
      await saveProgress();
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update profile with onboarding_complete flag
      const { error: updateError } = await supabase.from('profiles').upsert({
        user_id: user.id,
        ...data,
        onboarding_complete: true,
      }, {
        onConflict: 'user_id'
      });

      if (updateError) throw updateError;

      // Check if user has active subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      // Use window.location.href for a full page reload to ensure middleware re-evaluates
      const targetUrl = subscription ? `/${locale}/dashboard` : `/${locale}/pricing`;
      window.location.href = targetUrl;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Failed to complete onboarding. Please try again.');
      setLoading(false);
    }
    // Don't set loading to false here - we're navigating away
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      setData({ ...data, avatar_url: publicUrl });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const generateToneSummary = async () => {
    setGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/summarize-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sliders: data.brand_voice_data.sliders,
          likes: data.brand_voice_data.likes,
          dislikes: data.brand_voice_data.dislikes,
        }),
      });

      const result = await response.json();
      if (result.summary) {
        setData({
          ...data,
          brand_voice_data: { ...data.brand_voice_data, summary: result.summary },
        });
      }
    } catch (error) {
      console.error('Error generating summary:', error);
    } finally {
      setGeneratingAI(false);
    }
  };

  const suggestPillars = async () => {
    const industry = (data.brand_name || '').toLowerCase();
    let suggestions: string[] = [];

    for (const [key, pillars] of Object.entries(CONTENT_PILLAR_SUGGESTIONS)) {
      if (industry.includes(key)) {
        suggestions = pillars;
        break;
      }
    }

    if (suggestions.length === 0) {
      suggestions = CONTENT_PILLAR_SUGGESTIONS.default;
    }

    setData({ ...data, content_pillars: suggestions.slice(0, 5) });
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                What's your name or business name?
              </label>
              <input
                type="text"
                value={data.display_name}
                onChange={(e) => setData({ ...data, display_name: e.target.value })}
                className="input"
                placeholder="e.g., Sarah's Boutique, John Smith"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Brand / Business Name
              </label>
              <input
                type="text"
                value={data.brand_name}
                onChange={(e) => setData({ ...data, brand_name: e.target.value })}
                className="input"
                placeholder="e.g., Trendy Fashion Co."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                What's your role?
              </label>
              <select
                value={data.brand_voice_data.role || ''}
                onChange={(e) => setData({ ...data, brand_voice_data: { ...data.brand_voice_data, role: e.target.value } })}
                className="input"
              >
                <option value="">Select a role</option>
                {ROLES.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Brand Logo / Profile Image
              </label>
              {data.avatar_url ? (
                <div className="space-y-3">
                  <img
                    src={data.avatar_url}
                    alt="Avatar"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setData({ ...data, avatar_url: null })}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100"
                />
              )}
              {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                Brand Colors
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Primary</label>
                  <input
                    type="color"
                    value={data.brand_colors.primary}
                    onChange={(e) => setData({ ...data, brand_colors: { ...data.brand_colors, primary: e.target.value } })}
                    className="w-full h-12 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.brand_colors.primary}
                    onChange={(e) => setData({ ...data, brand_colors: { ...data.brand_colors, primary: e.target.value } })}
                    className="mt-1 input text-xs"
                    placeholder="#000000"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Secondary</label>
                  <input
                    type="color"
                    value={data.brand_colors.secondary}
                    onChange={(e) => setData({ ...data, brand_colors: { ...data.brand_colors, secondary: e.target.value } })}
                    className="w-full h-12 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.brand_colors.secondary}
                    onChange={(e) => setData({ ...data, brand_colors: { ...data.brand_colors, secondary: e.target.value } })}
                    className="mt-1 input text-xs"
                    placeholder="#000000"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Accent</label>
                  <input
                    type="color"
                    value={data.brand_colors.accent}
                    onChange={(e) => setData({ ...data, brand_colors: { ...data.brand_colors, accent: e.target.value } })}
                    className="w-full h-12 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.brand_colors.accent}
                    onChange={(e) => setData({ ...data, brand_colors: { ...data.brand_colors, accent: e.target.value } })}
                    className="mt-1 input text-xs"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-2 rounded-lg" style={{ borderColor: data.brand_colors.primary }}>
              <div className="text-center">
                <div className="inline-block w-16 h-16 rounded-full mb-2" style={{ backgroundColor: data.brand_colors.primary }} />
                <h3 className="font-bold text-lg" style={{ color: data.brand_colors.primary }}>{data.brand_name || 'Your Brand'}</h3>
                <p className="text-sm text-gray-600 mt-2">Preview of your brand colors</p>
                <div className="flex justify-center gap-2 mt-3">
                  <div className="w-8 h-8 rounded" style={{ backgroundColor: data.brand_colors.primary }} />
                  <div className="w-8 h-8 rounded" style={{ backgroundColor: data.brand_colors.secondary }} />
                  <div className="w-8 h-8 rounded" style={{ backgroundColor: data.brand_colors.accent }} />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">
                Brand Tone & Voice
              </label>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Formal</span>
                    <span>Casual</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={data.brand_voice_data.sliders?.formal_casual || 50}
                    onChange={(e) => setData({
                      ...data,
                      brand_voice_data: {
                        ...data.brand_voice_data,
                        sliders: { ...data.brand_voice_data.sliders, formal_casual: parseInt(e.target.value) }
                      }
                    })}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Playful</span>
                    <span>Serious</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={data.brand_voice_data.sliders?.playful_serious || 50}
                    onChange={(e) => setData({
                      ...data,
                      brand_voice_data: {
                        ...data.brand_voice_data,
                        sliders: { ...data.brand_voice_data.sliders, playful_serious: parseInt(e.target.value) }
                      }
                    })}
                    className="w-full"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Bold</span>
                    <span>Soft</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={data.brand_voice_data.sliders?.bold_soft || 50}
                    onChange={(e) => setData({
                      ...data,
                      brand_voice_data: {
                        ...data.brand_voice_data,
                        sliders: { ...data.brand_voice_data.sliders, bold_soft: parseInt(e.target.value) }
                      }
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Words I use often (optional)
              </label>
              <input
                type="text"
                value={data.brand_voice_data.likes}
                onChange={(e) => setData({ ...data, brand_voice_data: { ...data.brand_voice_data, likes: e.target.value } })}
                className="input"
                placeholder="e.g., amazing, empower, transform"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Words to avoid (optional)
              </label>
              <input
                type="text"
                value={data.brand_voice_data.dislikes}
                onChange={(e) => setData({ ...data, brand_voice_data: { ...data.brand_voice_data, dislikes: e.target.value } })}
                className="input"
                placeholder="e.g., cheap, old-fashioned"
              />
            </div>

            {data.brand_voice_data.summary && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-1">✨ AI Tone Summary:</p>
                <p className="text-sm text-blue-800">{data.brand_voice_data.summary}</p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Select the platforms where you'll be posting content:
            </p>

            <div className="space-y-3">
              {PLATFORMS.map((platform, index) => {
                const platformData = data.platforms[index];
                return (
                  <div key={platform.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={platformData?.enabled || false}
                        onChange={(e) => {
                          const newPlatforms = [...data.platforms];
                          newPlatforms[index] = { ...newPlatforms[index], enabled: e.target.checked };
                          setData({ ...data, platforms: newPlatforms });
                        }}
                        className="w-5 h-5"
                      />
                      <span className="text-2xl">{platform.icon}</span>
                      <span className="font-medium">{platform.name}</span>
                    </div>

                    {platformData?.enabled && (
                      <div className="grid grid-cols-2 gap-3 ml-8">
                        <input
                          type="text"
                          value={platformData.handle || ''}
                          onChange={(e) => {
                            const newPlatforms = [...data.platforms];
                            newPlatforms[index] = { ...newPlatforms[index], handle: e.target.value };
                            setData({ ...data, platforms: newPlatforms });
                          }}
                          className="input text-sm"
                          placeholder="@handle"
                        />
                        <input
                          type="text"
                          value={platformData.url || ''}
                          onChange={(e) => {
                            const newPlatforms = [...data.platforms];
                            newPlatforms[index] = { ...newPlatforms[index], url: e.target.value };
                            setData({ ...data, platforms: newPlatforms });
                          }}
                          className="input text-sm"
                          placeholder="Profile URL"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-600 mb-3">
                Define 3-5 content pillars (main themes) for your content:
              </p>
              <button
                type="button"
                onClick={suggestPillars}
                className="btn btn-secondary text-sm mb-4"
              >
                ✨ Suggest Pillars Based on My Brand
              </button>
            </div>

            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((index) => (
                <input
                  key={index}
                  type="text"
                  value={data.content_pillars[index] || ''}
                  onChange={(e) => {
                    const newPillars = [...data.content_pillars];
                    newPillars[index] = e.target.value;
                    setData({ ...data, content_pillars: newPillars.filter(p => p !== '') });
                  }}
                  className="input"
                  placeholder={`Pillar ${index + 1}${index < 3 ? ' (required)' : ' (optional)'}`}
                  required={index < 3}
                />
              ))}
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">
                💡 Examples: "Listings", "Tips & Advice", "Customer Stories", "Behind the Scenes", "Industry News"
              </p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Default Caption Length
              </label>
              <div className="grid grid-cols-3 gap-3">
                {CAPTION_LENGTH_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setData({
                      ...data,
                      caption_preferences: { ...data.caption_preferences, defaultLength: option.id as any }
                    })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      data.caption_preferences.defaultLength === option.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{option.name}</div>
                    <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Default Hashtag Count
              </label>
              <div className="grid grid-cols-3 gap-3">
                {HASHTAG_COUNT_OPTIONS.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setData({
                      ...data,
                      caption_preferences: { ...data.caption_preferences, defaultHashtagCount: option.count }
                    })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      data.caption_preferences.defaultHashtagCount === option.count
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{option.name} ({option.count})</div>
                    <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Hashtag Placement
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setData({
                    ...data,
                    caption_preferences: { ...data.caption_preferences, hashtagPlacement: 'inline' }
                  })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    data.caption_preferences.hashtagPlacement === 'inline'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Inline</div>
                  <div className="text-xs text-gray-600 mt-1">Mixed with caption</div>
                </button>
                <button
                  type="button"
                  onClick={() => setData({
                    ...data,
                    caption_preferences: { ...data.caption_preferences, hashtagPlacement: 'separate' }
                  })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    data.caption_preferences.hashtagPlacement === 'separate'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Separate Block</div>
                  <div className="text-xs text-gray-600 mt-1">At the end</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Default Language
              </label>
              <select
                value={data.caption_preferences.defaultLanguage}
                onChange={(e) => setData({
                  ...data,
                  caption_preferences: { ...data.caption_preferences, defaultLanguage: e.target.value as any }
                })}
                className="input"
              >
                <option value="en">English</option>
                <option value="swa">Swahili</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Primary Grid Platform
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setData({
                    ...data,
                    grid_preferences: { ...data.grid_preferences, primaryPlatform: 'generic' }
                  })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    data.grid_preferences.primaryPlatform === 'generic'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Generic</div>
                </button>
                <button
                  type="button"
                  onClick={() => setData({
                    ...data,
                    grid_preferences: { ...data.grid_preferences, primaryPlatform: 'instagram' }
                  })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    data.grid_preferences.primaryPlatform === 'instagram'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Instagram</div>
                </button>
                <button
                  type="button"
                  onClick={() => setData({
                    ...data,
                    grid_preferences: { ...data.grid_preferences, primaryPlatform: 'pinterest' }
                  })}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    data.grid_preferences.primaryPlatform === 'pinterest'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Pinterest</div>
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={data.grid_preferences.careAboutPatterns || false}
                  onChange={(e) => setData({
                    ...data,
                    grid_preferences: { ...data.grid_preferences, careAboutPatterns: e.target.checked }
                  })}
                  className="w-5 h-5"
                />
                <span className="text-sm font-medium">I care about grid patterns</span>
              </label>
            </div>

            {data.grid_preferences.careAboutPatterns && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Preferred Pattern
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {GRID_PATTERNS.map(pattern => (
                    <button
                      key={pattern.id}
                      type="button"
                      onClick={() => setData({
                        ...data,
                        grid_preferences: { ...data.grid_preferences, pattern: pattern.id as any }
                      })}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        data.grid_preferences.pattern === pattern.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium">{pattern.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{pattern.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={data.grid_preferences.showBrandFrame || false}
                  onChange={(e) => setData({
                    ...data,
                    grid_preferences: { ...data.grid_preferences, showBrandFrame: e.target.checked }
                  })}
                  className="w-5 h-5"
                />
                <span className="text-sm">Show brand color frames around tiles</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={data.grid_preferences.showPlatformIcons || false}
                  onChange={(e) => setData({
                    ...data,
                    grid_preferences: { ...data.grid_preferences, showPlatformIcons: e.target.checked }
                  })}
                  className="w-5 h-5"
                />
                <span className="text-sm">Show platform icons on tiles</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={data.grid_preferences.showCategoryLabels || false}
                  onChange={(e) => setData({
                    ...data,
                    grid_preferences: { ...data.grid_preferences, showCategoryLabels: e.target.checked }
                  })}
                  className="w-5 h-5"
                />
                <span className="text-sm">Show category labels</span>
              </label>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                ✓ Setup Complete!
              </div>
            </div>

            <div className="card bg-gradient-to-br from-primary-50 to-white">
              <div className="flex items-start gap-4 mb-6">
                {data.avatar_url && (
                  <img
                    src={data.avatar_url}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full object-cover border-4"
                    style={{ borderColor: data.brand_colors.primary }}
                  />
                )}
                <div>
                  <h3 className="font-bold text-xl" style={{ color: data.brand_colors.primary }}>
                    {data.brand_name || data.display_name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {data.brand_voice_data.role ? ROLES.find(r => r.id === data.brand_voice_data.role)?.name : ''}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Brand Colors:</span>
                  <div className="flex gap-2 mt-2">
                    <div className="w-10 h-10 rounded border" style={{ backgroundColor: data.brand_colors.primary }} />
                    <div className="w-10 h-10 rounded border" style={{ backgroundColor: data.brand_colors.secondary }} />
                    <div className="w-10 h-10 rounded border" style={{ backgroundColor: data.brand_colors.accent }} />
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Active Platforms:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {data.platforms.filter(p => p.enabled).map(p => {
                      const platform = PLATFORMS.find(pl => pl.id === p.platform);
                      return (
                        <span key={p.platform} className="px-3 py-1 bg-white rounded-full text-xs border">
                          {platform?.icon} {platform?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Content Pillars:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {data.content_pillars.filter(p => p).map((pillar, i) => (
                      <span key={i} className="px-3 py-1 bg-white rounded-full text-xs border">
                        {pillar}
                      </span>
                    ))}
                  </div>
                </div>

                {data.brand_voice_data.summary && (
                  <div>
                    <span className="font-medium text-gray-700">Tone Summary:</span>
                    <p className="text-gray-600 mt-1">{data.brand_voice_data.summary}</p>
                  </div>
                )}

                <div>
                  <span className="font-medium text-gray-700">Caption Style:</span>
                  <p className="text-gray-600 mt-1">
                    {data.caption_preferences.defaultLength} length, {data.caption_preferences.defaultHashtagCount} hashtags ({data.caption_preferences.hashtagPlacement})
                  </p>
                </div>

                <div>
                  <span className="font-medium text-gray-700">Grid Preference:</span>
                  <p className="text-gray-600 mt-1">
                    {data.grid_preferences.primaryPlatform} grid
                    {data.grid_preferences.careAboutPatterns && `, ${data.grid_preferences.pattern} pattern`}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <p className="text-sm text-blue-900">
                🎉 You're all set! Click "Finish Setup" to start creating amazing content.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return data.display_name && data.brand_name;
      case 3:
        // Auto-generate summary when moving from step 3
        if (!data.brand_voice_data.summary && !generatingAI) {
          generateToneSummary();
        }
        return true;
      case 4:
        return data.platforms.some(p => p.enabled);
      case 5:
        return data.content_pillars.filter(p => p).length >= 3;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  step < currentStep ? 'bg-green-500 text-white' :
                  step === currentStep ? 'bg-primary-600 text-white' :
                  'bg-gray-300 text-gray-600'
                }`}>
                  {step < currentStep ? '✓' : step}
                </div>
                {step < 8 && (
                  <div className={`h-1 w-8 md:w-16 transition-all ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center mt-3 text-sm text-gray-600">
            Step {currentStep} of 8
          </div>
        </div>

        {/* Step Content */}
        <div className="card">
          <div className="mb-6">
            <div className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-semibold mb-3">
              {currentStep === 1 && '👋 Welcome!'}
              {currentStep === 2 && '🎨 Visual Identity'}
              {currentStep === 3 && '🎭 Voice & Tone'}
              {currentStep === 4 && '📱 Platforms'}
              {currentStep === 5 && '📚 Content Strategy'}
              {currentStep === 6 && '✍️ Caption Preferences'}
              {currentStep === 7 && '🎯 Grid Settings'}
              {currentStep === 8 && '✅ Review'}
            </div>
            <h2 className="text-2xl font-bold">
              {currentStep === 1 && 'Let\'s get to know you'}
              {currentStep === 2 && 'Brand Image & Colors'}
              {currentStep === 3 && 'Define Your Brand Voice'}
              {currentStep === 4 && 'Select Your Platforms'}
              {currentStep === 5 && 'Content Pillars'}
              {currentStep === 6 && 'Caption & Hashtag Preferences'}
              {currentStep === 7 && 'Grid Planner Preferences'}
              {currentStep === 8 && 'Your Brand Summary'}
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              {currentStep === 1 && 'Tell us about yourself and your brand'}
              {currentStep === 2 && 'Add your logo and choose your brand colors'}
              {currentStep === 3 && 'Help us understand how your brand communicates'}
              {currentStep === 4 && 'Where will you be sharing your content?'}
              {currentStep === 5 && 'What are the main themes of your content?'}
              {currentStep === 6 && 'Set your default caption and hashtag style'}
              {currentStep === 7 && 'Customize your grid planner experience'}
              {currentStep === 8 && 'Everything looks great! Let\'s get started.'}
            </p>
          </div>

          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="btn btn-secondary"
            >
              ← Back
            </button>

            {currentStep < 8 ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid() || generatingAI}
                className="btn btn-primary"
              >
                {generatingAI ? 'Processing...' : 'Next →'}
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="btn btn-primary text-lg px-8"
              >
                {loading ? 'Finishing...' : '🚀 Finish Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
