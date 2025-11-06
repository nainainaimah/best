'use client';

import { useTranslations } from 'next-intl';

type PlanCardProps = {
  plan: 'monthly' | 'yearly';
  price: string;
  period: string;
};

export default function PlanCard({ plan, price, period }: PlanCardProps) {
  const t = useTranslations();

  return (
    <div className="card border-2 border-primary-200 hover:border-primary-500 transition-colors">
      <h3 className="text-2xl font-bold mb-4 capitalize">
        {plan === 'monthly' ? t('pricing.monthly') : t('pricing.yearly')}
      </h3>
      <div className="mb-6">
        <span className="text-4xl font-bold">TZS {price}</span>
        <span className="text-gray-600">{period}</span>
      </div>
      <ul className="space-y-3 mb-6 text-gray-700">
        <li className="flex items-center">
          <span className="mr-2">✓</span>
          AI-Generated Captions
        </li>
        <li className="flex items-center">
          <span className="mr-2">✓</span>
          Content Calendar
        </li>
        <li className="flex items-center">
          <span className="mr-2">✓</span>
          3×3 Grid Planner
        </li>
        <li className="flex items-center">
          <span className="mr-2">✓</span>
          Smart Reminders
        </li>
      </ul>
    </div>
  );
}
