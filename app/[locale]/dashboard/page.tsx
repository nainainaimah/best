'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import type { Post } from '@/lib/types';
import LanguageToggle from '@/components/LanguageToggle';

export default function DashboardPage() {
  const t = useTranslations();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
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
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScheduledDates = () => {
    return posts
      .filter(p => p.scheduled_at)
      .map(p => new Date(p.scheduled_at!).toDateString());
  };

  const scheduledDates = getScheduledDates();

  const tileClassName = ({ date }: { date: Date }) => {
    if (scheduledDates.includes(date.toDateString())) {
      return 'bg-primary-200';
    }
    return '';
  };

  const upcomingPosts = posts.slice(0, 5);

  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-600">PostMuse.ai</h1>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <Link href="/grid" className="btn btn-secondary">
                {t('grid.title')}
              </Link>
              <Link href="/admin" className="btn btn-secondary">
                {t('admin.title')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{t('dashboard.title')}</h2>
          <p className="text-gray-600">{t('dashboard.welcome')}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="card">
            <h3 className="text-xl font-bold mb-4">{t('dashboard.calendar')}</h3>
            <Calendar
              value={selectedDate}
              onChange={(value) => setSelectedDate(value as Date)}
              tileClassName={tileClassName}
            />
          </div>

          <div className="card">
            <h3 className="text-xl font-bold mb-4">{t('dashboard.upcomingPosts')}</h3>
            {loading ? (
              <p>{t('common.loading')}</p>
            ) : upcomingPosts.length > 0 ? (
              <div className="space-y-3">
                {upcomingPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <h4 className="font-semibold mb-1">{post.title}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {post.caption}
                    </p>
                    {post.scheduled_at && (
                      <p className="text-xs text-gray-500">
                        {t('dashboard.scheduledFor')}:{' '}
                        {new Date(post.scheduled_at).toLocaleString()}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">{t('dashboard.noPosts')}</p>
            )}
          </div>
        </div>

        <div className="text-center">
          <Link href="/post/new" className="btn btn-primary text-lg px-8 py-3">
            {t('dashboard.createPost')}
          </Link>
        </div>
      </main>
    </div>
  );
}
