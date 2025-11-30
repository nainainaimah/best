'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

export default function LanguageToggle() {
  const t = useTranslations();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = params.locale as string;

  // Save locale preference to localStorage
  useEffect(() => {
    if (currentLocale) {
      localStorage.setItem('preferredLocale', currentLocale);
    }
  }, [currentLocale]);

  const toggleLanguage = () => {
    const newLocale = currentLocale === 'en' ? 'swa' : 'en';
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);

    // Save preference
    localStorage.setItem('preferredLocale', newLocale);

    // Navigate to new locale
    router.push(newPath);

    // Force refresh to ensure translations load
    router.refresh();
  };

  return (
    <button
      onClick={toggleLanguage}
      className="btn btn-secondary"
      aria-label={t('common.language')}
      title={currentLocale === 'en' ? 'Switch to Swahili' : 'Switch to English'}
    >
      {currentLocale === 'en' ? '🇬🇧 EN' : '🇹🇿 SWA'}
    </button>
  );
}
