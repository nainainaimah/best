import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Profile, Post, GridShare } from '@/lib/types';
import { PLATFORMS } from '@/lib/constants';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function SharedGridPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Fetch grid share by token
  const { data: gridShare, error: shareError } = await supabase
    .from('grid_shares')
    .select('*')
    .eq('token', token)
    .eq('is_active', true)
    .single();

  // If not found or inactive, show error
  if (shareError || !gridShare) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-xl max-w-md">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Not Found</h1>
          <p className="text-gray-600 mb-6">
            This grid share link is invalid or has been revoked.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to PostMuse.ai
          </Link>
        </div>
      </div>
    );
  }

  // Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', gridShare.user_id)
    .single();

  if (profileError || !profile) {
    return notFound();
  }

  // Fetch Instagram posts (sorted by grid_position)
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', gridShare.user_id)
    .contains('platforms', ['instagram']);

  // Sort posts: grid_position first, then by scheduled_at
  const sortedPosts = (posts || []).sort((a, b) => {
    if (a.grid_position !== null && b.grid_position !== null) {
      return a.grid_position - b.grid_position;
    }
    if (a.grid_position !== null) return -1;
    if (b.grid_position !== null) return 1;
    return new Date(b.scheduled_at || 0).getTime() - new Date(a.scheduled_at || 0).getTime();
  });

  // Take first 9 posts for 3x3 grid
  const gridPosts: (Post | null)[] = Array(9).fill(null).map((_, i) => sortedPosts[i] || null);

  const brandColor = profile.brand_colors?.primary || '#6366F1';
  const brandName = profile.brand_name || profile.display_name || 'Creator';
  const instagramPlatform = profile.platforms?.find((p: any) => p.platform === 'instagram');
  const instagramHandle = instagramPlatform?.handle || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-t-2xl shadow-xl p-6 border-b-4" style={{ borderColor: brandColor }}>
          <div className="flex items-center gap-4 mb-4">
            {/* Avatar */}
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={brandName}
                className="w-20 h-20 rounded-full object-cover border-4"
                style={{ borderColor: brandColor }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl font-bold"
                style={{ backgroundColor: brandColor }}
              >
                {brandName[0].toUpperCase()}
              </div>
            )}

            {/* Brand Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1" style={{ color: brandColor }}>
                {brandName}
              </h1>
              {instagramHandle && (
                <a
                  href={`https://instagram.com/${instagramHandle.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1"
                >
                  📷 @{instagramHandle.replace('@', '')}
                </a>
              )}
              <p className="text-sm text-gray-500 mt-1">{gridShare.title || 'Content Grid Preview'}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: brandColor }}>
                {sortedPosts.length}
              </div>
              <div className="text-xs text-gray-600">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: brandColor }}>
                {sortedPosts.filter(p => p.status === 'posted').length}
              </div>
              <div className="text-xs text-gray-600">Published</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: brandColor }}>
                {sortedPosts.filter(p => p.category).length}
              </div>
              <div className="text-xs text-gray-600">Categorized</div>
            </div>
          </div>
        </div>

        {/* Instagram Grid */}
        <div className="bg-white rounded-b-2xl shadow-xl p-6">
          {sortedPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">No posts yet</h3>
              <p className="text-gray-600">This creator hasn't shared any Instagram posts yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {gridPosts.map((post, index) => (
                <div
                  key={post?.id || `empty-${index}`}
                  className="aspect-square bg-gray-100 rounded-lg overflow-hidden"
                >
                  {post ? (
                    <div className="w-full h-full relative group">
                      {post.media_url ? (
                        <>
                          {post.media_url.match(/\.(mp4|webm|ogg)$/i) ? (
                            <video
                              src={post.media_url}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                            />
                          ) : (
                            <img
                              src={post.media_url}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="text-white text-center p-4">
                              <p className="font-semibold text-sm line-clamp-2">{post.title}</p>
                              {post.scheduled_at && (
                                <p className="text-xs mt-1 opacity-90">
                                  {new Date(post.scheduled_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div
                          className="w-full h-full p-4 flex flex-col justify-center items-center text-center"
                          style={{
                            background: `linear-gradient(135deg, ${brandColor}22, ${brandColor}44)`
                          }}
                        >
                          <p className="text-sm font-semibold line-clamp-3 text-gray-900">
                            {post.title}
                          </p>
                          {post.scheduled_at && (
                            <p className="text-xs text-gray-600 mt-2">
                              {new Date(post.scheduled_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                      <span className="text-gray-400 text-sm">Empty</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer / Watermark */}
        <div className="text-center mt-8 pb-8">
          <p className="text-gray-500 text-sm mb-2">
            Grid preview created with
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg font-bold hover:underline transition-colors"
            style={{ color: brandColor }}
          >
            ✨ PostMuse.ai
          </Link>
          <p className="text-xs text-gray-400 mt-2">
            AI-Powered Social Media Planning
          </p>
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: gridShare } = await supabase
    .from('grid_shares')
    .select('*, profiles!inner(*)')
    .eq('token', token)
    .eq('is_active', true)
    .single();

  if (!gridShare) {
    return {
      title: 'Grid Not Found | PostMuse.ai',
    };
  }

  const profile = (gridShare as any).profiles;
  const brandName = profile?.brand_name || profile?.display_name || 'Creator';

  return {
    title: `${brandName}'s Content Grid | PostMuse.ai`,
    description: `View ${brandName}'s Instagram content grid created with PostMuse.ai`,
  };
}
