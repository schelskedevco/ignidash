import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useConvexAuth } from 'convex/react';

export const useAuthMonitor = () => {
  const { isLoading, isAuthenticated } = useConvexAuth();

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) router.push(`/signin?redirect=${encodeURIComponent(pathname)}`);
  }, [isLoading, isAuthenticated, router, pathname]);
};
