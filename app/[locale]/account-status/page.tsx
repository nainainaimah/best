'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import LanguageToggle from '@/components/LanguageToggle';
import type { Subscription } from '@/lib/types';

export default function AccountStatusPage() {
  const t = useTranslations();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadSubscriptionStatus();

    // Poll for status changes every 10 seconds
    const interval = setInterval(() => {
      loadSubscriptionStatus();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setSubscription(data);

      // If subscription is active, redirect to dashboard
      if (data && data.status === 'active') {
        setTimeout(() => {
          router.push(`/${locale}/dashboard`);
        }, 3000);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading account status...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: '✅' };
      case 'pending':
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: '⏳' };
      case 'rejected':
        return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: '❌' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', icon: 'ℹ️' };
    }
  };

  const statusColors = subscription ? getStatusColor(subscription.status) : getStatusColor('none');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href={`/${locale}`}>
              <h1 className="text-2xl font-bold text-primary-600">PostMuse.ai</h1>
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Account Status</h2>
          <p className="text-gray-600">Current subscription and payment status</p>
        </div>

        {!subscription ? (
          // No subscription found
          <div className="card text-center">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-bold mb-4">No Subscription Found</h3>
            <p className="text-gray-600 mb-6">
              You haven't submitted a payment yet. Choose a plan to get started!
            </p>
            <Link href={`/${locale}/pricing`} className="btn btn-primary">
              View Plans & Make Payment
            </Link>
          </div>
        ) : (
          // Subscription exists
          <div className={`card ${statusColors.bg} border-2 ${statusColors.border}`}>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">{statusColors.icon}</div>
              <h3 className={`text-2xl font-bold mb-2 ${statusColors.text}`}>
                {subscription.status === 'active' && 'Subscription Active!'}
                {subscription.status === 'pending' && 'Payment Under Review'}
                {subscription.status === 'rejected' && 'Payment Rejected'}
                {subscription.status === 'cancelled' && 'Subscription Cancelled'}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="font-medium text-gray-700">Plan:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors.text} bg-white`}>
                  {subscription.plan === 'monthly' ? 'Monthly' : 'Yearly'} Plan
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b">
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors.text} bg-white capitalize`}>
                  {subscription.status}
                </span>
              </div>

              {subscription.reference_number && (
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium text-gray-700">Reference Number:</span>
                  <span className="text-gray-900 font-mono text-sm">{subscription.reference_number}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-3 border-b">
                <span className="font-medium text-gray-700">Submitted:</span>
                <span className="text-gray-900">
                  {new Date(subscription.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {subscription.approved_by && (
                <div className="flex justify-between items-center py-3 border-b">
                  <span className="font-medium text-gray-700">Approved By:</span>
                  <span className="text-gray-900">{subscription.approved_by}</span>
                </div>
              )}
            </div>

            {/* Status-specific messages */}
            <div className={`mt-6 p-4 rounded-lg ${statusColors.bg}`}>
              {subscription.status === 'pending' && (
                <>
                  <p className={`${statusColors.text} font-medium mb-2`}>
                    Your payment proof is being reviewed by our team.
                  </p>
                  <p className="text-gray-600 text-sm">
                    This usually takes 1-24 hours. You'll be notified once approved and will get full access to PostMuse.ai.
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    This page auto-refreshes every 10 seconds to check for updates.
                  </p>
                </>
              )}

              {subscription.status === 'active' && (
                <>
                  <p className={`${statusColors.text} font-medium mb-2`}>
                    🎉 Your subscription is active! Redirecting to dashboard...
                  </p>
                  <p className="text-gray-600 text-sm">
                    You now have full access to all PostMuse.ai features.
                  </p>
                </>
              )}

              {subscription.status === 'rejected' && (
                <>
                  <p className={`${statusColors.text} font-medium mb-2`}>
                    Your payment proof was rejected.
                  </p>
                  <p className="text-gray-600 text-sm mb-4">
                    This might be due to an incorrect reference number or unclear payment proof. Please try again or contact support.
                  </p>
                  <Link href={`/${locale}/pricing`} className="btn btn-primary">
                    Submit New Payment Proof
                  </Link>
                </>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex gap-3 justify-center">
              {subscription.status === 'active' && (
                <Link href={`/${locale}/dashboard`} className="btn btn-primary">
                  Go to Dashboard
                </Link>
              )}

              <Link href={`/${locale}/profile`} className="btn btn-secondary">
                View Profile
              </Link>
            </div>
          </div>
        )}

        {/* Help section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Having issues? Contact support at{' '}
            <a href="mailto:support@postmuse.ai" className="text-primary-600 hover:underline">
              support@postmuse.ai
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
