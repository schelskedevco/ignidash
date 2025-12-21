'use client';

import type { Preloaded } from 'convex/react';
import { usePreloadedAuthQuery } from '@convex-dev/better-auth/nextjs/client';
import { api } from '@/convex/_generated/api';

import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

import type { ProductTier } from './page';

interface BuyProButtonProps {
  tier: ProductTier;
  preloadedSubscriptions: Preloaded<typeof api.auth.listSubscriptions>;
}

export default function BuyProButton({ tier, preloadedSubscriptions }: BuyProButtonProps) {
  const subscriptions = usePreloadedAuthQuery(preloadedSubscriptions);

  return (
    <button
      disabled={subscriptions?.some((subscription) => subscription.plan === 'pro')}
      aria-describedby={tier.id}
      onClick={async () => {
        await authClient.subscription.upgrade({
          plan: 'pro',
          successUrl: `/success`,
          cancelUrl: `/pricing`,
          returnUrl: `/`,
        });
      }}
      className={cn(
        tier.featured
          ? 'bg-rose-500 text-white shadow-xs hover:bg-rose-400 focus-visible:outline-rose-500 dark:shadow-none'
          : 'text-rose-600 inset-ring inset-ring-rose-200 hover:inset-ring-rose-300 focus-visible:outline-rose-600 dark:bg-white/10 dark:text-white dark:inset-ring-white/5 dark:hover:bg-white/20 dark:hover:inset-ring-white/5 dark:focus-visible:outline-white/75',
        'mt-8 block w-full rounded-md px-3.5 py-2.5 text-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed sm:mt-10'
      )}
    >
      Upgrade to {tier.name}
    </button>
  );
}
