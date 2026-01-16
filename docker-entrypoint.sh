#!/bin/sh
set -e

# Replace baked-in localhost URLs with internal Docker URLs in server bundles
# This is needed because Next.js bakes NEXT_PUBLIC_* vars at build time
if [ -n "$CONVEX_URL_INTERNAL" ]; then
  echo "Patching server bundles to use internal Convex URL: $CONVEX_URL_INTERNAL"

  # Find and replace in all server-side JS files
  find .next/server -name "*.js" -type f -exec sed -i "s|http://localhost:3210|$CONVEX_URL_INTERNAL|g" {} \;
  find .next/server -name "*.js" -type f -exec sed -i "s|http://127.0.0.1:3210|$CONVEX_URL_INTERNAL|g" {} \;
fi

if [ -n "$CONVEX_SITE_URL_INTERNAL" ]; then
  echo "Patching server bundles to use internal Convex Site URL: $CONVEX_SITE_URL_INTERNAL"

  find .next/server -name "*.js" -type f -exec sed -i "s|http://localhost:3211|$CONVEX_SITE_URL_INTERNAL|g" {} \;
  find .next/server -name "*.js" -type f -exec sed -i "s|http://127.0.0.1:3211|$CONVEX_SITE_URL_INTERNAL|g" {} \;
fi

echo "Starting Next.js server..."
exec node server.js
