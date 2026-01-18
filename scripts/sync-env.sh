#!/bin/bash
set -e

# Sync environment variables from .env.local to Convex
# Usage: ./scripts/sync-env.sh [env-file]

ENV_FILE="${1:-.env.local}"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found"
    exit 1
fi

echo "Syncing environment variables from $ENV_FILE to Convex..."

# Source the env file
set -a
source "$ENV_FILE"
set +a

# Variables to sync to Convex backend
CONVEX_VARS=(
    "SITE_URL"
    "BETTER_AUTH_SECRET"
    "CONVEX_API_SECRET"
    "GOOGLE_CLIENT_ID"
    "GOOGLE_CLIENT_SECRET"
    "OPENAI_API_KEY"
    "OPENAI_ENDPOINT"
    "RESEND_API_KEY"
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "STRIPE_PRICE_ID"
    "NEXT_PUBLIC_POSTHOG_KEY"
    "NEXT_PUBLIC_POSTHOG_HOST"
)

synced=0
skipped=0

for var in "${CONVEX_VARS[@]}"; do
    value="${!var}"
    if [ -n "$value" ]; then
        echo "  Setting $var..."
        npx convex env set "$var" "$value"
        synced=$((synced + 1))
    else
        skipped=$((skipped + 1))
    fi
done

echo ""
echo "Done! Synced $synced variables ($skipped skipped - not set)"
