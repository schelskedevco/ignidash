'use client';

import type { Preloaded } from 'convex/react';
import { usePreloadedAuthQuery } from '@convex-dev/better-auth/nextjs/client';
import { api } from '@/convex/_generated/api';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { track } from '@vercel/analytics';
import posthog from 'posthog-js';

import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

import type { ProductTier } from './page';

interface BuyProButtonProps {
  tier: ProductTier;
  preloadedSubscriptions: Preloaded<typeof api.auth.listSubscriptions>;
  isAuthenticated: boolean;
}

export default function BuyProButton({ tier, preloadedSubscriptions, isAuthenticated }: BuyProButtonProps) {
  const subscriptions = usePreloadedAuthQuery(preloadedSubscriptions);
  const isProUser = subscriptions?.some((subscription) => subscription.plan === 'pro' && subscription.status === 'active');

  const className = cn(
    tier.featured
      ? 'bg-rose-500 text-white shadow-xs hover:bg-rose-400 focus-visible:outline-rose-500 dark:shadow-none'
      : 'text-rose-600 inset-ring inset-ring-rose-200 hover:inset-ring-rose-300 focus-visible:outline-rose-600 dark:bg-white/10 dark:text-white dark:inset-ring-white/5 dark:hover:bg-white/20 dark:hover:inset-ring-white/5 dark:focus-visible:outline-white/75',
    'mt-8 block w-full rounded-md px-3.5 py-2.5 text-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed  sm:mt-10'
  );

  const pathname = usePathname();
  const signInUrlWithRedirect = `/signin?redirect=${encodeURIComponent(pathname)}`;

  if (!isAuthenticated) {
    return (
      <Link href={signInUrlWithRedirect} className={className}>
        Start free trial
      </Link>
    );
  }

  return (
    <button
      disabled={isProUser}
      aria-describedby={tier.id}
      onClick={async () => {
        track('Upgrade to Pro clicked');

        posthog.capture('upgrade_to_pro_clicked');

        await authClient.subscription.upgrade({
          plan: 'pro',
          successUrl: `/success`,
          cancelUrl: `/pricing`,
          returnUrl: `/`,
        });
      }}
      className={className}
    >
      {isProUser ? 'Your current plan' : `Start free trial`}
    </button>
  );
}
