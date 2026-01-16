import { convexBetterAuthNextJs } from '@convex-dev/better-auth/nextjs';

export const { handler, preloadAuthQuery, isAuthenticated, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction } =
  convexBetterAuthNextJs({
    convexUrl: process.env.SELF_HOSTED_CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL!,
    convexSiteUrl: process.env.SELF_HOSTED_CONVEX_SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
  });
