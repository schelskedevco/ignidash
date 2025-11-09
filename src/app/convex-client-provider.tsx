'use client';

import { ConvexReactClient } from 'convex/react';
import { ReactNode } from 'react';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';

import { authClient } from '@/lib/auth-client';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!, {
  expectAuth: true,
});

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      {children}
    </ConvexBetterAuthProvider>
  );
}
