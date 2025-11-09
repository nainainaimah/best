import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import LanguageToggle from '@/components/LanguageToggle';

export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations();

  return (
    <div className="min-h-screen">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary-600">{t('landing.title')}</h1>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <Link href={`/${locale}/auth`} className="btn btn-secondary">
                {t('landing.cta.login')}
              </Link>
              <Link href={`/${locale}/auth`} className="btn btn-primary">
                {t('landing.cta.signup')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary-50 to-white py-20 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-block bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              🚀 AI-Powered Content Creation
            </div>
            <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Create Engaging Instagram<br/>Content in Seconds
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Stop staring at blank screens. Let AI generate captivating captions, plan your content calendar, and visualize your Instagram feed—all in one place.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
              <Link href={`/${locale}/auth`} className="btn btn-primary text-lg px-10 py-4 shadow-lg hover:shadow-xl transition-shadow">
                ✨ Start Creating Free
              </Link>
              <Link href={`/${locale}/pricing`} className="btn btn-secondary text-lg px-10 py-4">
                💰 View Pricing
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              ⚡ No credit card required • 🇹🇿 Made for Tanzania • 🌍 Supports English & Swahili
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">1</div>
                <h4 className="text-xl font-semibold mb-2">Sign Up & Set Your Brand Voice</h4>
                <p className="text-gray-600">Tell us about your brand personality so AI can match your unique style</p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">2</div>
                <h4 className="text-xl font-semibold mb-2">Generate AI Captions</h4>
                <p className="text-gray-600">Enter a topic and let our AI create engaging, emoji-rich captions instantly</p>
              </div>
              <div className="text-center">
                <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">3</div>
                <h4 className="text-xl font-semibold mb-2">Schedule & Post</h4>
                <p className="text-gray-600">Plan your content calendar and post directly to Instagram with one click</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold text-center mb-4">{t('landing.features.title')}</h3>
            <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              Everything you need to create, plan, and publish amazing Instagram content
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">🤖</div>
                <h4 className="text-xl font-semibold mb-2">{t('landing.features.aiCaptions')}</h4>
                <p className="text-gray-600">{t('landing.features.aiCaptionsDesc')}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">📅</div>
                <h4 className="text-xl font-semibold mb-2">{t('landing.features.calendar')}</h4>
                <p className="text-gray-600">{t('landing.features.calendarDesc')}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">📱</div>
                <h4 className="text-xl font-semibold mb-2">{t('landing.features.grid')}</h4>
                <p className="text-gray-600">{t('landing.features.gridDesc')}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">🌍</div>
                <h4 className="text-xl font-semibold mb-2">Bilingual Support</h4>
                <p className="text-gray-600">Full support for English & Swahili languages</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing CTA */}
        <section className="py-20 px-4 bg-primary-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-4xl font-bold mb-4">Ready to Transform Your Instagram?</h3>
            <p className="text-xl mb-8 opacity-90">
              Start with our affordable pricing - just TZS 9,999/month
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href={`/${locale}/auth`} className="bg-white text-primary-600 hover:bg-gray-100 font-semibold px-10 py-4 rounded-lg text-lg transition-colors">
                Get Started Now
              </Link>
              <Link href={`/${locale}/pricing`} className="border-2 border-white hover:bg-white hover:text-primary-600 font-semibold px-10 py-4 rounded-lg text-lg transition-colors">
                View All Plans
              </Link>
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
