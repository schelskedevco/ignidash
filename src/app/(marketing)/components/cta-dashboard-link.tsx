'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useConvexAuth } from 'convex/react';
import { track } from '@vercel/analytics';
import posthog from 'posthog-js';

import { cn } from '@/lib/utils';

export default function CTADashboardLink() {
  const { isAuthenticated } = useConvexAuth();
  const [isLoading, setIsLoading] = useState(false);

  const className =
    'rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-900 shadow-xs hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring dark:inset-ring-white/5 dark:hover:bg-white/15 dark:focus-visible:outline-white';

  if (isLoading) {
    return (
      <button disabled className={cn(className, 'cursor-not-allowed opacity-75')}>
        Loading...
      </button>
    );
  }

  return (
    <Link
      onClick={() => {
        track('Marketing CTA clicked', { location: 'footer', signedIn: isAuthenticated });
        posthog.capture('marketing_cta_clicked', { location: 'footer' });
        setIsLoading(true);
      }}
      href="/dashboard"
      className={className}
    >
      {isAuthenticated ? 'View dashboard' : 'Start your plan'}
    </Link>
  );
}
