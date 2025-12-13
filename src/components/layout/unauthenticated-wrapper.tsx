'use client';

import { useConvexAuth } from 'convex/react';

import PageLoading from '@/components/ui/page-loading';

export default function UnauthenticatedWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (!isAuthenticated && !isLoading) return <PageLoading message="Not authenticated, please refresh the page" />;
  return <>{children}</>;
}
