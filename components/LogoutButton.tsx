'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';

type LogoutButtonProps = {
  locale: string;
};

export default function LogoutButton({ locale }: LogoutButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push(`/${locale}/auth`);
      router.refresh();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="btn btn-secondary"
    >
      {t('common.logout')}
    </button>
  );
}
