import { convexBetterAuthNextJs } from '@convex-dev/better-auth/nextjs';

/**
 * Reuse the Convex JWT from the request's `convex_jwt` cookie on server renders while it is unexpired,
 * instead of fetching a new token from Convex on every request. Experimental in @convex-dev/better-auth:
 * https://labs.convex.dev/better-auth/experimental
 *
 * When a query fails while using a cached token, the helper rethrows if `isAuthError(error)` is true and
 * otherwise retries once with a freshly fetched token. Returning false means any failure on a cached
 * token (for example, a JWT signed by a rotated key) gets one retry with a fresh token. Failures on a
 * fresh token are never retried. Covered by auth-server.test.ts.
 */
export const jwtCache = {
  enabled: true,
  isAuthError: () => false,
};

export const { handler, preloadAuthQuery, isAuthenticated, getToken, fetchAuthQuery, fetchAuthMutation, fetchAuthAction } =
  convexBetterAuthNextJs({
    convexUrl: process.env.SELF_HOSTED_CONVEX_URL ?? process.env.NEXT_PUBLIC_CONVEX_URL!,
    convexSiteUrl: process.env.SELF_HOSTED_CONVEX_SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
    jwtCache,
  });
