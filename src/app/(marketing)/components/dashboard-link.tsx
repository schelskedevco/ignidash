'use client';

import Link from 'next/link';
import { useConvexAuth } from 'convex/react';

export default function DashboardLink() {
  const { isAuthenticated } = useConvexAuth();

  return (
    <Link
      href="/dashboard"
      className="rounded-md bg-rose-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 dark:bg-rose-500 dark:hover:bg-rose-400 dark:focus-visible:outline-rose-500"
    >
      {isAuthenticated ? 'View dashboard' : 'Start your plan'}
    </Link>
  );
}
