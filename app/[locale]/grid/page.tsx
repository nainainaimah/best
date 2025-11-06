'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { Post } from '@/lib/types';
import LanguageToggle from '@/components/LanguageToggle';

export default function GridPage() {
  const t = useTranslations();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true })
        .limit(9);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const gridPosts = Array(9).fill(null).map((_, i) => posts[i] || null);

  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/dashboard">
              <h1 className="text-2xl font-bold text-primary-600">PostMuse.ai</h1>
            </Link>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <Link href="/dashboard" className="btn btn-secondary">
                {t('dashboard.title')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2">{t('grid.title')}</h2>
          <p className="text-gray-600">{t('grid.subtitle')}</p>
        </div>

        {loading ? (
          <p className="text-center">{t('common.loading')}</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 bg-white p-4 rounded-lg shadow-md">
            {gridPosts.map((post, index) => (
              <div
                key={index}
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
              >
                {post ? (
                  <Link
                    href={`/post/${post.id}`}
                    className="block w-full h-full p-4 hover:bg-gray-200 transition-colors"
                  >
                    <div className="flex flex-col justify-center items-center h-full text-center">
                      <p className="text-sm font-semibold mb-2 line-clamp-2">
                        {post.title}
                      </p>
                      {post.scheduled_at && (
                        <p className="text-xs text-gray-500">
                          {new Date(post.scheduled_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <span className="text-sm">{t('grid.emptySlot')}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/post/new" className="btn btn-primary">
            {t('dashboard.createPost')}
          </Link>
        </div>
      </main>
    </div>
  );
}
