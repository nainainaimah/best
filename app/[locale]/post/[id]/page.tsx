'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import type { Post } from '@/lib/types';
import PostNowButton from '@/components/PostNowButton';
import LanguageToggle from '@/components/LanguageToggle';

export default function PostEditPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const isNew = postId === 'new';

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'posted'>('draft');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('');

  const supabase = createClient();

  useEffect(() => {
    if (!isNew) {
      loadPost();
    }
  }, [postId]);

  const loadPost = async () => {
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
        if (data.scheduled_at) {
          setScheduledAt(new Date(data.scheduled_at).toISOString().slice(0, 16));
        }
      }
    } catch (error) {
      console.error('Error loading post:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const postData = {
        user_id: user.id,
        title,
        caption,
        status,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
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

      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setLoading(false);
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
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleGenerateCaption = async () => {
    if (!topic) return;

    setGenerating(true);

    try {
      const response = await fetch('/api/ai/generate-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          tone,
          language: 'en',
        }),
      });

      const data = await response.json();
      if (data.caption) {
        setCaption(data.caption);
      }
    } catch (error) {
      console.error('Error generating caption:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard">
              <h1 className="text-2xl font-bold text-primary-600">PostMuse.ai</h1>
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/dashboard" className="text-primary-600 hover:underline mb-4 inline-block">
            ← {t('common.back')}
          </Link>
          <h2 className="text-3xl font-bold">
            {isNew ? t('post.newPost') : t('post.editPost')}
          </h2>
        </div>

        <div className="card space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-bold mb-3">{t('post.generateCaption')}</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t('post.aiPrompt.topic')}
                className="input"
              />
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder={t('post.aiPrompt.tone')}
                className="input"
              />
              <button
                onClick={handleGenerateCaption}
                disabled={generating || !topic}
                className="btn btn-primary"
              >
                {generating ? t('post.generating') : t('post.aiPrompt.generate')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('post.title')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('post.caption')}
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="input min-h-[200px]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('post.scheduledAt')}
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('post.status')}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="input"
            >
              <option value="draft">{t('post.draft')}</option>
              <option value="scheduled">{t('post.scheduled')}</option>
              <option value="posted">{t('post.posted')}</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? t('common.loading') : t('post.savePost')}
            </button>

            {caption && (
              <PostNowButton caption={caption} />
            )}

            {!isNew && (
              <button
                onClick={handleDelete}
                className="btn btn-danger"
              >
                {t('post.deletePost')}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
