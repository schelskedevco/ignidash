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
  elif [ "${MIGRATION_STATUS:-complete}" = 'empty' ]; then
    printf '%s\n' '[]'
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

CONVEX_MIGRATION_TIMEOUT_SECONDS=0 \
COMMAND_LOG="$command_log" \
  MIGRATION_STATUS=empty \
  CONVEX_BIN="$fake_convex" \
  CONVEX_ADMIN_KEY_FILE="$credentials_directory/admin-key" \
  SELF_HOSTED=true \
  SITE_URL=http://localhost:3000 \
  NEXT_PUBLIC_CONVEX_URL=http://localhost:3210 \
  NEXT_PUBLIC_CONVEX_SITE_URL=http://localhost:3211 \
  BETTER_AUTH_SECRET="$auth_secret" \
  CONVEX_API_SECRET="$api_secret" \
    sh "$repository_root/scripts/convex-init.sh" >/dev/null 2>&1 || fail 'an empty migration list did not count as complete'

# selfhost.sh: run against a scratch checkout with a fake docker binary.
# Optional values are synced only when set; empty ones are skipped.
: > "$command_log"
COMMAND_LOG="$command_log" \
  CONVEX_BIN="$fake_convex" \
  CONVEX_ADMIN_KEY_FILE="$credentials_directory/admin-key" \
  SELF_HOSTED=true \
  SITE_URL=http://localhost:3000 \
  NEXT_PUBLIC_CONVEX_URL=http://localhost:3210 \
  NEXT_PUBLIC_CONVEX_SITE_URL=http://localhost:3211 \
  BETTER_AUTH_SECRET="$auth_secret" \
  CONVEX_API_SECRET="$api_secret" \
  GOOGLE_CLIENT_ID='' \
  OPENAI_API_KEY=test-openai-key \
    sh "$repository_root/scripts/convex-init.sh" >/dev/null 2>&1 || fail 'initialization with optional values failed'
assert_contains "$(cat "$command_log")" 'env set OPENAI_API_KEY'
case "$(cat "$command_log")" in *'env set GOOGLE_CLIENT_ID'*) fail 'an empty optional value was synced' ;; esac

fake_bin="$temporary_directory/bin"
mkdir -p "$fake_bin"
docker_log="$temporary_directory/docker-commands"
# Records each docker invocation; succeeds without doing anything.
printf '#!/bin/sh\nprintf "%%s\\n" "$*" >> "%s"\nexit 0\n' "$docker_log" > "$fake_bin/docker"
chmod +x "$fake_bin/docker"

new_checkout() {
  checkout_directory=$(mktemp -d "$temporary_directory/checkout.XXXXXX")
  mkdir "$checkout_directory/scripts"
  cp "$repository_root/.env.selfhost.example" "$checkout_directory/"
  cp "$repository_root/scripts/selfhost.sh" "$checkout_directory/scripts/"
  printf '%s' "$checkout_directory"
}

run_selfhost() {
  (cd "$1" && shift && PATH="$fake_bin:$PATH" sh scripts/selfhost.sh "$@")
}

checkout=$(new_checkout)
printf '2\n192.168.1.5\n' | run_selfhost "$checkout" --init >/dev/null 2>&1 || fail 'valid LAN host was rejected'
grep -qx 'SITE_URL=http://192.168.1.5:3000' "$checkout/.env.local" || fail 'LAN SITE_URL was not written'
grep -qx 'NEXT_PUBLIC_CONVEX_URL=http://192.168.1.5:3210' "$checkout/.env.local" || fail 'LAN Convex URL was not written'

checkout=$(new_checkout)
printf '3\nmy-domain.example.com\n' | run_selfhost "$checkout" --init >/dev/null 2>&1 || fail 'valid domain was rejected'
grep -qx 'NEXT_PUBLIC_CONVEX_SITE_URL=https://actions.my-domain.example.com' "$checkout/.env.local" || fail 'domain site URL was not written'

for bad_input in '2\na|b\n' '2\nx&y\n' '2\nhttps://host\n' '3\nexample.com/\n' '3\nexample.com:443\n' '2\n\n'; do
  checkout=$(new_checkout)
  # shellcheck disable=SC2059 # the test inputs contain intentional \n escapes
  if printf "$bad_input" | run_selfhost "$checkout" --init >"$temporary_directory/bad-host.out" 2>&1; then
    fail "invalid host input was accepted: $bad_input"
  fi
  [ ! -e "$checkout/.env.local" ] || fail "invalid host input left a partial .env.local: $bad_input"
done

checkout=$(new_checkout)
cp "$checkout/.env.selfhost.example" "$checkout/.env.local"
printf 'CONVEX_SELF_HOSTED_ADMIN_KEY="convex-self-hosted|legacy"\n' >> "$checkout/.env.local"
chmod 644 "$checkout/.env.local"
legacy_output=$(run_selfhost "$checkout" --sync-only 2>&1) || fail 'sync-only failed on a legacy .env.local'
[ -n "$(find "$checkout/.env.local" -perm 600)" ] || fail 'legacy .env.local permissions were not tightened'
assert_contains "$legacy_output" 'still contains CONVEX_SELF_HOSTED_ADMIN_KEY'

echo 'Self-host initialization tests passed.'

checkout=$(new_checkout)
sed -e "s|^SITE_URL=.*|SITE_URL='http://quoted.example:3000'|" \
  -e 's|^NEXT_PUBLIC_CONVEX_URL=.*|NEXT_PUBLIC_CONVEX_URL="http://quoted.example:3210"|' \
  "$checkout/.env.selfhost.example" > "$checkout/.env.local"
quoted_output=$(run_selfhost "$checkout" 2>&1) || fail 'default run failed with quoted values'
assert_contains "$quoted_output" 'App:              http://quoted.example:3000/signup'
assert_contains "$quoted_output" 'Convex Dashboard: http://quoted.example:6791'

# What selfhost.sh asks Docker to do for each option.
docker_calls() { # checkout args... -> the docker commands it ran, one per line
  calls_checkout=$1
  shift
  : > "$docker_log"
  run_selfhost "$calls_checkout" "$@" >/dev/null 2>&1 || return 1
  grep -v '^compose version$' "$docker_log"
}
checkout=$(new_checkout)
cp "$checkout/.env.selfhost.example" "$checkout/.env.local"
[ "$(docker_calls "$checkout" | tr '\n' ';')" = 'compose pull;compose up -d;' ] || fail 'default run must pull and then start the stack'
[ "$(docker_calls "$checkout" --sync-only | tr '\n' ';')" = 'compose run --rm convex-init;' ] || fail '--sync-only must run convex-init'
[ -L "$checkout/.env" ] && [ "$(readlink "$checkout/.env")" = .env.local ] || fail '.env must link to .env.local'
checkout=$(new_checkout)
[ "$(printf '1\n' | docker_calls "$checkout" --init | tr '\n' ';')" = 'compose up -d;' ] || fail '--init must start the stack'
help_output=$(run_selfhost "$checkout" --help 2>&1) || fail '--help must succeed'
assert_contains "$help_output" 'Usage:'
if run_selfhost "$checkout" --bogus >/dev/null 2>&1; then fail 'an unknown option must fail'; fi
rm -f "$checkout/.env.local"
if run_selfhost "$checkout" >/dev/null 2>&1; then fail 'running without .env.local must fail'; fi

echo 'Self-host helper tests passed.'
