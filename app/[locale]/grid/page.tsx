'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { Post, Profile } from '@/lib/types';
import { PLATFORMS, POST_CATEGORIES } from '@/lib/constants';
import LanguageToggle from '@/components/LanguageToggle';
import LogoutButton from '@/components/LogoutButton';
import { useParams } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Copy, Trash2, Share2, Grid3x3, LayoutGrid, Palette, Eye, RotateCcw } from 'lucide-react';

// Sortable Grid Item Component
function SortableGridItem({
  post,
  index,
  locale,
  patternMode,
  previewMode,
  onDuplicate,
  onDelete,
  showBrandFrame,
  brandColor
}: {
  post: Post | null;
  index: number;
  locale: string;
  patternMode: boolean;
  previewMode: boolean;
  onDuplicate: (post: Post) => void;
  onDelete: (post: Post) => void;
  showBrandFrame: boolean;
  brandColor?: string;
}) {
  const [showActions, setShowActions] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post?.id || `empty-${index}`, disabled: !post || previewMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get category color for pattern mode
  const getCategoryColor = (category?: string) => {
    const categoryObj = POST_CATEGORIES.find(c => c.id === category);
    return categoryObj?.color || '#9CA3AF';
  };

  const borderStyle = showBrandFrame && brandColor
    ? { border: `4px solid ${brandColor}` }
    : {};

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`aspect-square bg-gray-100 rounded-lg overflow-hidden relative ${!previewMode && post ? 'cursor-move' : ''
        }`}
      onMouseEnter={() => !previewMode && setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {post ? (
        <>
          {/* Drag Handle */}
          {!previewMode && (
            <div
              {...attributes}
              {...listeners}
              className="absolute top-2 left-2 z-10 bg-white/80 backdrop-blur-sm rounded p-1 cursor-grab active:cursor-grabbing hover:bg-white transition-colors"
            >
              <GripVertical className="w-4 h-4 text-gray-600" />
            </div>
          )}

          {/* Main Content */}
          <Link
            href={`/${locale}/post/${post.id}`}
            className="block w-full h-full relative hover:opacity-90 transition-opacity"
            style={borderStyle}
          >
            {post.media_url ? (
              <>
                {post.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video
                    src={post.media_url}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={post.media_url}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                )}
                {!previewMode && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3">
                    <p className="text-white text-xs font-semibold line-clamp-2">
                      {post.title}
                    </p>
                    {post.scheduled_at && (
                      <p className="text-white/80 text-xs">
                        {new Date(post.scheduled_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div
                className="w-full h-full p-4 flex flex-col justify-center items-center text-center"
                style={{
                  background: patternMode && post.category
                    ? `linear-gradient(135deg, ${getCategoryColor(post.category)}33, ${getCategoryColor(post.category)}66)`
                    : 'linear-gradient(135deg, #EEF2FF, #E0E7FF)'
                }}
              >
                <p className="text-sm font-semibold mb-2 line-clamp-2 text-gray-900">
                  {post.title}
                </p>
                {!previewMode && post.scheduled_at && (
                  <p className="text-xs text-gray-600">
                    {new Date(post.scheduled_at).toLocaleDateString()}
                  </p>
                )}
                {patternMode && post.category && (
                  <span
                    className="mt-2 px-2 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: getCategoryColor(post.category),
                      color: 'white'
                    }}
                  >
                    {POST_CATEGORIES.find(c => c.id === post.category)?.label}
                  </span>
                )}
              </div>
            )}
          </Link>

          {/* Platform Icons */}
          {!previewMode && post.platforms && post.platforms.length > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1">
              {post.platforms.slice(0, 3).map((platformId, idx) => {
                const platform = PLATFORMS.find(p => p.id === platformId);
                return (
                  <span
                    key={idx}
                    className="text-xs bg-white/90 backdrop-blur-sm rounded px-1.5 py-0.5"
                  >
                    {platform?.icon}
                  </span>
                );
              })}
            </div>
          )}

          {/* Hover Actions */}
          {!previewMode && showActions && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              <Link
                href={`/${locale}/post/${post.id}`}
                className="bg-white/90 backdrop-blur-sm hover:bg-white rounded p-1.5 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Edit className="w-3.5 h-3.5 text-blue-600" />
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDuplicate(post);
                }}
                className="bg-white/90 backdrop-blur-sm hover:bg-white rounded p-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-green-600" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm('Are you sure you want to delete this post?')) {
                    onDelete(post);
                  }
                }}
                className="bg-white/90 backdrop-blur-sm hover:bg-white rounded p-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
          <span className="text-sm">Empty</span>
        </div>
      )}
    </div>
  );
}

