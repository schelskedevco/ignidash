#!/bin/sh
# Tests .gitleaks.toml and scripts/check-secrets.sh: freshly generated fake secrets
# must be caught when staged, and known look-alikes must not be.
# Needs gitleaks or Docker, plus git and openssl.
set -eu

repository_root=$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT HUP INT TERM

fail() {
  echo "Test failed: $1" >&2
  exit 1
}

new_repository() {
  directory=$(mktemp -d "$work/repository.XXXXXX")
  git -C "$directory" init -q
  cp "$repository_root/.gitleaks.toml" "$directory/"
  mkdir "$directory/scripts"
  cp "$repository_root/scripts/check-secrets.sh" "$directory/scripts/"
  printf '%s' "$directory"
}

scan_staged() { # repository file content -> exit status of the pre-commit scan
  printf '%s\n' "$3" > "$1/$2"
  git -C "$1" add "$2"
  (cd "$1" && sh scripts/check-secrets.sh --staged > "$work/scan.log" 2>&1)
}

hex() { openssl rand -hex "$1" | cut -c "1-$2"; }

# Each of these must block the commit.
admin_key="convex-self-hosted|$(hex 37 74)"
deploy_key="prod:happy-otter-123|$(openssl rand -base64 48 | tr -d '\n/+=')"
auth_secret=$(openssl rand -base64 32)
stripe_key="sk_live_$(openssl rand -hex 24)"

for case in \
  "admin-key.txt|$admin_key" \
  "deploy.sh|export CONVEX_DEPLOY_KEY='$deploy_key'" \
  "deploy-key-in-docs.md|Use \`$deploy_key\` to deploy." \
  "settings.env|BETTER_AUTH_SECRET=\"$auth_secret\"" \
  "config.ts|const config = { CONVEX_API_SECRET: '$auth_secret' };" \
  "stripe.env|STRIPE_SECRET_KEY=$stripe_key"; do
  repository=$(new_repository)
  if scan_staged "$repository" "${case%%|*}" "${case#*|}"; then
    fail "secret in ${case%%|*} was not caught"
  fi
  grep -qF "${case#*|}" "$work/scan.log" && fail "scan output printed the secret from ${case%%|*}"
done

# None of these may block a commit.
for case in \
  "env.example|$(cat "$repository_root/.env.selfhost.example")" \
  "empty-then-next.env|STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_PLACEHOLDER_VALUE=" \
  "test.sh|BETTER_AUTH_SECRET=\"\$auth_secret\" CONVEX_API_SECRET=too-short" \
  "legacy.sh|CONVEX_SELF_HOSTED_ADMIN_KEY=\"convex-self-hosted|legacy\"" \
  "docs.md|Delete the CONVEX_SELF_HOSTED_ADMIN_KEY line from .env.local."; do
  repository=$(new_repository)
  scan_staged "$repository" "${case%%|*}" "${case#*|}" || fail "false positive in ${case%%|*}: $(tail -n 5 "$work/scan.log")"
done

# Without gitleaks or Docker, the hook warns instead of blocking; history scans fail.
repository=$(new_repository)
printf 'nothing secret\n' > "$repository/plain.txt"
git -C "$repository" add plain.txt
tool_path="$work/no-scanner-path"
mkdir "$tool_path"
for tool in sh git cat; do ln -s "$(command -v "$tool")" "$tool_path/$tool"; done
(cd "$repository" && PATH="$tool_path" sh scripts/check-secrets.sh --staged > "$work/fallback.log" 2>&1) ||
  fail 'the hook must not block commits when no scanner is available'
grep -q 'secret scan skipped' "$work/fallback.log" || fail 'the hook must warn when no scanner is available'
if (cd "$repository" && PATH="$tool_path" sh scripts/check-secrets.sh --history > /dev/null 2>&1); then
  fail 'a history scan must fail when no scanner is available'
fi

echo 'Secret scanning tests passed.'
