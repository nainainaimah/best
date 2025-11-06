import { useTranslations } from 'next-intl';
import Link from 'next/link';
import LanguageToggle from '@/components/LanguageToggle';

export default function LandingPage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-600">{t('landing.title')}</h1>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <Link href="/auth" className="btn btn-secondary">
                {t('landing.cta.login')}
              </Link>
              <Link href="/auth" className="btn btn-primary">
                {t('landing.cta.signup')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-bold mb-6">{t('landing.subtitle')}</h2>
            <p className="text-xl text-gray-600 mb-8">{t('landing.description')}</p>
            <div className="flex justify-center gap-4">
              <Link href="/auth" className="btn btn-primary text-lg px-8 py-3">
                {t('landing.cta.signup')}
              </Link>
              <Link href="/pricing" className="btn btn-secondary text-lg px-8 py-3">
                {t('landing.cta.pricing')}
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12">{t('landing.features.title')}</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-4">🤖</div>
                <h4 className="text-xl font-semibold mb-2">{t('landing.features.aiCaptions')}</h4>
                <p className="text-gray-600">{t('landing.features.aiCaptionsDesc')}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">📅</div>
                <h4 className="text-xl font-semibold mb-2">{t('landing.features.calendar')}</h4>
                <p className="text-gray-600">{t('landing.features.calendarDesc')}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">📱</div>
                <h4 className="text-xl font-semibold mb-2">{t('landing.features.grid')}</h4>
                <p className="text-gray-600">{t('landing.features.gridDesc')}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🔔</div>
                <h4 className="text-xl font-semibold mb-2">{t('landing.features.reminders')}</h4>
                <p className="text-gray-600">{t('landing.features.remindersDesc')}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p>&copy; 2024 PostMuse.ai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