export default function GridPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const [posts, setPosts] = useState<Post[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gridMode, setGridMode] = useState<'instagram' | 'generic'>('instagram');
  const [patternMode, setPatternMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);
  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadData();
  }, [gridMode]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated. Please log in.');
        return;
      }

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile error:', profileError);
        // Don't block on profile error, just log it
      }
      setProfile(profileData);

      // Load posts based on grid mode
      let query = supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id);

      // Instagram mode: Only posts with Instagram platform
      if (gridMode === 'instagram') {
        query = query.contains('platforms', ['instagram']);
      }

      // Sort by grid_position if set, otherwise by scheduled_at
      const { data: postsData, error: postsError } = await query.order('grid_position', { ascending: true, nullsFirst: false });

      if (postsError) {
        throw new Error(`Failed to load posts: ${postsError.message}`);
      }

      // Filter and re-sort: posts with grid_position first, then by scheduled_at
      const sortedPosts = (postsData || []).sort((a, b) => {
        if (a.grid_position !== null && b.grid_position !== null) {
          return a.grid_position - b.grid_position;
        }
        if (a.grid_position !== null) return -1;
        if (b.grid_position !== null) return 1;
        return new Date(b.scheduled_at || 0).getTime() - new Date(a.scheduled_at || 0).getTime();
      });

      setPosts(sortedPosts);
      setError(null);
    } catch (error: any) {
      console.error('Error loading data:', error);
      setError(error.message || 'Failed to load grid data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = posts.findIndex(p => p.id === active.id);
    const newIndex = posts.findIndex(p => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newPosts = arrayMove(posts, oldIndex, newIndex);
    setPosts(newPosts);

    // Update grid_position in database
    try {
      const updates = newPosts.map((post, index) => ({
        id: post.id,
        grid_position: index
      }));

      for (const update of updates) {
        await supabase
          .from('posts')
          .update({ grid_position: update.grid_position })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error updating grid positions:', error);
      // Reload on error
      loadData();
    }
  };

  const handleResetLayout = async () => {
    if (!confirm('Reset grid layout? This will clear all custom positions.')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('posts')
        .update({ grid_position: null })
        .eq('user_id', user.id);

      loadData();
    } catch (error) {
      console.error('Error resetting layout:', error);
    }
  };

  const handleDuplicate = async (post: Post) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        title: `${post.title} (Copy)`,
        caption: post.caption,
        media_url: post.media_url,
        hashtags: post.hashtags,
        platforms: post.platforms,
        category: post.category,
        status: 'draft',
        scheduled_at: null,
        grid_position: null,
      });

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error duplicating post:', error);
      alert('Failed to duplicate post');
    }
  };

  const handleDelete = async (post: Post) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    }
  };

  const handleGenerateShareLink = async () => {
    setGeneratingLink(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if share link already exists
      const { data: existingShares } = await supabase
        .from('grid_shares')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (existingShares) {
        const link = `${window.location.origin}/share/grid/${existingShares.token}`;
        setShareLink(link);
      } else {
        // Create new share link
        const { data, error } = await supabase
          .rpc('generate_grid_share_token', {
            p_user_id: user.id,
            p_title: `${profile?.brand_name || profile?.display_name}'s Grid`
          });

        if (error) throw error;

        // Fetch the created share
        const { data: newShare } = await supabase
          .from('grid_shares')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single();

        if (newShare) {
          const link = `${window.location.origin}/share/grid/${newShare.token}`;
          setShareLink(link);
        }
      }

      setShowShareModal(true);
    } catch (error) {
      console.error('Error generating share link:', error);
      alert('Failed to generate share link');
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  const handleRevokeLink = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('grid_shares')
        .update({ is_active: false })
        .eq('user_id', user.id);

      setShowShareModal(false);
      setShareLink('');
    } catch (error) {
      console.error('Error revoking link:', error);
    }
  };

  // Fill grid with posts or empty slots
  const gridSize = gridMode === 'instagram' ? 9 : Math.max(12, Math.ceil(posts.length / 4) * 4);
  const gridPosts = Array(gridSize).fill(null).map((_, i) => posts[i] || null);
  const itemIds = gridPosts.map((post, idx) => post?.id || `empty-${idx}`);

  const showBrandFrame = profile?.grid_preferences?.showBrandFrame || false;
  const brandColor = profile?.brand_colors?.primary || '#6366F1';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading grid...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
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
              <Link href={`/${locale}/calendar`} className="btn btn-secondary">
                📅 Calendar
              </Link>
              <LanguageToggle />
              <LogoutButton locale={locale} />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">🎨 Grid Planner</h2>
          <p className="text-gray-600">Visualize and organize your content grid</p>
        </div>

        {/* Controls */}
        <div className="card mb-6">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            {/* Left Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Grid Mode Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setGridMode('instagram')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${gridMode === 'instagram'
                    ? 'bg-white shadow-sm text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                  Instagram
                </button>
                <button
                  onClick={() => setGridMode('generic')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${gridMode === 'generic'
                    ? 'bg-white shadow-sm text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Generic
                </button>
              </div>

              {/* Pattern Mode */}
              <button
                onClick={() => setPatternMode(!patternMode)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${patternMode
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <Palette className="w-4 h-4" />
                Pattern Mode
              </button>

              {/* Preview Mode */}
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${previewMode
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>

              {/* Reset Layout */}
              <button
                onClick={handleResetLayout}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium text-gray-600 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3">
              {/* Share Button */}
              <button
                onClick={handleGenerateShareLink}
                disabled={generatingLink}
                className="btn btn-primary flex items-center gap-2"
              >
                {generatingLink ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Share Grid
                  </>
                )}
              </button>

              {/* Create Post */}
              <Link href={`/${locale}/post/new`} className="btn btn-secondary">
                + New Post
              </Link>
            </div>
          </div>
        </div>

        {/* Pattern Legend */}
        {patternMode && (
          <div className="card mb-6 bg-purple-50 border-2 border-purple-200">
            <h3 className="font-semibold text-sm mb-3 text-purple-900">Category Colors:</h3>
            <div className="flex flex-wrap gap-2">
              {POST_CATEGORIES.map((category) => (
                <div key={category.id} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <span className="text-sm text-gray-700">{category.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="card bg-red-50 border-2 border-red-200 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">Error Loading Grid</h3>
                <p className="text-sm text-red-700 mb-3">{error}</p>
                <button
                  onClick={loadData}
                  className="btn btn-secondary btn-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div className="card">
          {error ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">😞</div>
              <h3 className="text-xl font-semibold mb-2">Failed to Load Grid</h3>
              <p className="text-gray-600 mb-6">
                Please try refreshing or check your connection.
              </p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-gray-600 mb-6">
                {gridMode === 'instagram'
                  ? 'Create posts with Instagram platform selected to see them here'
                  : 'Create your first post to start building your grid'}
              </p>
              <Link href={`/${locale}/post/new`} className="btn btn-primary">
                Create First Post
              </Link>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={itemIds} strategy={rectSortingStrategy}>
                <div
                  className={`grid gap-2 ${gridMode === 'instagram'
                    ? 'grid-cols-3'
                    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                    }`}
                >
                  {gridPosts.map((post, index) => (
                    <SortableGridItem
                      key={post?.id || `empty-${index}`}
                      post={post}
                      index={index}
                      locale={locale}
                      patternMode={patternMode}
                      previewMode={previewMode}
                      onDuplicate={handleDuplicate}
                      onDelete={handleDelete}
                      showBrandFrame={showBrandFrame}
                      brandColor={brandColor}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mt-6">
          <div className="card text-center">
            <div className="text-3xl font-bold" style={{ color: brandColor }}>
              {posts.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Posts</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-blue-600">
              {posts.filter(p => p.status === 'scheduled').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Scheduled</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-gray-600">
              {posts.filter(p => p.category).length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Categorized</div>
          </div>
        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Share Your Grid</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Share a beautiful, read-only view of your {gridMode === 'instagram' ? 'Instagram' : 'content'} grid with clients or followers.
            </p>

            <div className="bg-gray-50 rounded-lg p-3 mb-4 break-all text-sm font-mono">
              {shareLink}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyLink}
                className="btn btn-primary flex-1"
              >
                📋 Copy Link
              </button>
              <button
                onClick={handleRevokeLink}
                className="btn btn-secondary"
              >
                Revoke
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              💡 Tip: Anyone with this link can view your grid (no login required)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
