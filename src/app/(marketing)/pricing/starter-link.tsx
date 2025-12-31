'use client';

import Link from 'next/link';
import { track } from '@vercel/analytics';
import posthog from 'posthog-js';

import { cn } from '@/lib/utils';

import type { ProductTier } from './page';

interface StarterLinkProps {
  tier: ProductTier;
}

export default function StarterLink({ tier }: StarterLinkProps) {
  return (
    <Link
      onClick={() => {
        track('Starter plan clicked');
        posthog.capture('starter_plan_clicked');
      }}
      href={tier.href}
      aria-describedby={tier.id}
      className={cn(
        tier.featured
          ? 'bg-rose-500 text-white shadow-xs hover:bg-rose-400 focus-visible:outline-rose-500 dark:shadow-none'
          : 'text-rose-600 inset-ring inset-ring-rose-200 hover:inset-ring-rose-300 focus-visible:outline-rose-600 dark:bg-white/10 dark:text-white dark:inset-ring-white/5 dark:hover:bg-white/20 dark:hover:inset-ring-white/5 dark:focus-visible:outline-white/75',
        'mt-8 block rounded-md px-3.5 py-2.5 text-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 sm:mt-10'
      )}
    >
      Start your plan
    </Link>
  );
}
