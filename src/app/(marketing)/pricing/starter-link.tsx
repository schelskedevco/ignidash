'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { track } from '@vercel/analytics';
import posthog from 'posthog-js';

import { cn } from '@/lib/utils';

import type { ProductTier } from './page';

interface StarterLinkProps {
  tier: ProductTier;
  isAuthenticated: boolean;
}

export default function StarterLink({ tier, isAuthenticated }: StarterLinkProps) {
  const className = cn(
    tier.featured
      ? 'bg-rose-500 text-white shadow-xs hover:bg-rose-400 focus-visible:outline-rose-500 dark:shadow-none'
      : 'text-rose-600 inset-ring inset-ring-rose-200 hover:inset-ring-rose-300 focus-visible:outline-rose-600 dark:bg-white/10 dark:text-white dark:inset-ring-white/5 dark:hover:bg-white/20 dark:hover:inset-ring-white/5 dark:focus-visible:outline-white/75',
    'mt-8 block rounded-md px-3.5 py-2.5 text-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 sm:mt-10'
  );

  const pathname = usePathname();
  const signInUrlWithRedirect = `/signin?redirect=${encodeURIComponent(pathname)}`;

  if (!isAuthenticated) {
    return (
      <Link href={signInUrlWithRedirect} className={className}>
        Sign up for Ignidash
      </Link>
    );
  }

  return (
    <Link
      onClick={() => {
        track('Starter plan clicked');
        posthog.capture('starter_plan_clicked');
      }}
      href={tier.href}
      aria-describedby={tier.id}
      className={className}
    >
      Go to dashboard
    </Link>
  );
}
