import { convexBetterAuthNextJs } from '@convex-dev/better-auth/nextjs';

export const { handler, preloadAuthQuery, isAuthenticated, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction } =
  convexBetterAuthNextJs({
    // Use internal Docker URLs if available, fall back to public URLs for local dev
    convexUrl: process.env.CONVEX_URL_INTERNAL ?? process.env.NEXT_PUBLIC_CONVEX_URL!,
    convexSiteUrl: process.env.CONVEX_SITE_URL_INTERNAL ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
  });
