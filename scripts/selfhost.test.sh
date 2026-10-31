#!/bin/sh
set -eu

repository_root=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
temporary_directory=$(mktemp -d)
trap 'rm -rf "$temporary_directory"' EXIT HUP INT TERM

fail() {
  echo "Test failed: $1" >&2
  exit 1
}

assert_contains() {
  haystack=$1
  needle=$2
  case "$haystack" in
    *"$needle"*) ;;
    *) fail "expected output to contain: $needle" ;;
  esac
}

assert_not_contains() {
  haystack=$1
  needle=$2
  case "$haystack" in
    *"$needle"*) fail "output exposed a configured secret" ;;
    *) ;;
  esac
}

generator_directory="$temporary_directory/generator"
credentials_directory="$temporary_directory/credentials"
mkdir -p "$generator_directory" "$credentials_directory"

cat > "$generator_directory/generate.sh" <<'EOF'
#!/bin/sh
printf '%s\n' 'generated-admin-key'
EOF
chmod +x "$generator_directory/generate.sh"

CONVEX_ADMIN_KEY_FILE="$credentials_directory/admin-key" \
CONVEX_ADMIN_KEY_OWNER="$(id -u):$(id -g)" \
CONVEX_GENERATOR_DIRECTORY="$generator_directory" \
CONVEX_GENERATOR=./generate.sh \
  sh "$repository_root/scripts/convex-admin-key.sh" >/dev/null

[ "$(cat "$credentials_directory/admin-key")" = 'generated-admin-key' ] || fail 'admin key was not stored'

cat > "$generator_directory/generate.sh" <<'EOF'
#!/bin/sh
exit 99
EOF
chmod +x "$generator_directory/generate.sh"

CONVEX_ADMIN_KEY_FILE="$credentials_directory/admin-key" \
CONVEX_ADMIN_KEY_OWNER="$(id -u):$(id -g)" \
CONVEX_GENERATOR_DIRECTORY="$generator_directory" \
CONVEX_GENERATOR=./generate.sh \
  sh "$repository_root/scripts/convex-admin-key.sh" >/dev/null || fail 'stored admin key was not reused'

fake_convex="$temporary_directory/convex"
command_log="$temporary_directory/commands"
cat > "$fake_convex" <<'EOF'
#!/bin/sh
if [ -n "${CONVEX_DEPLOY_KEY:-}" ] || [ -n "${CONVEX_DEPLOYMENT:-}" ]; then
  echo 'cloud deployment selector leaked into Convex CLI' >&2
  exit 43
fi
if [ "$1" = 'env' ] && [ "$2" = 'set' ]; then
  cat >/dev/null
fi
printf '%s\n' "$*" >> "$COMMAND_LOG"
if [ "${FAIL_COMMAND:-}" = "$1" ]; then
  exit 42
fi
if [ "$1" = 'run' ] && [ "$2" = 'migrations:getStatus' ]; then
  if [ "${MIGRATION_STATUS:-complete}" = 'failed' ]; then
    printf '%s\n' '[{"isDone":false,"state":"failed","error":"test failure"}]'
  else
    printf '%s\n' '[{"isDone":true,"state":"success"}]'
  fi
fi
EOF
chmod +x "$fake_convex"

auth_secret='auth-secret-that-must-not-be-logged'
api_secret='api-secret-that-must-not-be-logged'

output=$(
  COMMAND_LOG="$command_log" \
  CONVEX_BIN="$fake_convex" \
  CONVEX_ADMIN_KEY_FILE="$credentials_directory/admin-key" \
  CONVEX_DEPLOY_KEY=poisoned-cloud-key \
  CONVEX_DEPLOYMENT=dev:poisoned-cloud-deployment \
  SELF_HOSTED=true \
  SITE_URL=http://localhost:3000 \
  NEXT_PUBLIC_CONVEX_URL=http://localhost:3210 \
  NEXT_PUBLIC_CONVEX_SITE_URL=http://localhost:3211 \
  BETTER_AUTH_SECRET="$auth_secret" \
  CONVEX_API_SECRET="$api_secret" \
    sh "$repository_root/scripts/convex-init.sh" 2>&1
)

