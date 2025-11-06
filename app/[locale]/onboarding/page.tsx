'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const t = useTranslations();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [brandVoice, setBrandVoice] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: displayName,
          brand_voice: brandVoice,
        });

      if (error) throw error;

      router.push('/pricing');
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-2">{t('onboarding.title')}</h1>
        <p className="text-gray-600 mb-8">{t('onboarding.subtitle')}</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('onboarding.displayName')}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t('onboarding.brandVoice')}
            </label>
            <textarea
              value={brandVoice}
              onChange={(e) => setBrandVoice(e.target.value)}
              className="input min-h-[150px]"
              placeholder={t('onboarding.brandVoicePlaceholder')}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? t('common.loading') : t('onboarding.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
