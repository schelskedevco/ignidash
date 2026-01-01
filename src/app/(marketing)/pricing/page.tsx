import type { Metadata } from 'next';
import { CheckIcon } from '@heroicons/react/20/solid';
import { api } from '@/convex/_generated/api';

import { preloadAuthQuery, isAuthenticated as getIsAuthenticated } from '@/lib/auth-server';
import { cn } from '@/lib/utils';

import StarterLink from './starter-link';
import BuyProButton from './buy-pro-button';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Free retirement planning with tax estimation and Monte Carlo simulations. Upgrade to Pro for $12/month to unlock AI chat and educational insights.',
  openGraph: {
    title: 'Pricing - Ignidash',
    description:
      'Free retirement planning with tax estimation and Monte Carlo simulations. Upgrade to Pro for $12/month to unlock AI chat and educational insights.',
  },
};

const tiers = [
  {
    name: 'Starter',
    id: 'tier-starter',
    href: '/signup',
    priceMonthly: '$0',
    description: 'Create simulations, explore different scenarios, and project your finances.',
    features: [
      'Create and save up to 10 different plans',
      'Estimate taxes and forecast your cash flow',
      'Stress-test with Monte Carlo and historical data',
    ],
    featured: false,
  },
  {
    name: 'Pro',
    id: 'tier-pro',
    href: '#',
    priceMonthly: '$12',
    description: 'Use AI to ask questions, surface insights, and better understand your financial plan.',
    features: [
      'Everything in Starter',
      'Ask questions about your plan with AI chat',
      'Get an AI educational overview of your plan',
      'Learn key financial concepts and principles',
    ],
    featured: true,
  },
];

export type ProductTier = (typeof tiers)[number];

export default async function PricingPage() {
  const [preloadedSubscriptions, isAuthenticated] = await Promise.all([
    preloadAuthQuery(api.auth.listSubscriptions, {}),
    getIsAuthenticated(),
  ]);

  return (
    <div className="relative isolate min-h-dvh px-6 py-24 sm:py-32 lg:px-8">
      <div aria-hidden="true" className="absolute inset-x-0 -top-3 -z-10 transform-gpu overflow-hidden px-36 blur-3xl">
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="mx-auto aspect-1155/678 w-288.75 bg-linear-to-tr from-[#ff80b5] to-[#e11d48] opacity-30 dark:opacity-20"
        />
      </div>
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-primary text-base/7 font-semibold">Pricing</h2>
        <p className="mt-2 text-5xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-6xl dark:text-white">
          Select your tier
        </p>
      </div>
      <p className="mx-auto mt-6 max-w-2xl text-center text-lg font-medium text-pretty text-zinc-600 sm:text-xl/8 dark:text-zinc-400">
        Visualize, understand, and refine your financial plan. <br className="hidden sm:block" /> No credit card required.
      </p>
      <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2">
        {tiers.map((tier, tierIdx) => (
          <div
            key={tier.id}
            className={cn(
              tier.featured
                ? 'relative bg-zinc-900 shadow-2xl dark:bg-zinc-800 dark:shadow-none'
                : 'bg-white/60 sm:mx-8 lg:mx-0 dark:bg-white/2.5',
              tier.featured
                ? ''
                : tierIdx === 0
                  ? 'rounded-t-3xl sm:rounded-b-none lg:rounded-tr-none lg:rounded-bl-3xl'
                  : 'sm:rounded-t-none lg:rounded-tr-3xl lg:rounded-bl-none',
              'rounded-3xl p-8 ring-1 ring-zinc-900/10 sm:p-10 dark:ring-white/10'
            )}
          >
            <h3 id={tier.id} className={cn(tier.featured ? 'text-rose-400' : 'text-primary', 'text-base/7 font-semibold')}>
              {tier.name}
            </h3>
            <p className="mt-4 flex items-baseline gap-x-2">
              <span className={cn(tier.featured ? 'text-white' : 'text-zinc-900 dark:text-white', 'text-5xl font-semibold tracking-tight')}>
                {tier.priceMonthly}
              </span>
              <span className={cn(tier.featured ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400', 'text-base')}>/month</span>
            </p>
            <p className={cn(tier.featured ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-300', 'mt-6 text-base/7')}>
              {tier.description}
            </p>
            <ul
              role="list"
              className={cn(tier.featured ? 'text-zinc-300' : 'text-zinc-600 dark:text-zinc-300', 'mt-8 space-y-3 text-sm/6 sm:mt-10')}
            >
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <CheckIcon aria-hidden="true" className={cn(tier.featured ? 'text-rose-400' : 'text-primary', 'h-6 w-5 flex-none')} />
                  {feature}
                </li>
              ))}
            </ul>
            {tier.id === 'tier-pro' ? (
              <BuyProButton tier={tier} preloadedSubscriptions={preloadedSubscriptions} isAuthenticated={isAuthenticated} />
            ) : (
              <StarterLink tier={tier} isAuthenticated={isAuthenticated} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
