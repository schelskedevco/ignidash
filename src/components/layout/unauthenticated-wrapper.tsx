'use client';

import { useConvexAuth } from 'convex/react';

import PageLoading from '@/components/ui/page-loading';

export default function UnauthenticatedWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="h-full group-data-[animating=true]/sidebar:transition-[padding-left] group-data-[animating=true]/sidebar:duration-200 group-data-[animating=true]/sidebar:ease-in-out motion-reduce:transition-none lg:pl-72 group-data-[state=collapsed]/sidebar:lg:pl-16">
        <PageLoading message="Not authenticated, please refresh the page" />
      </div>
    );
  }

  return <>{children}</>;
}
