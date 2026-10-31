#!/bin/sh
set -eu

echo 'Warning: scripts/selfhost.sh is deprecated and will be removed in a future release.' >&2
echo 'Use docker compose up -d for normal self-hosted deployments.' >&2

if ! command -v docker >/dev/null 2>&1; then
  echo 'Error: Docker is not installed.' >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo 'Error: Docker Compose is not installed.' >&2
  exit 1
fi

case "${1:-}" in
  --init)
    if [ ! -f .env.local ]; then
      umask 077
      cp .env.selfhost.example .env.local
      echo 'Created .env.local. Configure its required values, then run docker compose up -d.'
      exit 0
    fi
    echo '.env.local already exists; keeping it unchanged.'
    docker compose up -d --build
    ;;
  --sync-only)
    if [ ! -f .env.local ]; then
      echo 'Error: .env.local not found. Copy .env.selfhost.example and configure it first.' >&2
      exit 1
    fi
    docker compose run --rm convex-init
    ;;
  --help)
    cat <<'EOF'
Usage: scripts/selfhost.sh [--init|--sync-only|--help]

This compatibility wrapper now delegates initialization to Docker Compose.
  --init       Create .env.local when missing, or start the configured stack
  --sync-only  Run the one-shot Convex initializer
  --help       Show this help
EOF
    ;;
  '')
    if [ ! -f .env.local ]; then
      echo 'Error: .env.local not found. Copy .env.selfhost.example and configure it first.' >&2
      exit 1
    fi
    docker compose up -d --build
    ;;
  *)
    echo "Error: unknown option: $1" >&2
    exit 1
    ;;
esac
