'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function UploadProof() {
  const t = useTranslations();
  const router = useRouter();
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a screenshot');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `payment-proofs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan,
          status: 'pending',
          reference_number: referenceNumber,
          screenshot_url: urlData.publicUrl,
        });

      if (dbError) throw dbError;

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card bg-green-50 border-2 border-green-200">
        <p className="text-green-800 text-center text-lg">
          {t('pricing.uploadProof.success')}
        </p>
        <p className="text-green-600 text-center mt-2">
          {t('pricing.uploadProof.pending')}
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-2xl font-bold mb-6">{t('pricing.uploadProof.title')}</h3>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('pricing.uploadProof.plan')}
          </label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value as any)}
            className="input"
            required
          >
            <option value="monthly">{t('pricing.monthly')} - TZS 9,999</option>
            <option value="yearly">{t('pricing.yearly')} - TZS 99,999</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t('pricing.uploadProof.referenceNumber')}
          </label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            {t('pricing.uploadProof.screenshot')}
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="input"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading ? t('common.loading') : t('pricing.uploadProof.submit')}
        </button>
      </form>
    </div>
  );
}
