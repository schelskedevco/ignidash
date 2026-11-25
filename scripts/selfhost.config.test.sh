#!/bin/sh
# Checks the guarantees docker-compose.yml makes to self-hosters, without starting
# any containers. Needs docker (Compose v2.24.4+) and jq.
set -eu

repository_root=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT HUP INT TERM

fail() {
  echo "Test failed: $1" >&2
  exit 1
}

cp "$repository_root/docker-compose.yml" "$work/"
mkdir "$work/scripts"
cp "$repository_root/scripts/convex-admin-key.sh" "$work/scripts/"
cp "$repository_root/.env.selfhost.example" "$work/.env.local"
# Distinctive values so leaks are easy to spot.
for name in BETTER_AUTH_SECRET CONVEX_API_SECRET GOOGLE_CLIENT_SECRET OPENAI_API_KEY RESEND_API_KEY STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET; do
  sed "s|^$name=.*|$name=leak-check-$name|" "$work/.env.local" > "$work/.env.tmp" && mv "$work/.env.tmp" "$work/.env.local"
done
ln -s .env.local "$work/.env"

config() { # [extra compose files...] -> JSON
  files="-f $work/docker-compose.yml"
  for extra in "$@"; do files="$files -f $extra"; done
  # shellcheck disable=SC2086 # intentional word splitting of -f arguments
  (cd "$work" && env -u IGNIDASH_TAG -u COMPOSE_FILE -u COMPOSE_PROJECT_NAME docker compose -p config-test $files config --format json)
}
json=$(config)
query() { printf '%s' "$json" | jq -e "$@" > /dev/null; }

# The app receives only these variables; anything else (a secret, the admin key) is a leak.
query '.services.app.environment | keys - [
  "NODE_ENV", "SELF_HOSTED_CONVEX_URL", "SELF_HOSTED_CONVEX_SITE_URL", "SITE_URL",
  "NEXT_PUBLIC_CONVEX_URL", "NEXT_PUBLIC_CONVEX_SITE_URL",
  "NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST"] | length == 0' ||
  fail "app receives unexpected environment variables: $(printf '%s' "$json" | jq -c '.services.app.environment | keys')"
printf '%s' "$json" | jq -c '.services | del(."convex-init") | .. | strings' | grep -q leak-check &&
  fail 'a secret from .env.local reaches a service other than convex-init'
query '.services."convex-init".environment.BETTER_AUTH_SECRET == "leak-check-BETTER_AUTH_SECRET"' ||
  fail 'convex-init does not receive .env.local'

# Only the two setup services mount the admin key volume, and convex-init read-only.
query '[.services | to_entries[] | select(any(.value.volumes[]?; .source == "convex-credentials")) | .key] | sort == ["convex-admin-key", "convex-init"]' ||
  fail 'convex-credentials is mounted by a service other than convex-admin-key and convex-init'
query '.services."convex-init".volumes[] | select(.source == "convex-credentials") | .read_only == true' ||
  fail 'convex-init must mount convex-credentials read-only'
query '.services.app.volumes == null' || fail 'app must not mount volumes'

# Start order: backend healthy -> admin key -> init -> app; setup services run once.
query '.services."convex-init".depends_on."convex-admin-key".condition == "service_completed_successfully"' || fail 'convex-init must wait for convex-admin-key'
query '.services."convex-init".depends_on."convex-backend".condition == "service_healthy"' || fail 'convex-init must wait for a healthy backend'
query '.services.app.depends_on."convex-init".condition == "service_completed_successfully"' || fail 'app must start only after convex-init succeeds'
query '.services."convex-admin-key".restart == "no" and .services."convex-init".restart == "no"' || fail 'setup services must not restart'

# Images: IGNIDASH_TAG moves both Ignidash images together; Convex images are digest-pinned and consistent.
query '.services.app.image == "ghcr.io/schelskedevco/ignidash:stable" and .services."convex-init".image == "ghcr.io/schelskedevco/ignidash-convex-init:stable"' ||
  fail 'Ignidash images must default to the stable tag'
tagged=$(cd "$work" && IGNIDASH_TAG=9.9.9 docker compose -p config-test config --format json)
printf '%s' "$tagged" | jq -e '.services.app.image == "ghcr.io/schelskedevco/ignidash:9.9.9" and .services."convex-init".image == "ghcr.io/schelskedevco/ignidash-convex-init:9.9.9"' > /dev/null ||
  fail 'IGNIDASH_TAG must select the tag for both Ignidash images'
query '[.services."convex-backend".image, .services."convex-admin-key".image, .services."convex-dashboard".image] | all(test("@sha256:[0-9a-f]{64}$"))' ||
  fail 'Convex images must be pinned by digest'
query '.services."convex-backend".image == .services."convex-admin-key".image' || fail 'convex-admin-key must use the same backend image'

# Every docker-compose.override.yml example in SELF_HOSTING.md must be valid against this file.
awk -v dir="$work" '/^```yaml$/{n++; f=dir "/doc-override-" n ".yml"; inb=1; next} /^```/{inb=0; next} inb{print > f}' "$repository_root/SELF_HOSTING.md"
count=0
for override in "$work"/doc-override-*.yml; do
  [ -e "$override" ] || break
  count=$((count + 1))
  touch "$work/ca-bundle.crt"
  config "$override" > /dev/null 2> "$work/override.err" || fail "SELF_HOSTING.md override example $(basename "$override") is invalid: $(cat "$work/override.err")"
done
[ "$count" -ge 3 ] || fail "expected at least 3 override examples in SELF_HOSTING.md, found $count"
ports=$(config "$work/doc-override-3.yml" | jq -c '[.services.app.ports[].published, .services."convex-backend".ports[].published]')
[ "$ports" = '["3001","3310","3311"]' ] || fail "port override example must replace the default ports, got $ports"

echo 'Self-host configuration tests passed.'
