import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  output: process.env.SELF_HOSTED === 'true' ? 'standalone' : undefined,
  // Auto-memoizes components and hooks (replaces most manual useMemo/useCallback/memo).
  reactCompiler: true,
  experimental: {
    // recharts isn't in Next's default list; tree-shake its barrel import.
    optimizePackageImports: ['recharts'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'tailwindcss.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // PostHog reverse proxy to avoid ad blockers
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default withBundleAnalyzer(nextConfig);
