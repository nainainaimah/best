'use client';

import { useParams, usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function LanguageToggle() {
  const t = useTranslations();
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentLocale = params.locale as string;

  const toggleLanguage = () => {
    const newLocale = currentLocale === 'en' ? 'swa' : 'en';
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPath);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="btn btn-secondary"
      aria-label={t('common.language')}
    >
      {currentLocale === 'en' ? '🇬🇧 EN' : '🇹🇿 SWA'}
    </button>
  );
}
