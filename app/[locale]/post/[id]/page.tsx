'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Post, Profile } from '@/lib/types';
import { PLATFORMS, POST_CATEGORIES } from '@/lib/constants';
import PostNowButton from '@/components/PostNowButton';
import LanguageToggle from '@/components/LanguageToggle';

export default function PostEditPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const postId = params.id as string;
  const isNew = postId === 'new';

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'posted'>('draft');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadProfile();
    if (!isNew) {
      loadPost();
    }
  }, [postId]);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadPost = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title);
        setCaption(data.caption);
        setStatus(data.status);
        setCategory(data.category || '');
        setMediaUrl(data.media_url);
        setSelectedPlatforms(data.platforms || []);
        if (data.scheduled_at) {
          const date = new Date(data.scheduled_at);
          setScheduledDate(date.toISOString().split('T')[0]);
          setScheduledTime(date.toTimeString().slice(0, 5));
        }
      }
    } catch (error) {
      console.error('Error loading post:', error);
      showToast('Failed to load post', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      setUploadError('Please select an image or video file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      setMediaUrl(publicUrl);
      setUploadError('');
      showToast('Media uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading media:', error);
      setUploadError(error.message || 'Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setMediaUrl(null);
  };

  const handleSave = async (isDraft = true) => {
    if (!title) {
      showToast('Please enter a title', 'error');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let scheduled_at = null;
      if (scheduledDate && scheduledTime) {
        scheduled_at = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      const postData = {
        user_id: user.id,
        title,
        caption,
        category,
        media_url: mediaUrl,
        status: isDraft ? 'draft' : status,
        scheduled_at,
        platforms: selectedPlatforms,
      };

      if (isNew) {
        const { error } = await supabase
          .from('posts')
          .insert(postData);

        if (error) throw error;
        showToast(isDraft ? 'Draft saved!' : 'Post saved!');
      } else {
        const { error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', postId);

        if (error) throw error;
        showToast('Post updated!');
      }

      setTimeout(() => router.push(`/${locale}/dashboard`), 1500);
    } catch (error) {
      console.error('Error saving post:', error);
      showToast('Failed to save post', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSchedule = async () => {
    if (!title) {
      showToast('Please enter a title', 'error');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      showToast('Please select date and time', 'error');
      return;
    }

    if (selectedPlatforms.length === 0) {
      showToast('Please select at least one platform', 'error');
      return;
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    if (scheduledDateTime < new Date()) {
      if (!confirm('You selected a past date/time. Do you want to continue?')) {
        return;
      }
    }

    setScheduling(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const postData = {
        user_id: user.id,
        title,
        caption,
        category,
        media_url: mediaUrl,
        status: 'scheduled' as const,
        scheduled_at: scheduledDateTime.toISOString(),
        platforms: selectedPlatforms,
      };

      if (isNew) {
        const { error } = await supabase
          .from('posts')
          .insert(postData);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', postId);

        if (error) throw error;
      }

      showToast('Post scheduled successfully!');
      setTimeout(() => router.push(`/${locale}/dashboard`), 1500);
    } catch (error) {
      console.error('Error scheduling post:', error);
      showToast('Failed to schedule post', 'error');
    } finally {
      setScheduling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      showToast('Post deleted');
      setTimeout(() => router.push(`/${locale}/dashboard`), 1000);
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('Failed to delete post', 'error');
    }
  };

  const handleGenerateCaption = async () => {
    if (!topic) {
      setError('Please enter a topic');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          tone,
          language: profile?.caption_preferences?.defaultLanguage || 'en',
          maxLength: profile?.caption_preferences?.defaultLength === 'short' ? 100 :
                     profile?.caption_preferences?.defaultLength === 'long' ? 500 : 250,
          hashtagCount: profile?.caption_preferences?.defaultHashtagCount || 6,
          brandVoice: profile?.brand_voice_data,
          platform: selectedPlatforms[0] || 'instagram',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate caption');
      }

      if (data.caption) {
        setCaption(data.caption);
        setError('');
        showToast('Caption generated!');
      } else {
        throw new Error('No caption returned');
      }
    } catch (error: any) {
      console.error('Error generating caption:', error);
      setError(error.message || 'Failed to generate caption. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const togglePlatform = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platformId));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platformId]);
    }
  };

  // Get enabled platforms from profile
  const enabledPlatforms = profile?.platforms?.filter(p => p.enabled) || [];
  const availablePlatforms = PLATFORMS.filter(p =>
    enabledPlatforms.some(ep => ep.platform === p.id)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-white border-l-4 border-green-500 px-6 py-4 rounded shadow-lg animate-fade-in">
          <p className="font-medium text-gray-900">{toast}</p>
        </div>
      )}

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href={`/${locale}/dashboard`}>
              <h1 className="text-2xl font-bold text-primary-600">PostMuse.ai</h1>
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/${locale}/dashboard`} className="text-primary-600 hover:underline inline-flex items-center">
            ← Back to Dashboard
          </Link>
          <h2 className="text-3xl font-bold mt-2">
            {isNew ? 'Create New Post' : 'Edit Post'}
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Caption Generator */}
            <div className="card bg-gradient-to-br from-blue-50 to-white">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <span>✨</span>
                AI Caption Generator
              </h3>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-3">
                  {error}
                </div>
              )}
              <div className="grid md:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Topic (e.g., Summer sale)"
                  className="input"
                />
                <input
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="Tone (optional)"
                  className="input"
                />
                <button
                  onClick={handleGenerateCaption}
                  disabled={generating || !topic}
                  className="btn btn-primary"
                >
                  {generating ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </span>
                  ) : (
                    'Generate'
                  )}
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="card">
              <label className="block text-sm font-medium mb-2">
                Post Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="Give your post a clear title"
                required
              />
            </div>

            {/* Caption */}
            <div className="card">
              <label className="block text-sm font-medium mb-2">
                Caption
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="input min-h-[200px]"
                placeholder="Write your caption here..."
              />
              <div className="mt-2 text-xs text-gray-500">
                {caption.length} characters
              </div>
            </div>

            {/* Media Upload */}
            <div className="card">
              <label className="block text-sm font-medium mb-2">
                Image / Video
              </label>
              {uploadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-3">
                  {uploadError}
                </div>
              )}
              {mediaUrl ? (
                <div className="space-y-3">
                  <div className="relative inline-block">
                    {mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video
                        src={mediaUrl}
                        controls
                        className="max-w-full h-auto rounded-lg border border-gray-300"
                      />
                    ) : (
                      <img
                        src={mediaUrl}
                        alt="Post media"
                        className="max-w-full h-auto rounded-lg border border-gray-300"
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full hover:bg-red-600 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {uploading && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      <p className="text-sm text-gray-500">Uploading...</p>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Max 10MB • Images & Videos supported
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Platform Selection */}
            <div className="card">
              <label className="block text-sm font-medium mb-3">
                Platforms *
              </label>
              <div className="space-y-2">
                {availablePlatforms.length > 0 ? (
                  availablePlatforms.map(platform => (
                    <label
                      key={platform.id}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedPlatforms.includes(platform.id)
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(platform.id)}
                        onChange={() => togglePlatform(platform.id)}
                        className="w-5 h-5"
                      />
                      <span className="text-xl">{platform.icon}</span>
                      <span className="font-medium">{platform.name}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">
                    No platforms enabled. Update your profile to add platforms.
                  </p>
                )}
              </div>
            </div>

            {/* Category */}
            <div className="card">
              <label className="block text-sm font-medium mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
              >
                <option value="">Select category</option>
                {POST_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="card">
              <label className="block text-sm font-medium mb-2">
                Schedule Date & Time
              </label>
              <div className="space-y-3">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="input"
                  min={new Date().toISOString().split('T')[0]}
                />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            {/* Status */}
            <div className="card">
              <label className="block text-sm font-medium mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="input"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="posted">Posted</option>
              </select>
            </div>

            {/* Actions */}
            <div className="card space-y-3">
              <button
                onClick={() => handleSave(true)}
                disabled={saving || scheduling}
                className="btn btn-secondary w-full"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                    Saving...
                  </span>
                ) : (
                  'Save Draft'
                )}
              </button>

              <button
                onClick={handleSchedule}
                disabled={saving || scheduling}
                className="btn btn-primary w-full"
              >
                {scheduling ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Scheduling...
                  </span>
                ) : (
                  '📅 Schedule Post'
                )}
              </button>

              {caption && <PostNowButton caption={caption} />}

              {!isNew && (
                <button
                  onClick={handleDelete}
                  className="btn btn-danger w-full"
                >
                  Delete Post
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
