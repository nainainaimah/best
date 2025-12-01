'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { Post, Profile, AIWeeklyInsights } from '@/lib/types';
import { PLATFORMS } from '@/lib/constants';
import LanguageToggle from '@/components/LanguageToggle';
import LogoutButton from '@/components/LogoutButton';
import Logo from '@/components/Logo';
import PlatformIcon from '@/components/PlatformIcon';
import { useParams } from 'next/navigation';
import { Sparkles, Grid3x3, Settings, Wrench, Calendar, FileText, Bot, Lightbulb, Edit, Target, Clock, CalendarDays, Hand, Sun, Palette } from 'lucide-react';
import { getContentPillars } from '@/lib/pillarUtils';

export default function DashboardPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [todayPosts, setTodayPosts] = useState<Post[]>([]);
  const [weekPosts, setWeekPosts] = useState<Post[]>([]);
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [gridPosts, setGridPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<AIWeeklyInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadDashboardData();
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setUserEmail(user.email);
      const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim()) || ['naimakunambi@gmail.com'];
      setIsAdmin(adminEmails.includes(user.email));
    }
  };

  const loadDashboardData = async () => {
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

      // Get date ranges
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      // Load today's posts
      const { data: todayData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_at', today.toISOString())
        .lt('scheduled_at', tomorrow.toISOString())
        .order('scheduled_at', { ascending: true });
      setTodayPosts(todayData || []);

      // Load this week's posts
      const { data: weekData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .gte('scheduled_at', startOfWeek.toISOString())
        .lt('scheduled_at', endOfWeek.toISOString())
        .order('scheduled_at', { ascending: true });
      setWeekPosts(weekData || []);

      // Load drafts
      const { data: draftsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(5);
      setDrafts(draftsData || []);

      // Load Instagram grid posts (next 6 scheduled)
      const { data: gridData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .filter('platforms', 'cs', '["instagram"]')
        .in('status', ['scheduled', 'posted'])
        .order('scheduled_at', { ascending: true })
        .limit(6);
      setGridPosts(gridData || []);

      // Load AI insights
      if (profileData && weekData) {
        loadAIInsights(profileData, weekData);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAIInsights = async (profile: Profile, weekPosts: Post[]) => {
    setLoadingInsights(true);
    try {
      const response = await fetch('/api/ai/dashboard-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, posts: weekPosts }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiInsights(data);
      }
    } catch (error) {
      console.error('Error loading AI insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getPostsForDay = (date: Date) => {
    return weekPosts.filter(post => {
      if (!post.scheduled_at) return false;
      const postDate = new Date(post.scheduled_at);
      return postDate.toDateString() === date.toDateString();
    });
  };

  const getPlatformIcon = (platformId: string) => {
    return PLATFORMS.find(p => p.id === platformId)?.icon || 'Smartphone';
  };

  const getPlatformColor = (platformId: string) => {
    return PLATFORMS.find(p => p.id === platformId)?.color || '#6B7280';
  };

  const getMissingFields = (post: Post) => {
    const missing = [];
    if (!post.caption) missing.push('No caption');
    if (!post.scheduled_at) missing.push('No date/time');
    if (!post.platforms || post.platforms.length === 0) missing.push('No platforms');
    return missing;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b-4" style={{ borderColor: profile?.brand_colors?.primary || '#6366F1' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <Logo
                locale={locale}
                brandColor={profile?.brand_colors?.primary || '#6366F1'}
              />
              <div className="border-l-2 border-gray-200 pl-6 flex items-center gap-3">
                {profile?.avatar_url && (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="w-10 h-10 rounded-full object-cover border-2"
                    style={{ borderColor: profile?.brand_colors?.primary || '#6366F1' }}
                  />
                )}
                <div>
                  <h1 className="text-lg font-bold flex items-center gap-2" style={{ color: profile?.brand_colors?.primary || '#6366F1' }}>
                    <Hand size={20} />
                    Hi, {profile?.display_name || profile?.brand_name || 'there'}!
                  </h1>
                  <p className="text-xs text-gray-600">Welcome back</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href={`/${locale}/post/new`} className="btn btn-primary flex items-center gap-2">
                <Sparkles size={18} />
                Create Post
              </Link>
              <Link href={`/${locale}/grid`} className="btn btn-secondary flex items-center gap-2">
                <Grid3x3 size={18} />
                Grid
              </Link>
              <Link href={`/${locale}/profile`} className="btn btn-secondary flex items-center gap-2">
                <Settings size={18} />
                Settings
              </Link>
              {isAdmin && (
                <Link href={`/${locale}/admin`} className="btn btn-secondary flex items-center gap-2">
                  <Wrench size={18} />
                  Admin
                </Link>
              )}
              <LanguageToggle />
              <LogoutButton locale={locale} />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Weekly Insights */}
            {aiInsights && (
              <div className="card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                <div className="flex items-start gap-3 mb-4">
                  <Bot size={32} className="text-blue-600" />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-blue-900">AI Weekly Overview</h3>
                    <p className="text-blue-700 mt-1">{aiInsights.summary}</p>
                  </div>
                </div>
                {aiInsights.suggestions && aiInsights.suggestions.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {aiInsights.suggestions.map((suggestion, idx) => {
                      // Ensure action link includes locale
                      let href = suggestion.actionLink || `/${locale}/post/new`;
                      // If actionLink doesn't start with locale, prepend it
                      if (href.startsWith('/') && !href.startsWith(`/${locale}`)) {
                        href = `/${locale}${href}`;
                      }

                      return (
                        <Link
                          key={idx}
                          href={href}
                          className="flex items-center gap-2 p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors border border-blue-100"
                        >
                          <Lightbulb size={18} className="text-blue-600" />
                          <span className="text-sm text-blue-900">{suggestion.text}</span>
                          <span className="ml-auto text-blue-600">→</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
                {loadingInsights && (
                  <div className="flex items-center gap-2 text-blue-600 text-sm">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Generating insights...</span>
                  </div>
                )}
              </div>
            )}

            {/* Today Section */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar size={24} />
                  Today's Posts
                </h3>
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>

              {todayPosts.length > 0 ? (
                <div className="space-y-3">
                  {todayPosts.map(post => (
                    <Link
                      key={post.id}
                      href={`/${locale}/post/${post.id}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">{post.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              post.status === 'posted' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {post.status}
                            </span>
                          </div>
                          {post.caption && (
                            <p className="text-sm text-gray-600 line-clamp-1 mb-2">{post.caption}</p>
                          )}
                          <div className="flex items-center gap-2">
                            {post.scheduled_at && (
                              <span className="text-xs text-gray-500">
                                <Clock size={14} className="inline" /> {new Date(post.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                            {post.platforms && post.platforms.length > 0 && (
                              <div className="flex items-center gap-1">
                                {post.platforms.slice(0, 3).map((platform, idx) => (
                                  <PlatformIcon
                                    key={idx}
                                    iconName={getPlatformIcon(platform)}
                                    size={16}
                                    color={getPlatformColor(platform)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sun size={48} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium mb-2">No posts scheduled today</p>
                  <p className="text-sm text-gray-500 mb-4">Plan your content to keep your audience engaged!</p>
                  <Link href={`/${locale}/post/new`} className="btn btn-primary">
                    <Edit size={16} className="inline mr-1" />
                    Schedule Today's Post
                  </Link>
                </div>
              )}
            </div>

            {/* This Week Section */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <CalendarDays size={24} />
                  This Week
                </h3>
                <Link href={`/${locale}/calendar`} className="text-sm text-primary-600 hover:underline">
                  View Full Calendar →
                </Link>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {getWeekDays().map((day, idx) => {
                  const dayPosts = getPostsForDay(day);
                  const isToday = day.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg text-center ${
                        isToday ? 'bg-primary-50 border-2 border-primary-600' : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className={`text-xs font-medium mb-1 ${isToday ? 'text-primary-600' : 'text-gray-600'}`}>
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-bold mb-2 ${isToday ? 'text-primary-600' : 'text-gray-900'}`}>
                        {day.getDate()}
                      </div>
                      {dayPosts.length > 0 ? (
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-gray-900">{dayPosts.length} posts</div>
                          <div className="flex justify-center gap-0.5">
                            {dayPosts.slice(0, 3).flatMap(post => post.platforms || [])
                              .filter((p, i, arr) => arr.indexOf(p) === i)
                              .slice(0, 3)
                              .map((platform, i) => (
                                <PlatformIcon
                                  key={i}
                                  iconName={getPlatformIcon(platform)}
                                  size={14}
                                  color={getPlatformColor(platform)}
                                />
                              ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Drafts to Finish */}
            <div className="card">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Edit size={20} />
                Drafts to Finish
              </h3>
              {drafts.length > 0 ? (
                <div className="space-y-3">
                  {drafts.map(draft => {
                    const missing = getMissingFields(draft);
                    return (
                      <Link
                        key={draft.id}
                        href={`/${locale}/post/${draft.id}`}
                        className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <div className="font-medium text-sm mb-1">{draft.title}</div>
                        <div className="text-xs text-gray-500 mb-2">
                          Created {new Date(draft.created_at).toLocaleDateString()}
                        </div>
                        {missing.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {missing.map((item, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No drafts yet</p>
              )}
            </div>

            {/* Quick AI Ideas */}
            <div className="card bg-gradient-to-br from-purple-50 to-pink-50">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Sparkles size={20} />
                Quick AI Ideas
              </h3>
              <div className="space-y-2">
                {profile?.content_pillars && profile.content_pillars.length > 0 && (
                  <Link
                    href={`/${locale}/post/new`}
                    className="block p-3 bg-white rounded-lg hover:shadow-md transition-shadow border border-purple-200"
                  >
                    <div className="text-sm font-medium text-purple-900">
                      <Lightbulb size={16} className="inline mr-1" />
                      Generate ideas for {getContentPillars(profile)[0]?.name}
                    </div>
                  </Link>
                )}
                <Link
                  href={`/${locale}/post/new`}
                  className="block p-3 bg-white rounded-lg hover:shadow-md transition-shadow border border-purple-200"
                >
                  <div className="text-sm font-medium text-purple-900">
                    <Target size={16} className="inline mr-1" />
                    Create caption with AI
                  </div>
                </Link>
                <Link
                  href={`/${locale}/calendar`}
                  className="block p-3 bg-white rounded-lg hover:shadow-md transition-shadow border border-purple-200"
                >
                  <div className="text-sm font-medium text-purple-900">
                    <CalendarDays size={16} className="inline mr-1" />
                    Suggest posting times
                  </div>
                </Link>
              </div>
            </div>

            {/* Mini Grid Preview */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Palette size={20} />
                  Grid Preview
                </h3>
                <Link href={`/${locale}/grid`} className="text-sm text-primary-600 hover:underline">
                  Full Grid →
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-1">
                {Array(6).fill(null).map((_, idx) => {
                  const post = gridPosts[idx];
                  return (
                    <div
                      key={idx}
                      className="aspect-square bg-gray-100 rounded overflow-hidden"
                      style={{
                        borderWidth: profile?.grid_preferences?.showBrandFrame ? '2px' : '0',
                        borderColor: profile?.brand_colors?.primary || 'transparent'
                      }}
                    >
                      {post ? (
                        post.media_url ? (
                          <img
                            src={post.media_url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
                            <span className="text-xs text-center px-2 text-primary-900 font-medium">
                              {post.title}
                            </span>
                          </div>
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          —
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
