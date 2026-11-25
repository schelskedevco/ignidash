#!/bin/sh
# End-to-end test of Docker self-hosting, following SELF_HOSTING.md.
#
# Runs every documented scenario against real containers and a real browser:
#   quickstart  selfhost.sh --init, security probes, re-runs, key recovery,
#               backup and restore, failure handling
#   manual      Manual Installation steps with LAN access and changed ports
#   proxy       HTTPS reverse proxy with a private CA (the documented override)
#   upgrade     upgrade from the previous release tag, keeping users and data
#
# Commands and override snippets are read from SELF_HOSTING.md, so the guide
# cannot drift from what is tested. Everything runs in a temporary copy of the
# working tree (including uncommitted changes): your .env.local is never used.
#
# Usage: sh scripts/selfhost.e2e.sh [scenario ...]     (default: all)
# Environment:
#   SELFHOST_E2E_SKIP_BUILD=1   use existing ghcr.io/schelskedevco/ignidash{,-convex-init}:e2e images
#   SELFHOST_E2E_HOST_IP=...    host LAN IP for the manual scenario (auto-detected)
#   SELFHOST_E2E_ARTIFACTS=dir  keep logs and Playwright output here
# Requires: docker (Compose v2.24.4+), curl, jq, openssl, unzip, tar, git, and
# `npx playwright install chromium` in this repository. The proxy scenario
# needs localtest.me, api.localtest.me, and actions.localtest.me to resolve to
# 127.0.0.1 (they do through public DNS; CI adds them to /etc/hosts).

# Checks use sh -c '...' _ args, so the single-quoted scripts expand their arguments themselves.
# shellcheck disable=SC2016,SC2012
set -u

repository_root=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
work=$(mktemp -d "${TMPDIR:-/tmp}/ignidash-selfhost-e2e.XXXXXX")
artifacts=${SELFHOST_E2E_ARTIFACTS:-$work/artifacts}
mkdir -p "$artifacts"
export IGNIDASH_TAG=e2e
app_image=ghcr.io/schelskedevco/ignidash:e2e
init_image=ghcr.io/schelskedevco/ignidash-convex-init:e2e
projects='ignidash-e2e-quickstart ignidash-e2e-manual ignidash-e2e-proxy ignidash-e2e-upgrade'
failures=0
H='Content-Type: application/json'

# ----------------------------------------------------------------- helpers
# Results go to fd 3 (the terminal), so redirecting a check's command output to a
# log file never hides its PASS/FAIL line.
exec 3>&1
pass() { echo "  PASS  $*" >&3; }
fail() { echo "  FAIL  $*" >&3; failures=$((failures + 1)); }
check() { # description command...
  description=$1
  shift
  if "$@"; then pass "$description"; else fail "$description"; fi
}
section() { echo; echo "== $*"; }
mode_of() { stat -c %a "$1" 2>/dev/null || stat -f %Lp "$1"; }
replace_line() { # file key value  (portable sed -i)
  sed "s|^$2=.*|$2=$3|" "$1" > "$1.tmp" && cat "$1.tmp" > "$1" && rm -f "$1.tmp"
}

cleanup() {
  for project in $projects; do
    docker compose -p "$project" down -v --remove-orphans > /dev/null 2>&1 || true
  done
  rm -rf "$work/checkouts"
  [ -n "${SELFHOST_E2E_ARTIFACTS:-}" ] || rm -rf "$work"
}
trap cleanup EXIT
trap 'exit 130' HUP INT TERM