commands=$(cat "$command_log")
assert_contains "$commands" 'env set BETTER_AUTH_SECRET'
assert_contains "$commands" 'env set CONVEX_API_SECRET'
assert_contains "$commands" 'deploy'
assert_contains "$commands" 'run migrations:runAll'
assert_contains "$commands" 'run migrations:getStatus'
assert_not_contains "$output" "$auth_secret"
assert_not_contains "$output" "$api_secret"
assert_not_contains "$commands" "$auth_secret"
assert_not_contains "$commands" "$api_secret"

if COMMAND_LOG="$command_log" \
  CONVEX_BIN="$fake_convex" \
  CONVEX_ADMIN_KEY_FILE="$credentials_directory/admin-key" \
  SELF_HOSTED=true \
  SITE_URL=http://localhost:3000 \
  NEXT_PUBLIC_CONVEX_URL=http://localhost:3210 \
  NEXT_PUBLIC_CONVEX_SITE_URL=http://localhost:3211 \
  CONVEX_API_SECRET="$api_secret" \
    sh "$repository_root/scripts/convex-init.sh" >"$temporary_directory/missing.out" 2>&1; then
  fail 'missing required configuration succeeded'
fi
assert_contains "$(cat "$temporary_directory/missing.out")" 'BETTER_AUTH_SECRET must be set'

if COMMAND_LOG="$command_log" \
  CONVEX_BIN="$fake_convex" \
  CONVEX_ADMIN_KEY_FILE="$credentials_directory/admin-key" \
  SELF_HOSTED=true \
  SITE_URL=http://localhost:3000 \
  NEXT_PUBLIC_CONVEX_URL=http://localhost:3210 \
  NEXT_PUBLIC_CONVEX_SITE_URL=http://localhost:3211 \
  BETTER_AUTH_SECRET=too-short \
  CONVEX_API_SECRET="$api_secret" \
    sh "$repository_root/scripts/convex-init.sh" >"$temporary_directory/short.out" 2>&1; then
  fail 'short authentication secret succeeded'
fi
assert_contains "$(cat "$temporary_directory/short.out")" 'BETTER_AUTH_SECRET must be at least 32 characters long'

if COMMAND_LOG="$command_log" \
  FAIL_COMMAND=deploy \
  CONVEX_BIN="$fake_convex" \
  CONVEX_ADMIN_KEY_FILE="$credentials_directory/admin-key" \
  SELF_HOSTED=true \
  SITE_URL=http://localhost:3000 \
  NEXT_PUBLIC_CONVEX_URL=http://localhost:3210 \
  NEXT_PUBLIC_CONVEX_SITE_URL=http://localhost:3211 \
  BETTER_AUTH_SECRET="$auth_secret" \
  CONVEX_API_SECRET="$api_secret" \
    sh "$repository_root/scripts/convex-init.sh" >"$temporary_directory/failure.out" 2>&1; then
  fail 'Convex deployment failure was ignored'
fi

if COMMAND_LOG="$command_log" \
  MIGRATION_STATUS=failed \
  CONVEX_BIN="$fake_convex" \
  CONVEX_ADMIN_KEY_FILE="$credentials_directory/admin-key" \
  SELF_HOSTED=true \
  SITE_URL=http://localhost:3000 \
  NEXT_PUBLIC_CONVEX_URL=http://localhost:3210 \
  NEXT_PUBLIC_CONVEX_SITE_URL=http://localhost:3211 \
  BETTER_AUTH_SECRET="$auth_secret" \
  CONVEX_API_SECRET="$api_secret" \
    sh "$repository_root/scripts/convex-init.sh" >"$temporary_directory/migration-failure.out" 2>&1; then
  fail 'Convex migration failure was ignored'
fi
assert_contains "$(cat "$temporary_directory/migration-failure.out")" 'one or more Convex migrations failed'

echo 'Self-host initialization tests passed.'
