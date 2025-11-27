'use client';

import { useEffect } from 'react';
import { useConvexAuth } from 'convex/react';
import { useRouter } from 'next/navigation';

import PageLoading from '@/components/ui/page-loading';

export default function UnauthenticatedWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push('/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  if (!isAuthenticated && !isLoading) return <PageLoading message="Redirecting to sign-in" />;
  return <>{children}</>;
}
