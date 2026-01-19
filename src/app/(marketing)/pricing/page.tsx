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
    description: 'Run simulations, explore scenarios, and test your financial resilience.',
    features: [
      'Create and save up to 10 different plans',
      'Estimate taxes and project your cash flow',
      'Stress-test with Monte Carlo and historical data',
    ],
    featured: false,
  },
  {
    name: 'Pro',
    id: 'tier-pro',
    href: '#',
    priceMonthly: '$12',
    description: 'Ask questions, surface insights, and deepen your understanding with AI.',
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
        <p className="mt-2 text-5xl font-semibold tracking-tight text-balance text-stone-900 sm:text-6xl dark:text-white">
          Select your tier
        </p>
      </div>
      <p className="mx-auto mt-6 max-w-2xl text-center text-lg font-medium text-pretty text-stone-600 sm:text-xl/8 dark:text-stone-400">
        Visualize, understand, and refine your financial plan. <br className="hidden sm:block" /> No credit card required.
      </p>
      <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 items-center gap-y-6 sm:mt-20 sm:gap-y-0 lg:max-w-4xl lg:grid-cols-2">
        {tiers.map((tier, tierIdx) => (
          <div
            key={tier.id}
            className={cn(
              tier.featured
                ? 'relative bg-stone-900 shadow-2xl dark:bg-stone-800 dark:shadow-none'
                : 'bg-white/60 sm:mx-8 lg:mx-0 dark:bg-white/2.5',
              tier.featured
                ? ''
                : tierIdx === 0
                  ? 'rounded-t-3xl sm:rounded-b-none lg:rounded-tr-none lg:rounded-bl-3xl'
                  : 'sm:rounded-t-none lg:rounded-tr-3xl lg:rounded-bl-none',
              'rounded-3xl p-8 ring-1 ring-stone-900/10 sm:p-10 dark:ring-white/10'
            )}
          >
            <h3 id={tier.id} className={cn(tier.featured ? 'text-rose-400' : 'text-primary', 'text-base/7 font-semibold')}>
              {tier.name}
            </h3>
            <p className="mt-4 flex items-baseline gap-x-2">
              <span
                className={cn(tier.featured ? 'text-white' : 'text-stone-900 dark:text-white', 'text-5xl font-semibold tracking-tight')}
              >
                {tier.priceMonthly}
              </span>
              <span className={cn(tier.featured ? 'text-stone-400' : 'text-stone-500 dark:text-stone-400', 'text-base')}>/month</span>
            </p>
            <p className={cn(tier.featured ? 'text-stone-300' : 'text-stone-600 dark:text-stone-300', 'mt-6 text-base/7')}>
              {tier.description}
            </p>
            <ul
              role="list"
              className={cn(tier.featured ? 'text-stone-300' : 'text-stone-600 dark:text-stone-300', 'mt-8 space-y-3 text-sm/6 sm:mt-10')}
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
      <p className="relative mx-auto mt-16 w-fit rounded-full px-3 py-2 text-sm/6 text-stone-600 ring-1 ring-stone-900/10 hover:ring-stone-900/20 dark:text-stone-300 dark:ring-white/10 dark:hover:ring-white/20">
        Self-host for free with Docker.{' '}
        <a
          href="https://github.com/schelskedevco/ignidash"
          className="text-primary font-semibold whitespace-nowrap"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub repository"
        >
          <span aria-hidden="true" className="absolute inset-0" />
          <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" className="inline size-4.5 align-text-bottom">
            <path
              fillRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
              clipRule="evenodd"
            />
          </svg>{' '}
          GitHub <span aria-hidden="true">&rarr;</span>
        </a>
      </p>
    </div>
  );
}