# Print the n-th fenced block of the given language under a heading of SELF_HOSTING.md.
doc_block() { # heading lang n
  awk -v heading="$1" -v lang="$2" -v want="$3" '
    /^#+ / {
      level = index($0, " ") - 1
      title = substr($0, level + 2)
      if (title == heading) { inside = 1; section_level = level; next }
      if (inside && level <= section_level) { inside = 0 }
    }
    inside && $0 == "```" lang { count++; if (count == want) { printing = 1; next } }
    printing && /^```/ { exit }
    printing { print }
  ' "$repository_root/SELF_HOSTING.md"
}
run_doc_block() { # heading n [sed-expression]  -> runs a documented bash block in the current dir
  doc_block "$1" bash "$2" | sed "${3:-}" > "$work/block.sh"
  [ -s "$work/block.sh" ] || { echo "missing bash block $2 under '$1' in SELF_HOSTING.md" >&2; return 1; }
  sh "$work/block.sh"
}

new_checkout() { # name -> prints directory; copies the files a self-hoster gets from git
  directory="$work/checkouts/$1"
  mkdir -p "$directory/scripts"
  cp "$repository_root/docker-compose.yml" "$repository_root/.env.selfhost.example" "$directory/"
  cp "$repository_root"/scripts/selfhost.sh "$repository_root"/scripts/convex-admin-key.sh "$directory/scripts/"
  printf '%s' "$directory"
}
use_project() { # name (all project names are listed in $projects for cleanup)
  export COMPOSE_PROJECT_NAME="ignidash-e2e-$1"
}

wait_healthy() { # base-url
  attempt=0
  while [ $attempt -lt 90 ]; do
    curl -skf -o /dev/null "$1/api/health" && return 0
    attempt=$((attempt + 1))
    sleep 2
  done
  return 1
}
sign_up() { # base-url email password
  curl -sk -o /dev/null -w '%{http_code}' -H "$H" -H "Origin: $1" \
    --data "{\"email\":\"$2\",\"password\":\"$3\",\"name\":\"E2E\"}" "$1/api/auth/sign-up/email"
}
sign_in() { # base-url email password cookie-jar
  curl -sk -c "$4" -o /dev/null -w '%{http_code}' -H "$H" -H "Origin: $1" \
    --data "{\"email\":\"$2\",\"password\":\"$3\"}" "$1/api/auth/sign-in/email"
}
convex_token() { # base-url cookie-jar
  curl -sk -b "$2" "$1/api/auth/convex/token" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p'
}
convex_call() { # convex-url kind function args [jwt]
  curl -sk -H "$H" ${5:+-H "Authorization: Bearer $5"} \
    --data "{\"path\":\"$3\",\"args\":$4,\"format\":\"json\"}" "$1/api/$2"
}
plan_names() { # convex-url jwt
  convex_call "$1" query plans:listPlans '{}' "$2" | jq -r '.value[]?.name' | sort | tr '\n' '|'
}
admin_key() { docker compose run --rm --no-deps --entrypoint sh convex-init -c 'cat /run/ignidash/admin-key' 2> /dev/null; }

browser_tests() { # label base-url convex-url
  if (cd "$repository_root" && rm -rf e2e/.auth &&
    SELFHOST_BASE_URL=$2 SELFHOST_CONVEX_URL=$3 PLAYWRIGHT_HTML_OUTPUT_DIR="$artifacts/playwright-$1" \
      npx playwright test --config playwright.selfhost.config.ts --output "$artifacts/playwright-results-$1" \
      > "$artifacts/playwright-$1.log" 2>&1); then
    pass "browser: sign-up, sign-in, dashboard, live Convex data over $3 ($1)"
  else
    fail "browser tests ($1); see $artifacts/playwright-$1.log"
    tail -n 30 "$artifacts/playwright-$1.log" | sed 's/^/        /'
  fi
}

# ----------------------------------------------------------------- preflight
for port in 443 3000 3001 3210 3211 3310 3311 6791; do
  if curl -s -o /dev/null --max-time 2 "http://127.0.0.1:$port" 2> /dev/null; then
    echo "Port $port is already in use. Stop whatever is using it and retry." >&2
    exit 1
  fi
done
if [ "${SELFHOST_E2E_SKIP_BUILD:-0}" != 1 ]; then
  section 'Building images'
  (cd "$repository_root" &&
    docker build --target convex-init -t "$init_image" . > "$artifacts/build-init.log" 2>&1 &&
    docker build -t "$app_image" --build-arg SELF_HOSTED=true \
      --build-arg NEXT_PUBLIC_CONVEX_URL=http://localhost:3210 \
      --build-arg NEXT_PUBLIC_CONVEX_SITE_URL=http://localhost:3211 . > "$artifacts/build-app.log" 2>&1) ||
    { echo "Image build failed; see $artifacts" >&2; exit 1; }
  echo '  built'
fi

# ----------------------------------------------------------------- scenarios
scenario_quickstart() {
  section 'Quick Start (selfhost.sh --init, localhost)'
  use_project quickstart
  cd "$(new_checkout quickstart)" || return
  base=http://localhost:3000
  convex=http://localhost:3210

  check 'selfhost.sh --init succeeds' sh -c "printf '1\n' | sh scripts/selfhost.sh --init > '$artifacts/quickstart-init.log' 2>&1"
  check 'app becomes healthy' wait_healthy "$base"
  states=$(docker compose ps -a --format '{{.Service}}={{.State}}:{{.ExitCode}}' | sort | tr '\n' ' ')
  case "$states" in *convex-admin-key=exited:0*convex-init=exited:0*) pass 'setup services exited 0' ;; *) fail "service states: $states" ;; esac
  check '.env.local is mode 600' [ "$(mode_of .env.local)" = 600 ]
  for service in convex-backend convex-dashboard; do
    case "$(docker inspect "$COMPOSE_PROJECT_NAME-$service-1" --format '{{.Config.Image}}')" in
      *@sha256:*) pass "$service runs a digest-pinned image" ;;
      *) fail "$service image is not digest-pinned" ;;
    esac
  done

  browser_tests localhost "$base" "$convex"

  check 'API sign-up' [ "$(sign_up "$base" qs@example.com QuickStart12345)" = 200 ]
  check 'API sign-in' [ "$(sign_in "$base" qs@example.com QuickStart12345 "$work/jar")" = 200 ]
  jwt=$(convex_token "$base" "$work/jar")
  check 'Convex token issued' [ -n "$jwt" ]
  for name in 'Plan A' 'Plan B'; do convex_call "$convex" mutation plans:createBlankPlan "{\"newPlanName\":\"$name\"}" "$jwt" > /dev/null; done
  plans_before=$(plan_names "$convex" "$jwt")
  check 'plans created through Convex' [ -n "$plans_before" ]

  section 'Security'
  auth_secret=$(sed -n 's/^BETTER_AUTH_SECRET="\(.*\)"$/\1/p' .env.local)
  api_secret=$(sed -n 's/^CONVEX_API_SECRET="\(.*\)"$/\1/p' .env.local)
  key=$(admin_key)
  check 'secrets and admin key readable for probing' sh -c '[ -n "$1" ] && [ -n "$2" ] && [ -n "$3" ]' _ "$auth_secret" "$api_secret" "$key"
  app_env=$(docker inspect "$COMPOSE_PROJECT_NAME-app-1" --format '{{range .Config.Env}}{{println .}}{{end}}')
  check 'app environment has no secrets or admin key' sh -c '! printf "%s" "$1" | grep -qF -e "$2" -e "$3" -e "$4"' _ "$app_env" "$auth_secret" "$api_secret" "$key"
  docker compose logs > "$artifacts/quickstart-compose.log" 2>&1
  check 'container logs have no secrets or admin key' sh -c '! grep -qF -e "$1" -e "$2" -e "$3" "$4" "$5"' _ "$auth_secret" "$api_secret" "$key" "$artifacts/quickstart-compose.log" "$artifacts/quickstart-init.log"
  for service in app convex-dashboard convex-backend; do
    check "$service does not mount the admin key volume" sh -c '! docker inspect "$1" --format "{{range .Mounts}}{{.Name}} {{end}}" | grep -q credentials' _ "$COMPOSE_PROJECT_NAME-$service-1"
  done
  key_file=$(docker compose run --rm --no-deps --entrypoint sh convex-init -c 'stat -c "%a %u" /run/ignidash/admin-key; touch /run/ignidash/x 2>/dev/null && echo writable || echo read-only' 2> /dev/null | tr '\n' ' ')
  check "admin key file is 600, uid 1001, read-only mount ($key_file)" [ "$key_file" = '600 1001 read-only ' ]
  for function in 'query migrations:getStatus' 'mutation migrations:runAll' 'mutation migrations:run' 'mutation migrations:migrateIncomeIdsToIncomeId'; do
    # shellcheck disable=SC2086 # split "kind name"
    set -- $function
    check "$2 is not publicly callable" sh -c 'convex_response=$(curl -s -H "Content-Type: application/json" --data "{\"path\":\"$2\",\"args\":{},\"format\":\"json\"}" "$3/api/$1"); printf "%s" "$convex_response" | grep -q "Could not find public function"' _ "$1" "$2" "$convex"
  done
  check 'setup image runs as uid 1001' [ "$(docker run --rm --entrypoint id "$init_image" -u)" = 1001 ]
  for image in "$init_image" "$app_image"; do
    check "no .env files in $image" sh -c '[ -z "$(docker run --rm --entrypoint sh "$1" -c "find / -xdev -name \".env*\" -not -path \"*/node_modules/*\" 2>/dev/null")" ]' _ "$image"
  done

  section 'Re-running setup'
  replace_line .env.local NEXT_PUBLIC_POSTHOG_KEY phc_e2e
  check 'docker compose up -d after editing .env.local' sh -c "docker compose up -d > '$artifacts/quickstart-reup.log' 2>&1"
  check 'stored admin key reused' sh -c 'docker compose logs convex-admin-key --no-log-prefix | grep -q "Reusing the stored"'
  check 'migrations reported as already done' sh -c 'docker compose logs convex-init --no-log-prefix | grep -q "Migration already done"'
  check 'PostHog key reaches the app' sh -c 'docker inspect "$1" --format "{{range .Config.Env}}{{println .}}{{end}}" | grep -qx NEXT_PUBLIC_POSTHOG_KEY=phc_e2e' _ "$COMPOSE_PROJECT_NAME-app-1"
  check 'selfhost.sh --sync-only' sh -c "sh scripts/selfhost.sh --sync-only > '$artifacts/quickstart-sync.log' 2>&1"
  check 'documented re-run command (docker compose run --rm convex-init)' sh -c "docker compose run --rm convex-init > '$artifacts/quickstart-rerun.log' 2>&1"
  wait_healthy "$base" > /dev/null
  check 'existing session still valid' [ -n "$(convex_token "$base" "$work/jar")" ]

  section 'Admin key recovery'
  docker compose run --rm --no-deps --entrypoint sh convex-admin-key -c 'rm /credentials/admin-key' > /dev/null 2>&1
  check 'deleted key is recreated automatically' sh -c 'docker compose up -d > /dev/null 2>&1 && docker compose logs convex-admin-key --no-log-prefix | grep -q "Stored the Convex admin credential"'
  docker compose run --rm --no-deps --entrypoint sh convex-admin-key -c 'printf "convex-self-hosted|%064d" 0 > /credentials/admin-key' > /dev/null 2>&1
  check 'wrong key fails with BadAdminKey' sh -c '! docker compose run --rm convex-init > "$1" 2>&1 && grep -q BadAdminKey "$1"' _ "$artifacts/quickstart-badkey.log"
  check 'documented FORCE_REGENERATE_ADMIN_KEY commands fix it' run_doc_block 'Credentials and Dashboard Access' 2 > "$artifacts/quickstart-regen.log" 2>&1
  wait_healthy "$base" > /dev/null

  section 'Backup and restore (commands from SELF_HOSTING.md)'
  check 'export' run_doc_block 'Export (recommended before every upgrade)' 1 2> "$artifacts/quickstart-export.err"
  zip_file=$(ls backups/ignidash-*.zip 2> /dev/null | head -n 1)
  check 'export is a valid zip' sh -c '[ -n "$1" ] && unzip -tq "$1" > /dev/null' _ "$zip_file"
  check 'export is mode 600' [ "$(mode_of "$zip_file")" = 600 ]
  check 'export contains plans and Better Auth data' sh -c 'unzip -l "$1" | grep -q plans/documents.jsonl && unzip -l "$1" | grep -q _components/betterAuth' _ "$zip_file"
  check 'export output does not show the admin key' sh -c '! grep -qF "$1" "$2"' _ "$(admin_key)" "$artifacts/quickstart-export.err"
  check 'volume archive' run_doc_block 'Volume archive (full disaster recovery)' 1 > "$artifacts/quickstart-archive.log" 2>&1
  archive=$(ls backups/ignidash-volumes-*.tar.gz 2> /dev/null | head -n 1)
  check 'archive holds both volumes and is mode 600' sh -c 'tar tzf "$1" | grep -qx credentials/admin-key && tar tzf "$1" | grep -q "^convex/data/" && [ "$2" = 600 ]' _ "$archive" "$(mode_of "$archive")"
  key_hash=$(admin_key | cksum)
  docker compose down -v > /dev/null 2>&1
  docker compose create > /dev/null 2>&1
  check 'volume restore onto a destroyed deployment' run_doc_block 'Volume archive (full disaster recovery)' 2 "s|backups/ignidash-volumes-YYYYMMDD-HHMMSS.tar.gz|$archive|" > "$artifacts/quickstart-restore.log" 2>&1
  check 'app healthy after volume restore' wait_healthy "$base"
  check 'admin key restored unchanged' [ "$(admin_key | cksum)" = "$key_hash" ]
  check 'session from before the backup still valid' [ -n "$(convex_token "$base" "$work/jar")" ]
  check 'plans intact after volume restore' [ "$(plan_names "$convex" "$(convex_token "$base" "$work/jar")")" = "$plans_before" ]
  docker compose down -v > /dev/null 2>&1
  check 'brand-new empty deployment' sh -c "docker compose up -d > /dev/null 2>&1" && wait_healthy "$base" > /dev/null
  check 'user absent before import' [ "$(sign_in "$base" qs@example.com QuickStart12345 "$work/jar2")" != 200 ]
  check 'import export into the new deployment' run_doc_block 'Export (recommended before every upgrade)' 2 "s|backups/ignidash-YYYYMMDD-HHMMSS.zip|$zip_file|" > "$artifacts/quickstart-import.log" 2>&1
  check 'user signs in after import' [ "$(sign_in "$base" qs@example.com QuickStart12345 "$work/jar2")" = 200 ]
  jwt=$(convex_token "$base" "$work/jar2")
  check 'plans intact after import' [ "$(plan_names "$convex" "$jwt")" = "$plans_before" ]
  convex_call "$convex" mutation plans:createBlankPlan '{"newPlanName":"Should Vanish"}' "$jwt" > /dev/null
  run_doc_block 'Export (recommended before every upgrade)' 2 "s|backups/ignidash-YYYYMMDD-HHMMSS.zip|$zip_file|" > /dev/null 2>&1
  check 'import --replace-all removes newer data' [ "$(plan_names "$convex" "$jwt")" = "$plans_before" ]

  section 'Failed setup keeps the app stopped'
  cp .env.local "$work/env.good"
  replace_line .env.local BETTER_AUTH_SECRET ''
  docker compose down > /dev/null 2>&1
  check 'docker compose up -d fails' sh -c '! docker compose up -d > /dev/null 2>&1'
  check 'convex-init names the missing secret' sh -c 'docker compose logs convex-init --no-log-prefix | grep -q "BETTER_AUTH_SECRET must be set"'
  check 'app is not started' sh -c '[ "$(docker compose ps -a --format "{{.Service}}={{.State}}" | grep "^app=")" = app=created ]'
  cat "$work/env.good" > .env.local
  check 'fixing .env.local recovers' sh -c "docker compose up -d > /dev/null 2>&1" && wait_healthy "$base" > /dev/null
  docker compose down -v > /dev/null 2>&1
}

scenario_manual() {
  section 'Manual Installation with LAN access and changed ports'
  use_project manual
  directory=$(new_checkout manual)
  cd "$directory" || return
  host_ip=${SELFHOST_E2E_HOST_IP:-$( (hostname -I 2> /dev/null || ipconfig getifaddr en0 2> /dev/null) | awk '{print $1}')}
  check "host LAN IP detected ($host_ip)" [ -n "$host_ip" ]
  # Block 1 starts with git clone + cd; this checkout stands in for the clone.
  check 'documented setup commands' run_doc_block 'Manual Installation' 1 '/^git clone/d;/^cd ignidash$/d'
  replace_line .env.local BETTER_AUTH_SECRET "\"$(run_doc_block 'Manual Installation' 2)\""
  replace_line .env.local CONVEX_API_SECRET "\"$(run_doc_block 'Manual Installation' 2)\""
  check 'documented secret command gives two different 44-character secrets' sh -c '[ "$1" != "$2" ] && [ ${#1} -eq 44 ]' _ \
    "$(sed -n 's/^BETTER_AUTH_SECRET="\(.*\)"$/\1/p' .env.local)" "$(sed -n 's/^CONVEX_API_SECRET="\(.*\)"$/\1/p' .env.local)"
  doc_block 'Changing Ports' yaml 2 > docker-compose.override.yml
  doc_block 'Changing Ports' dotenv 1 | sed "s/192\.168\.1\.100/$host_ip/" > "$work/ports.env"
  while IFS='=' read -r name value; do replace_line .env.local "$name" "$value"; done < "$work/ports.env"
  check 'documented port override and LAN URLs start' run_doc_block 'Manual Installation' 3 > "$artifacts/manual-up.log" 2>&1
  base="http://$host_ip:3001"
  check "app healthy at $base" wait_healthy "$base"
  check 'default port 3000 is free' sh -c '! curl -s -o /dev/null --max-time 3 http://127.0.0.1:3000'
  browser_tests lan-ports "$base" "http://$host_ip:3310"
  docker compose down -v > /dev/null 2>&1
}

scenario_proxy() {
  section 'HTTPS reverse proxy with a private CA'
  use_project proxy
  cd "$(new_checkout proxy)" || return
  check 'selfhost.sh --init with a domain' sh -c "printf '3\nlocaltest.me\n' | sh scripts/selfhost.sh --init > '$artifacts/proxy-init.log' 2>&1"
  cat > Caddyfile << 'EOF'
{
	local_certs
}
localtest.me {
	reverse_proxy app:3000
}
api.localtest.me {
	reverse_proxy convex-backend:3210
}
actions.localtest.me {
	reverse_proxy convex-backend:3211
}
EOF
  cat > proxy.yml << 'EOF'
services:
  proxy:
    image: caddy:2.8.4-alpine
    ports:
      - '443:443'
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
EOF
  export COMPOSE_FILE=docker-compose.yml:proxy.yml
  docker compose up -d > "$artifacts/proxy-up.log" 2>&1
  check 'app reachable through the proxy' wait_healthy https://localtest.me
  # The documented fix: CA bundle + override from the Reverse Proxy section.
  sleep 2
  docker compose exec -T convex-backend cat /etc/ssl/certs/ca-certificates.crt > ca-bundle.crt
  docker compose exec -T proxy cat /data/caddy/pki/authorities/local/root.crt >> ca-bundle.crt
  doc_block 'Reverse Proxy' yaml 1 | sed 's/actions\.example\.com/actions.localtest.me/' > docker-compose.override.yml
  export COMPOSE_FILE=docker-compose.yml:docker-compose.override.yml:proxy.yml
  check 'documented override applies' sh -c "docker compose up -d > '$artifacts/proxy-override.log' 2>&1"
  wait_healthy https://localtest.me > /dev/null
  browser_tests proxy https://localtest.me https://api.localtest.me
  docker compose logs convex-backend > "$artifacts/proxy-backend.log" 2>&1
  check 'backend reports no TLS verification errors' sh -c '! grep -q "failed to verify TLS" "$1"' _ "$artifacts/proxy-backend.log"
  docker compose down -v > /dev/null 2>&1
  unset COMPOSE_FILE
}

scenario_upgrade() {
  previous=$(git -C "$repository_root" describe --tags --abbrev=0 --match 'v*' HEAD^ 2> /dev/null)
  section "Upgrade from $previous"
  [ -n "$previous" ] || { fail 'no previous release tag (fetch tags first)'; return; }
  use_project upgrade
  directory="$work/checkouts/upgrade"
  mkdir -p "$directory"
  git -C "$repository_root" archive "$previous" | tar -x -C "$directory"
  cd "$directory" || return
  base=http://localhost:3000
  convex=http://localhost:3210
  version=${previous#v}
  # Run the released images of that version, whatever its compose file defaults to.
  sed "s|ghcr.io/schelskedevco/ignidash:stable|ghcr.io/schelskedevco/ignidash:$version|" docker-compose.yml > docker-compose.yml.tmp && mv docker-compose.yml.tmp docker-compose.yml
  if [ -f scripts/convex-init.sh ]; then
    check "install $previous (Docker-only flow)" sh -c "printf '1\n' | IGNIDASH_TAG='$version' sh scripts/selfhost.sh --init > '$artifacts/upgrade-old.log' 2>&1"
  else
    check "install $previous (npm flow)" sh -c "npm install --no-audit --no-fund > '$artifacts/upgrade-npm.log' 2>&1 && printf '1\n' | npm run selfhost -- --init > '$artifacts/upgrade-old.log' 2>&1"
  fi
  check "$previous app healthy" wait_healthy "$base"
  sign_up "$base" old@example.com OldUserPass123 > /dev/null
  sign_in "$base" old@example.com OldUserPass123 "$work/old-jar" > /dev/null
  jwt=$(convex_token "$base" "$work/old-jar")
  for name in 'Old Plan A' 'Old Plan B'; do convex_call "$convex" mutation plans:createBlankPlan "{\"newPlanName\":\"$name\"}" "$jwt" > /dev/null; done
  plans_before=$(plan_names "$convex" "$jwt")
  check "user and plans created on $previous" [ -n "$plans_before" ]

  # "git pull": replace tracked files with this version, keeping .env.local, .env, and volumes.
  git -C "$repository_root" ls-files -z docker-compose.yml .env.selfhost.example scripts | (cd "$repository_root" && xargs -0 tar -cf -) | tar -xf -
  check 'selfhost.sh warns about the old admin key and makes .env.local private' sh -c "sh scripts/selfhost.sh --sync-only > '$artifacts/upgrade-sync.log' 2>&1; grep -q 'still contains CONVEX_SELF_HOSTED_ADMIN_KEY' '$artifacts/upgrade-sync.log' || ! grep -q '^CONVEX_SELF_HOSTED_ADMIN_KEY=..*' .env.local"
  check '.env.local is mode 600 after upgrade' [ "$(mode_of .env.local)" = 600 ]
  check 'docker compose up -d upgrades' sh -c "docker compose up -d > '$artifacts/upgrade-up.log' 2>&1"
  check 'upgraded app healthy' wait_healthy "$base"
  check 'old user signs in' [ "$(sign_in "$base" old@example.com OldUserPass123 "$work/old-jar2")" = 200 ]
  check 'session from before the upgrade still valid' [ -n "$(convex_token "$base" "$work/old-jar")" ]
  check 'plans intact after upgrade' [ "$(plan_names "$convex" "$(convex_token "$base" "$work/old-jar")")" = "$plans_before" ]
  docker compose down -v > /dev/null 2>&1
}

# ----------------------------------------------------------------- main
scenarios=${*:-quickstart manual proxy upgrade}
for scenario in $scenarios; do
  case "$scenario" in
    # Each scenario runs in a subshell (own directory and environment); it reports
    # failure through its exit status.
    quickstart | manual | proxy | upgrade) (scenario_"$scenario" && [ "$failures" -eq 0 ]) || failures=$((failures + 1)) ;;
    *) echo "Unknown scenario: $scenario" >&2; exit 2 ;;
  esac
done

echo
if [ "$failures" -eq 0 ]; then
  echo 'All self-hosting end-to-end checks passed.'
else
  echo "Self-hosting end-to-end checks failed. Logs: $artifacts"
  exit 1
fi
