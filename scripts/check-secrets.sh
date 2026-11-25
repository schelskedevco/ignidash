#!/bin/sh
# Scans for secrets with gitleaks and .gitleaks.toml.
#
# Usage:
#   sh scripts/check-secrets.sh --staged     # staged changes (the pre-commit hook)
#   sh scripts/check-secrets.sh --history    # every commit in the repository (CI)
#   sh scripts/check-secrets.sh --dir PATH   # files in a directory, ignoring git
#
# Uses a local `gitleaks` binary if installed (brew install gitleaks), otherwise
# the pinned gitleaks Docker image. If neither is available, --staged only warns
# so that contributors without either can still commit; CI enforces the check.
set -eu

gitleaks_version=8.28.0
repository_root=$(git rev-parse --show-toplevel 2> /dev/null || pwd)
config="$repository_root/.gitleaks.toml"
mode=${1:-}

case "$mode" in
  --staged) arguments="git --pre-commit --staged" ; target=$repository_root ;;
  --history) arguments="git" ; target=$repository_root ;;
  --dir) arguments="dir" ; target=$(CDPATH='' cd -- "${2:?--dir needs a path}" && pwd) ;;
  *)
    echo "Usage: sh scripts/check-secrets.sh --staged | --history | --dir PATH" >&2
    exit 2
    ;;
esac

if command -v gitleaks > /dev/null 2>&1; then
  # shellcheck disable=SC2086 # intentional splitting of the subcommand and flags
  exec gitleaks $arguments --config "$config" --redact --no-banner "$target"
fi

if command -v docker > /dev/null 2>&1 && docker info > /dev/null 2>&1; then
  # shellcheck disable=SC2086 # intentional splitting of the subcommand and flags
  exec docker run --rm \
    -v "$target:/scan:ro" -v "$config:/config/.gitleaks.toml:ro" \
    -e GIT_CONFIG_COUNT=1 -e GIT_CONFIG_KEY_0=safe.directory -e GIT_CONFIG_VALUE_0=/scan \
    "ghcr.io/gitleaks/gitleaks:v$gitleaks_version" \
    $arguments --config /config/.gitleaks.toml --redact --no-banner /scan
fi

if [ "$mode" = --staged ]; then
  echo 'Warning: secret scan skipped (install gitleaks or start Docker). CI will still check.' >&2
  exit 0
fi
echo 'Error: secret scan needs gitleaks or a running Docker daemon.' >&2
exit 1
