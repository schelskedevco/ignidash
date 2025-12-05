import { createAuthClient } from 'better-auth/react';
import { convexClient } from '@convex-dev/better-auth/client/plugins';
import { polarClient } from '@polar-sh/better-auth';

export const authClient = createAuthClient({
  plugins: [convexClient(), polarClient()],
});
