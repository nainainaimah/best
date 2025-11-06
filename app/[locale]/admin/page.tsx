'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import type { Subscription } from '@/lib/types';
import LanguageToggle from '@/components/LanguageToggle';

export default function AdminPage() {
  const t = useTranslations();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const supabase = createClient();

  useEffect(() => {
    loadSubscriptions();
  }, [filter]);

  const loadSubscriptions = async () => {
    try {
      let query = supabase
        .from('subscriptions')
        .select(`
          *,
          profiles:user_id (display_name)
        `)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('status', 'pending');
      }

      const { data, error } = await query;

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();

      const enrichedData = await Promise.all((data || []).map(async (sub) => {
        const { data: userData } = await supabase.auth.admin.getUserById(sub.user_id);
        return {
          ...sub,
          user_email: userData?.user?.email || 'Unknown'
        };
      }));

      setSubscriptions(enrichedData);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      const { data: allData } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      setSubscriptions(allData || []);
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
    }
  };

  const handleReject = async (subscriptionId: string) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: 'rejected' })
        .eq('id', subscriptionId);

      if (error) throw error;
      loadSubscriptions();
    } catch (error) {
      console.error('Error rejecting subscription:', error);
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
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <Link href="/dashboard" className="btn btn-secondary">
                {t('dashboard.title')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-4">{t('admin.title')}</h2>

          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setFilter('pending')}
              className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {t('admin.pendingSubscriptions')}
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            >
              {t('admin.allSubscriptions')}
            </button>
          </div>
        </div>

        {loading ? (
          <p>{t('common.loading')}</p>
        ) : subscriptions.length > 0 ? (
          <div className="card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">{t('admin.user')}</th>
                  <th className="text-left py-3 px-4">{t('admin.plan')}</th>
                  <th className="text-left py-3 px-4">{t('admin.reference')}</th>
                  <th className="text-left py-3 px-4">{t('admin.screenshot')}</th>
                  <th className="text-left py-3 px-4">{t('admin.status')}</th>
                  <th className="text-left py-3 px-4">{t('admin.date')}</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b">
                    <td className="py-3 px-4">{sub.user_email || 'N/A'}</td>
                    <td className="py-3 px-4 capitalize">{sub.plan}</td>
                    <td className="py-3 px-4">{sub.reference_number || 'N/A'}</td>
                    <td className="py-3 px-4">
                      {sub.screenshot_url ? (
                        <a
                          href={sub.screenshot_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        sub.status === 'active' ? 'bg-green-100 text-green-800' :
                        sub.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {sub.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(sub.id)}
                            className="text-sm px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            {t('admin.approve')}
                          </button>
                          <button
                            onClick={() => handleReject(sub.id)}
                            className="text-sm px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            {t('admin.reject')}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card text-center text-gray-500">
            {t('admin.noPending')}
          </div>
        )}
      </main>
    </div>
  );
}
