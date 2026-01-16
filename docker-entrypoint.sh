#!/bin/sh
set -e

# Replace baked-in localhost URLs with internal Docker URLs in server bundles
# This is needed because Next.js bakes NEXT_PUBLIC_* vars at build time
if [ -n "$SELF_HOSTED_CONVEX_URL" ]; then
  echo "Patching server bundles to use internal Convex URL: $SELF_HOSTED_CONVEX_URL"

  # Find and replace in all server-side JS files
  find .next/server -name "*.js" -type f -exec sed -i "s|http://localhost:3210|$SELF_HOSTED_CONVEX_URL|g" {} \;
  find .next/server -name "*.js" -type f -exec sed -i "s|http://127.0.0.1:3210|$SELF_HOSTED_CONVEX_URL|g" {} \;
fi

if [ -n "$SELF_HOSTED_CONVEX_SITE_URL" ]; then
  echo "Patching server bundles to use internal Convex Site URL: $SELF_HOSTED_CONVEX_SITE_URL"

  find .next/server -name "*.js" -type f -exec sed -i "s|http://localhost:3211|$SELF_HOSTED_CONVEX_SITE_URL|g" {} \;
  find .next/server -name "*.js" -type f -exec sed -i "s|http://127.0.0.1:3211|$SELF_HOSTED_CONVEX_SITE_URL|g" {} \;
fi

echo "Starting Next.js server..."
exec node server.js
