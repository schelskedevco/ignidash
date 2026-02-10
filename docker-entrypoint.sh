#!/bin/sh
set -e

# Patch baked-in localhost URLs at container start.
# Next.js bakes NEXT_PUBLIC_* vars at build time, so we patch the bundles
# to use the correct URLs for the deployment environment.

if [ -n "$SELF_HOSTED_CONVEX_URL" ]; then
  echo "Patching server bundles..."

  # Patch Convex backend URLs
  find .next/server -name "*.js" -type f -exec sed -i \
    -e "s|http://localhost:3210|$SELF_HOSTED_CONVEX_URL|g" \
    -e "s|http://127.0.0.1:3210|$SELF_HOSTED_CONVEX_URL|g" {} +

  # Patch Convex site URLs if provided
  if [ -n "$SELF_HOSTED_CONVEX_SITE_URL" ]; then
    find .next/server -name "*.js" -type f -exec sed -i \
      -e "s|http://localhost:3211|$SELF_HOSTED_CONVEX_SITE_URL|g" \
      -e "s|http://127.0.0.1:3211|$SELF_HOSTED_CONVEX_SITE_URL|g" {} +
  fi

  # Patch CLIENT bundles with public-facing URLs (for non-localhost access)
  # These are what the browser uses, so they must match the public host
  if [ -n "$NEXT_PUBLIC_CONVEX_URL" ] && \
     [ "$NEXT_PUBLIC_CONVEX_URL" != "http://localhost:3210" ]; then
    echo "Patching client bundles for non-localhost access..."
    find .next/static -name "*.js" -type f -exec sed -i \
      -e "s|http://localhost:3210|$NEXT_PUBLIC_CONVEX_URL|g" \
      -e "s|http://127.0.0.1:3210|$NEXT_PUBLIC_CONVEX_URL|g" {} +
  fi

  if [ -n "$NEXT_PUBLIC_CONVEX_SITE_URL" ] && \
     [ "$NEXT_PUBLIC_CONVEX_SITE_URL" != "http://localhost:3211" ]; then
    find .next/static -name "*.js" -type f -exec sed -i \
      -e "s|http://localhost:3211|$NEXT_PUBLIC_CONVEX_SITE_URL|g" \
      -e "s|http://127.0.0.1:3211|$NEXT_PUBLIC_CONVEX_SITE_URL|g" {} +
  fi

  echo "Patching complete"
fi

echo "Starting Next.js server..."
exec node server.js
