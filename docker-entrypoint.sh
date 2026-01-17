#!/bin/sh
set -e

# Patch baked-in localhost URLs with internal Docker URLs in server bundles.
# Next.js bakes NEXT_PUBLIC_* vars at build time, so we need to patch
# the server-side bundles to use the internal Docker network URLs.

PATCH_MARKER="/tmp/.patched"

if [ -n "$SELF_HOSTED_CONVEX_URL" ] && [ ! -f "$PATCH_MARKER" ]; then
  echo "Patching server bundles..."

  # Patch Convex backend URLs
  find .next/server -name "*.js" -type f | xargs sed -i \
    -e "s|http://localhost:3210|$SELF_HOSTED_CONVEX_URL|g" \
    -e "s|http://127.0.0.1:3210|$SELF_HOSTED_CONVEX_URL|g"

  # Patch Convex site URLs if provided
  if [ -n "$SELF_HOSTED_CONVEX_SITE_URL" ]; then
    find .next/server -name "*.js" -type f | xargs sed -i \
      -e "s|http://localhost:3211|$SELF_HOSTED_CONVEX_SITE_URL|g" \
      -e "s|http://127.0.0.1:3211|$SELF_HOSTED_CONVEX_SITE_URL|g"
  fi

  touch "$PATCH_MARKER"
  echo "Patching complete"
fi

echo "Starting Next.js server..."
exec node server.js
