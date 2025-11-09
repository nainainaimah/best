'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import type { Post, Profile, AISuggestedTime } from '@/lib/types';
import { PLATFORMS } from '@/lib/constants';
import LanguageToggle from '@/components/LanguageToggle';
import LogoutButton from '@/components/LogoutButton';
import { useParams } from 'next/navigation';

export default function CalendarPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDayPosts, setSelectedDayPosts] = useState<Post[]>([]);
  const [showDayModal, setShowDayModal] = useState(false);
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [suggestedTimes, setSuggestedTimes] = useState<AISuggestedTime[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [posts, platformFilter, statusFilter]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setProfile(profileData);

      // Load all posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: true });
      setPosts(postsData || []);
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...posts];

    // Platform filter
    if (platformFilter !== 'all') {
      filtered = filtered.filter(post =>
        post.platforms && post.platforms.includes(platformFilter)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter);
    }

    setFilteredPosts(filtered);
  };

  const getPostsForDate = (date: Date) => {
    return filteredPosts.filter(post => {
      if (!post.scheduled_at) return false;
      const postDate = new Date(post.scheduled_at);
      return postDate.toDateString() === date.toDateString();
    });
  };

  const tileContent = ({ date }: { date: Date }) => {
    const dayPosts = getPostsForDate(date);
    if (dayPosts.length === 0) return null;

    // Get unique platforms for this day
    const platforms = Array.from(
      new Set(dayPosts.flatMap(post => post.platforms || []))
    );

    return (
      <div className="flex flex-col items-center gap-1 mt-1">
        <div className="flex items-center gap-0.5 flex-wrap justify-center">
          {platforms.slice(0, 3).map((platformId, idx) => {
            const platform = PLATFORMS.find(p => p.id === platformId);
            return (
              <span key={idx} className="text-xs">
                {platform?.icon}
              </span>
            );
          })}
        </div>
        <div className="text-xs font-semibold text-primary-600">
          {dayPosts.length} {dayPosts.length === 1 ? 'post' : 'posts'}
        </div>
      </div>
    );
  };

  const tileClassName = ({ date }: { date: Date }) => {
    const dayPosts = getPostsForDate(date);
    const isToday = date.toDateString() === new Date().toDateString();

    if (isToday) {
      return 'bg-primary-100 border-2 border-primary-600 font-bold';
    }
    if (dayPosts.length > 0) {
      return 'bg-blue-50 hover:bg-blue-100';
    }
    return 'hover:bg-gray-50';
  };

  const handleDayClick = (date: Date) => {
    const dayPosts = getPostsForDate(date);
    setSelectedDate(date);
    setSelectedDayPosts(dayPosts);
    setShowDayModal(true);
  };

  const handleSuggestTimes = async () => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch('/api/ai/suggest-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          existingPosts: posts,
          targetPlatform: platformFilter !== 'all' ? platformFilter : undefined
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestedTimes(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error getting time suggestions:', error);
      alert('Failed to get AI suggestions. Please try again.');
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const getPlatformIcon = (platformId: string) => {
    return PLATFORMS.find(p => p.id === platformId)?.icon || '📱';
  };

  const enabledPlatforms = profile?.platforms?.filter(p => p.enabled) || [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href={`/${locale}/dashboard`}>
              <h1 className="text-2xl font-bold text-primary-600">PostMuse.ai</h1>
            </Link>
            <div className="flex items-center gap-4">
              <Link href={`/${locale}/dashboard`} className="btn btn-secondary">
                📊 Dashboard
              </Link>
              <Link href={`/${locale}/grid`} className="btn btn-secondary">
                🎨 Grid
              </Link>
              <LanguageToggle />
              <LogoutButton locale={locale} />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">📅 Content Calendar</h2>
          <p className="text-gray-600">Plan and manage your posting schedule</p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Platform Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Filter by Platform</label>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Platforms</option>
                {enabledPlatforms.map(platform => {
                  const p = PLATFORMS.find(pl => pl.id === platform.platform);
                  return (
                    <option key={platform.platform} value={platform.platform}>
                      {p?.icon} {p?.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="posted">Posted</option>
              </select>
            </div>

            {/* AI Suggestions Button */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-2">&nbsp;</label>
              <button
                onClick={handleSuggestTimes}
                disabled={loadingSuggestions}
                className="btn btn-primary w-full"
              >
                {loadingSuggestions ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Thinking...
                  </span>
                ) : (
                  '✨ Suggest Posting Times'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* AI Suggested Times */}
        {suggestedTimes.length > 0 && (
          <div className="card mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <h3 className="font-bold text-lg mb-4 text-purple-900">✨ AI Suggested Posting Times</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {suggestedTimes.map((suggestion, idx) => (
                <div key={idx} className="p-4 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-gray-900">
                      {new Date(suggestion.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-primary-600 font-bold">{suggestion.time}</div>
                  </div>
                  {suggestion.reason && (
                    <p className="text-xs text-gray-600 mb-3">{suggestion.reason}</p>
                  )}
                  <Link
                    href={`/${locale}/post/new?date=${suggestion.date}&time=${suggestion.time}`}
                    className="btn btn-primary btn-sm w-full text-xs"
                  >
                    Create Post
                  </Link>
                </div>
              ))}
            </div>
            <button
              onClick={() => setSuggestedTimes([])}
              className="mt-4 text-sm text-purple-600 hover:underline"
            >
              Clear suggestions
            </button>
          </div>
        )}

        {/* Calendar */}
        <div className="card">
          <div className="calendar-wrapper">
            <Calendar
              value={selectedDate}
              onClickDay={handleDayClick}
              tileContent={tileContent}
              tileClassName={tileClassName}
              className="w-full border-none"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-600">{filteredPosts.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Posts</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600">
              {filteredPosts.filter(p => p.status === 'scheduled').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Scheduled</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-gray-600">
              {filteredPosts.filter(p => p.status === 'draft').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Drafts</div>
          </div>
        </div>
      </main>

      {/* Day Modal */}
      {showDayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
                <button
                  onClick={() => setShowDayModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedDayPosts.length > 0 ? (
                <div className="space-y-4">
                  {selectedDayPosts.map(post => (
                    <Link
                      key={post.id}
                      href={`/${locale}/post/${post.id}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                      onClick={() => setShowDayModal(false)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-gray-900">{post.title}</div>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          post.status === 'posted' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {post.status}
                        </span>
                      </div>
                      {post.caption && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.caption}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {post.scheduled_at && (
                          <span>
                            🕐 {new Date(post.scheduled_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                        {post.platforms && post.platforms.length > 0 && (
                          <div className="flex items-center gap-1">
                            {post.platforms.map((platform, idx) => (
                              <span key={idx}>{getPlatformIcon(platform)}</span>
                            ))}
                          </div>
                        )}
                        {post.category && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                            {post.category}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-5xl mb-4">📭</div>
                  <p className="text-gray-600 font-medium mb-4">No posts scheduled for this day</p>
                  <Link
                    href={`/${locale}/post/new?date=${selectedDate.toISOString().split('T')[0]}`}
                    className="btn btn-primary"
                    onClick={() => setShowDayModal(false)}
                  >
                    Schedule a Post
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        .react-calendar__tile {
          padding: 1.5rem 0.5rem;
          min-height: 100px;
          position: relative;
        }
        .react-calendar__tile:enabled:hover {
          background-color: #f3f4f6;
        }
        .react-calendar__tile--active {
          background: #e0e7ff !important;
        }
        .react-calendar__month-view__days__day--weekend {
          color: inherit;
        }
        .react-calendar__navigation button {
          font-size: 1.25rem;
          font-weight: 600;
          padding: 1rem;
        }
        .react-calendar__navigation button:enabled:hover {
          background-color: #f3f4f6;
        }
      `}</style>
    </div>
  );
}
