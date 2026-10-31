#!/bin/sh
set -eu

convex_bin=${CONVEX_BIN:-/app/node_modules/.bin/convex}
convex_url=${CONVEX_SELF_HOSTED_URL:-http://convex-backend:3210}
admin_key_file=${CONVEX_ADMIN_KEY_FILE:-/run/ignidash/admin-key}

require_value() {
  variable_name=$1
  variable_value=$(printenv "$variable_name" 2>/dev/null || true)
  if [ -z "$variable_value" ]; then
    echo "Error: $variable_name must be set in .env.local." >&2
    exit 1
  fi
}

require_url() {
  variable_name=$1
  variable_value=$(printenv "$variable_name" 2>/dev/null || true)
  case "$variable_value" in
    http://* | https://*) ;;
    *)
      echo "Error: $variable_name must be an http:// or https:// URL." >&2
      exit 1
      ;;
  esac
}

require_secret() {
  variable_name=$1
  variable_value=$(printenv "$variable_name" 2>/dev/null || true)
  if [ "${#variable_value}" -lt 32 ]; then
    echo "Error: $variable_name must be at least 32 characters long." >&2
    exit 1
  fi
}

for variable_name in BETTER_AUTH_SECRET CONVEX_API_SECRET SITE_URL NEXT_PUBLIC_CONVEX_URL NEXT_PUBLIC_CONVEX_SITE_URL; do
  require_value "$variable_name"
done

for variable_name in SITE_URL NEXT_PUBLIC_CONVEX_URL NEXT_PUBLIC_CONVEX_SITE_URL; do
  require_url "$variable_name"
done

require_secret BETTER_AUTH_SECRET

if [ ! -x "$convex_bin" ]; then
  echo 'Error: the pinned Convex CLI is not installed in the initializer image.' >&2
  exit 1
fi

if [ ! -s "$admin_key_file" ]; then
  echo 'Error: the Convex admin credential is unavailable.' >&2
  exit 1
fi

admin_key=$(cat "$admin_key_file")
if [ -z "$admin_key" ]; then
  echo 'Error: the Convex admin credential is empty.' >&2
  exit 1
fi

# Prevent stale cloud configuration from overriding the explicit self-host target.
unset CONVEX_DEPLOY_KEY CONVEX_DEPLOYMENT
export CONVEX_SELF_HOSTED_URL="$convex_url"
export CONVEX_SELF_HOSTED_ADMIN_KEY="$admin_key"

echo 'Synchronizing Convex environment variables...'
for variable_name in \
  SELF_HOSTED \
  SITE_URL \
  BETTER_AUTH_SECRET \
  CONVEX_API_SECRET \
  GOOGLE_CLIENT_ID \
  GOOGLE_CLIENT_SECRET \
  OPENAI_API_KEY \
  OPENAI_ENDPOINT \
  RESEND_API_KEY \
  STRIPE_SECRET_KEY \
  STRIPE_WEBHOOK_SECRET \
  STRIPE_PRICE_ID \
  NEXT_PUBLIC_POSTHOG_KEY \
  NEXT_PUBLIC_POSTHOG_HOST
do
  variable_value=$(printenv "$variable_name" 2>/dev/null || true)
  if [ -n "$variable_value" ]; then
    printf '%s' "$variable_value" | "$convex_bin" env set "$variable_name"
  fi
done

echo 'Deploying Convex functions...'
"$convex_bin" deploy

echo 'Running pending Convex migrations...'
"$convex_bin" run migrations:runAll

migration_timeout=${CONVEX_MIGRATION_TIMEOUT_SECONDS:-600}
migration_deadline=$(($(date +%s) + migration_timeout))

while :; do
  migration_status_json=$("$convex_bin" run migrations:getStatus)
  migration_state=$(printf '%s' "$migration_status_json" | node -e '
    const statuses = JSON.parse(require("fs").readFileSync(0, "utf8"));
    if (statuses.some(({ error, state }) => error || state === "failed" || state === "canceled")) {
      process.stdout.write("failed");
    } else if (statuses.length > 0 && statuses.every(({ isDone }) => isDone)) {
      process.stdout.write("complete");
    } else {
      process.stdout.write("pending");
    }
  ')

  case "$migration_state" in
    complete) break ;;
    failed)
      echo 'Error: one or more Convex migrations failed. Check the Convex backend logs.' >&2
      exit 1
      ;;
    pending)
      if [ "$(date +%s)" -ge "$migration_deadline" ]; then
        echo "Error: Convex migrations did not complete within ${migration_timeout} seconds." >&2
        exit 1
      fi
      sleep 2
      ;;
    *)
      echo 'Error: unable to determine Convex migration status.' >&2
      exit 1
      ;;
  esac
done

echo 'Convex initialization completed successfully.'
