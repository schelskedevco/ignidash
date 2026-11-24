#!/bin/sh
set -eu

# Ignidash self-hosted setup helper.
# Everything runs in Docker: no Node.js, npm, or Convex CLI is needed on the host.
# The Convex admin key, environment sync, deploy, and migrations are handled by
# the one-shot convex-admin-key and convex-init services in docker-compose.yml.

show_help() {
  cat <<'EOF'
Usage: scripts/selfhost.sh [--init|--sync-only|--help]

  (no option)  Pull the latest images and start or upgrade the stack
  --init       First-time setup: create .env.local with generated secrets,
               then start the stack
  --sync-only  Re-sync .env.local to Convex, redeploy functions, and run
               migrations (runs the one-shot convex-init service)
  --help       Show this help
EOF
}

# Cross-platform in-place sed (BSD/macOS and GNU both accept -i with a suffix)
portable_sed() {
  sed -i.bak "$1" "$2"
  rm -f "$2.bak"
}

# Docker Compose reads .env for variable interpolation in docker-compose.yml.
# Keep all configuration in .env.local and point .env at it.
ensure_env_symlink() {
  ln -sf .env.local .env
}

# Read a single value from .env.local without sourcing it
env_value() {
  sed -n "s/^$1=//p" .env.local | tail -n 1 | sed -e 's/^"//' -e 's/"$//'
}

check_prerequisites() {
  if ! command -v docker >/dev/null 2>&1; then
    echo 'Error: Docker is not installed.' >&2
    exit 1
  fi

  if ! docker compose version >/dev/null 2>&1; then
    echo 'Error: Docker Compose v2 is not installed.' >&2
    exit 1
  fi
}

require_env_file() {
  if [ ! -f .env.local ]; then
    echo 'Error: .env.local not found.' >&2
    echo 'Run scripts/selfhost.sh --init to create one.' >&2
    exit 1
  fi
  ensure_env_symlink
}

setup_env_file() {
  if [ -f .env.local ]; then
    echo 'Warning: .env.local already exists.'
    printf 'Overwrite? (y/N): '
    read -r overwrite || overwrite=''
    if [ "$overwrite" != 'y' ] && [ "$overwrite" != 'Y' ]; then
      echo 'Keeping existing .env.local'
      ensure_env_symlink
      return
    fi
  fi

  if ! command -v openssl >/dev/null 2>&1; then
    echo 'Error: openssl is required to generate secrets.' >&2
    exit 1
  fi

  umask 077
  cp .env.selfhost.example .env.local
  chmod 600 .env.local

  echo 'How will you access Ignidash?'
  echo '  1) localhost (default)'
  echo '  2) LAN IP or hostname (e.g., 192.168.1.100)'
  echo '  3) Domain with reverse proxy (e.g., mydomain.com)'
  printf 'Choice [1]: '
  read -r access_choice || access_choice=''

  case "$access_choice" in
    2)
      printf 'IP or hostname: '
      read -r custom_host || custom_host=''
      if [ -z "$custom_host" ]; then
        echo 'Error: IP or hostname is required.' >&2
        exit 1
      fi
      echo "Configuring for host: $custom_host"
      portable_sed "s|^NEXT_PUBLIC_CONVEX_URL=.*|NEXT_PUBLIC_CONVEX_URL=http://$custom_host:3210|" .env.local
      portable_sed "s|^NEXT_PUBLIC_CONVEX_SITE_URL=.*|NEXT_PUBLIC_CONVEX_SITE_URL=http://$custom_host:3211|" .env.local
      portable_sed "s|^SITE_URL=.*|SITE_URL=http://$custom_host:3000|" .env.local
      ;;
    3)
      printf 'Domain (e.g., mydomain.com): '
      read -r custom_domain || custom_domain=''
      if [ -z "$custom_domain" ]; then
        echo 'Error: Domain is required.' >&2
        exit 1
      fi
      echo "Configuring for domain: $custom_domain"
      echo "  App:     https://$custom_domain"
      echo "  API:     https://api.$custom_domain"
      echo "  Actions: https://actions.$custom_domain"
      portable_sed "s|^NEXT_PUBLIC_CONVEX_URL=.*|NEXT_PUBLIC_CONVEX_URL=https://api.$custom_domain|" .env.local
      portable_sed "s|^NEXT_PUBLIC_CONVEX_SITE_URL=.*|NEXT_PUBLIC_CONVEX_SITE_URL=https://actions.$custom_domain|" .env.local
      portable_sed "s|^SITE_URL=.*|SITE_URL=https://$custom_domain|" .env.local
      ;;
    *)
      # localhost: the example defaults already apply
      ;;
  esac

  # base64 can contain / + =, so use | as the sed delimiter and quote the values
  better_auth_secret=$(openssl rand -base64 32)
  convex_api_secret=$(openssl rand -base64 32)
  portable_sed "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=\"$better_auth_secret\"|" .env.local
  portable_sed "s|^CONVEX_API_SECRET=.*|CONVEX_API_SECRET=\"$convex_api_secret\"|" .env.local

  ensure_env_symlink

  echo 'Created .env.local with generated secrets.'
  echo ''
}

print_next_steps() {
  app_url=$(env_value SITE_URL)
  app_url=${app_url:-http://localhost:3000}
  convex_url=$(env_value NEXT_PUBLIC_CONVEX_URL)
  convex_url=${convex_url:-http://localhost:3210}
  host=$(printf '%s' "$app_url" | sed -E 's|(https?://[^:/]+).*|\1|')

  # Port-based access (localhost or LAN) vs. reverse proxy (no port in the Convex URL)
  if printf '%s' "$convex_url" | grep -qE ':[0-9]+$'; then
    dashboard_url="$host:6791"
  else
    dashboard_url="https://dashboard.$(printf '%s' "$app_url" | sed -E 's|https?://||')"
  fi

  echo ''
  echo 'Ignidash is running.'
  echo ''
  echo "  App:              $app_url/signup"
  echo "  Convex Dashboard: $dashboard_url"
  echo ''
  echo 'To show the Convex Dashboard admin key:'
  echo "  docker compose run --rm --no-deps --entrypoint sh convex-init -c 'cat /run/ignidash/admin-key'"
  echo ''
  echo 'Next steps:'
  echo '  1. Edit .env.local to add optional keys (Google OAuth, Stripe, OpenAI, etc.)'
  echo '  2. Sync them to Convex: scripts/selfhost.sh --sync-only'
}

case "${1:-}" in
  --init)
    check_prerequisites
    setup_env_file
    docker compose up -d
    print_next_steps
    ;;
  --sync-only)
    check_prerequisites
    require_env_file
    docker compose run --rm convex-init
    ;;
  --help)
    show_help
    ;;
  '')
    check_prerequisites
    require_env_file
    docker compose pull
    docker compose up -d
    print_next_steps
    ;;
  *)
    echo "Error: unknown option: $1" >&2
    show_help >&2
    exit 1
    ;;
esac
