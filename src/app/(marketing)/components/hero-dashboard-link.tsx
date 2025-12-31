'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useConvexAuth } from 'convex/react';
import { track } from '@vercel/analytics';
import posthog from 'posthog-js';

import { cn } from '@/lib/utils';

export default function HeroDashboardLink() {
  const { isAuthenticated } = useConvexAuth();
  const [isLoading, setIsLoading] = useState(false);

  const className =
    'rounded-md bg-rose-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 dark:bg-rose-500 dark:hover:bg-rose-400 dark:focus-visible:outline-rose-500';

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
        track('Marketing CTA clicked', { location: 'hero', signedIn: isAuthenticated });
        posthog.capture('marketing_cta_clicked', { location: 'hero' });
        setIsLoading(true);
      }}
      href="/dashboard"
      className={className}
    >
      {isAuthenticated ? 'View dashboard' : 'Start your plan'}
    </Link>
  );
}
