import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import LanguageToggle from '@/components/LanguageToggle';
import PlanCard from '@/components/PlanCard';
import UploadProof from '@/components/UploadProof';

export default async function PricingPage({
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
            <Link href={`/${locale}`}>
              <h1 className="text-2xl font-bold text-primary-600">{t('landing.title')}</h1>
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">{t('pricing.title')}</h2>
          <p className="text-xl text-gray-600">{t('pricing.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
          <PlanCard
            plan="monthly"
            price="9,999"
            period={t('pricing.perMonth')}
          />
          <PlanCard
            plan="yearly"
            price="99,999"
            period={t('pricing.perYear')}
          />
        </div>

        <div className="max-w-3xl mx-auto mb-16">
          <div className="card">
            <h3 className="text-2xl font-bold mb-6">{t('pricing.paymentInstructions.title')}</h3>
            <p className="text-gray-600 mb-6">{t('pricing.paymentInstructions.subtitle')}</p>

            <div className="bg-gray-50 p-6 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="font-semibold">{t('pricing.paymentInstructions.bank')}:</div>
                <div>{t('pricing.paymentInstructions.bankName')}</div>

                <div className="font-semibold">{t('pricing.paymentInstructions.accountName')}:</div>
                <div>{t('pricing.paymentInstructions.accountHolder')}</div>

                <div className="font-semibold">{t('pricing.paymentInstructions.accountNumber')}:</div>
                <div>{t('pricing.paymentInstructions.accountNumbers')}</div>

                <div className="font-semibold">{t('pricing.paymentInstructions.currency')}:</div>
                <div>{t('pricing.paymentInstructions.currencyValue')}</div>

                <div className="font-semibold">{t('pricing.paymentInstructions.swift')}:</div>
                <div>{t('pricing.paymentInstructions.swiftCode')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <UploadProof locale={locale} />
        </div>
      </main>
    </div>
  );
}
