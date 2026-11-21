import { createAuthClient } from 'better-auth/react';
import { convexClient } from '@convex-dev/better-auth/client/plugins';
import { stripeClient } from '@better-auth/stripe/client';

export const authClient = createAuthClient({
  // Better Auth's session cookie cache isn't supported with Convex, so every session check reads the
  // database. Skip the refetch on every tab focus; the session still loads on mount and after sign-in/out.
  sessionOptions: { refetchOnWindowFocus: false },
  plugins: [convexClient(), stripeClient({ subscription: true })],
});
