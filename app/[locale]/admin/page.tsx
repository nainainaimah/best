'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { Subscription, Profile } from '@/lib/types';
import { PLATFORMS } from '@/lib/constants';
import LanguageToggle from '@/components/LanguageToggle';
import LogoutButton from '@/components/LogoutButton';
import { useParams } from 'next/navigation';

type EnrichedSubscription = Subscription & {
  user_email?: string;
  profile?: Profile;
};

export default function AdminPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const [subscriptions, setSubscriptions] = useState<EnrichedSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'active' | 'all'>('pending');
  const supabase = createClient();

  useEffect(() => {
    loadSubscriptions();
  }, [filter]);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      // Build query based on filter
      let query = supabase
        .from('subscriptions')
        .select(`
          *,
          profiles:user_id (*)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      } else if (filter === 'active') {
        query = query.eq('status', 'active');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Enrich with user emails
      const enrichedData = await Promise.all((data || []).map(async (sub) => {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(sub.user_id);
          return {
            ...sub,
            user_email: userData?.user?.email || 'Unknown',
            profile: sub.profiles as unknown as Profile
          };
        } catch (err) {
          console.error('Error fetching user email:', err);
          return {
            ...sub,
            user_email: 'Unknown',
            profile: sub.profiles as unknown as Profile
          };
        }
      }));

      setSubscriptions(enrichedData);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (subscriptionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          approved_by: user?.email || 'admin',
        })
        .eq('id', subscriptionId);

      if (error) throw error;
      loadSubscriptions();
    } catch (error) {
      console.error('Error approving subscription:', error);
      alert('Failed to approve subscription');
    }
  };

  const handleReject = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to reject this subscription?')) return;

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'rejected' })
        .eq('id', subscriptionId);

      if (error) throw error;
      loadSubscriptions();
    } catch (error) {
      console.error('Error rejecting subscription:', error);
      alert('Failed to reject subscription');
    }
  };

  const getPlatformIcons = (profile?: Profile) => {
    if (!profile?.platforms) return null;

    const enabledPlatforms = profile.platforms
      .filter(p => p.enabled)
      .map(p => PLATFORMS.find(platform => platform.id === p.platform))
      .filter(Boolean)
      .slice(0, 3); // Show max 3 icons

    return enabledPlatforms;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href={`/${locale}/dashboard`}>
              <h1 className="text-2xl font-bold text-primary-600">PostMuse.ai Admin</h1>
            </Link>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <Link href={`/${locale}/dashboard`} className="btn btn-secondary">
                Dashboard
              </Link>
              <LogoutButton locale={locale} />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Subscription Management</h2>
          <p className="text-gray-600">Review and manage user subscriptions</p>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('pending')}
            className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Pending ({subscriptions.filter(s => s.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All
          </button>
        </div>

        {loading ? (
          <div className="card">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="ml-4 text-gray-600">Loading subscriptions...</p>
            </div>
          </div>
        ) : subscriptions.length > 0 ? (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-3 px-4 font-medium">User</th>
                  <th className="text-left py-3 px-4 font-medium">Brand</th>
                  <th className="text-left py-3 px-4 font-medium">Platforms</th>
                  <th className="text-left py-3 px-4 font-medium">Plan</th>
                  <th className="text-left py-3 px-4 font-medium">Reference</th>
                  <th className="text-left py-3 px-4 font-medium">Proof</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Date</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => {
                  const platformIcons = getPlatformIcons(sub.profile);

                  return (
                    <tr key={sub.id} className="border-b hover:bg-gray-50">
                      {/* User Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {sub.profile?.avatar_url ? (
                            <img
                              src={sub.profile.avatar_url}
                              alt="Avatar"
                              className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                              {(sub.profile?.display_name || sub.user_email || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-sm">
                              {sub.profile?.display_name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {sub.user_email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Brand Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {sub.profile?.brand_colors?.primary && (
                            <div
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: sub.profile.brand_colors.primary }}
                            />
                          )}
                          <span className="text-sm font-medium">
                            {sub.profile?.brand_name || 'N/A'}
                          </span>
                        </div>
                      </td>

                      {/* Platforms Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {platformIcons && platformIcons.length > 0 ? (
                            platformIcons.map((platform, idx) => (
                              <span
                                key={idx}
                                className="text-lg"
                                title={platform?.name}
                              >
                                {platform?.icon}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                          {sub.profile?.platforms && sub.profile.platforms.filter(p => p.enabled).length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{sub.profile.platforms.filter(p => p.enabled).length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Plan Column */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full capitalize">
                          {sub.plan}
                        </span>
                      </td>

                      {/* Reference Column */}
                      <td className="py-3 px-4 text-sm">
                        {sub.reference_number || 'N/A'}
                      </td>

                      {/* Proof Column */}
                      <td className="py-3 px-4">
                        {sub.screenshot_url ? (
                          <a
                            href={sub.screenshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline text-sm"
                          >
                            View Proof
                          </a>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>

                      {/* Status Column */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sub.status === 'active' ? 'bg-green-100 text-green-800' :
                          sub.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          sub.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {sub.status}
                        </span>
                        {sub.approved_by && (
                          <div className="text-xs text-gray-500 mt-1">
                            by {sub.approved_by}
                          </div>
                        )}
                      </td>

                      {/* Date Column */}
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions Column */}
                      <td className="py-3 px-4">
                        {sub.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(sub.id)}
                              className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(sub.id)}
                              className="text-xs px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">📋</div>
            <p className="text-gray-600 font-medium">
              {filter === 'pending' ? 'No pending subscriptions' :
               filter === 'active' ? 'No active subscriptions' :
               'No subscriptions found'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Subscriptions will appear here when users submit payment proof
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
