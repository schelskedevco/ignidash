#!/bin/bash
set -e

# Ignidash Self-Hosted Setup Script
# This script automates the setup process for self-hosting Ignidash with Docker.

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "Ignidash Self-Hosted Setup"
echo "=========================="
echo ""

# Cross-platform sed -i (macOS requires '' argument, Linux does not)
portable_sed() {
    local pattern="$1"
    local file="$2"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "$pattern" "$file"
    else
        sed -i "$pattern" "$file"
    fi
}

# Ensure .env symlink exists so Docker Compose picks up variables automatically
ensure_env_symlink() {
    ln -sf .env.local .env
}

# Check prerequisites
check_prerequisites() {
    echo "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker is not installed${NC}"
        exit 1
    fi

    if ! docker compose version &> /dev/null; then
        echo -e "${RED}Error: Docker Compose is not installed${NC}"
        exit 1
    fi

    if ! command -v node &> /dev/null; then
        echo -e "${RED}Error: Node.js is not installed${NC}"
        exit 1
    fi

    if ! command -v npx &> /dev/null; then
        echo -e "${RED}Error: npx is not available${NC}"
        exit 1
    fi

    echo "Installing dependencies..."
    npm install

    echo -e "${GREEN}All prerequisites met${NC}"
    echo ""
}

# Create .env.local from template
setup_env_file() {
    if [ -f ".env.local" ]; then
        echo -e "${YELLOW}Warning: .env.local already exists${NC}"
        read -p "Overwrite? (y/N): " overwrite
        if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
            echo "Keeping existing .env.local"
            ensure_env_symlink
            return
        fi
    fi

    cp .env.selfhost.example .env.local

    # Prompt for access method
    echo "How will you access Ignidash?"
    echo "  1) localhost (default)"
    echo "  2) LAN IP or hostname (e.g., 192.168.1.100)"
    echo "  3) Domain with reverse proxy (e.g., mydomain.com)"
    read -p "Choice [1]: " ACCESS_CHOICE

    case "$ACCESS_CHOICE" in
        2)
            read -p "IP or hostname: " CUSTOM_HOST
            if [ -z "$CUSTOM_HOST" ]; then
                echo -e "${RED}Error: IP or hostname is required${NC}"
                exit 1
            fi
            echo "Configuring for host: $CUSTOM_HOST"
            portable_sed "s|^NEXT_PUBLIC_CONVEX_URL=.*|NEXT_PUBLIC_CONVEX_URL=http://$CUSTOM_HOST:3210|" .env.local
            portable_sed "s|^NEXT_PUBLIC_CONVEX_SITE_URL=.*|NEXT_PUBLIC_CONVEX_SITE_URL=http://$CUSTOM_HOST:3211|" .env.local
            portable_sed "s|^SITE_URL=.*|SITE_URL=http://$CUSTOM_HOST:3000|" .env.local
            ;;
        3)
            read -p "Domain (e.g., mydomain.com): " CUSTOM_DOMAIN
            if [ -z "$CUSTOM_DOMAIN" ]; then
                echo -e "${RED}Error: Domain is required${NC}"
                exit 1
            fi
            echo "Configuring for domain: $CUSTOM_DOMAIN"
            echo "  App:     https://$CUSTOM_DOMAIN"
            echo "  API:     https://api.$CUSTOM_DOMAIN"
            echo "  Actions: https://actions.$CUSTOM_DOMAIN"
            portable_sed "s|^NEXT_PUBLIC_CONVEX_URL=.*|NEXT_PUBLIC_CONVEX_URL=https://api.$CUSTOM_DOMAIN|" .env.local
            portable_sed "s|^NEXT_PUBLIC_CONVEX_SITE_URL=.*|NEXT_PUBLIC_CONVEX_SITE_URL=https://actions.$CUSTOM_DOMAIN|" .env.local
            portable_sed "s|^SITE_URL=.*|SITE_URL=https://$CUSTOM_DOMAIN|" .env.local
            ;;
        *)
            # Default: localhost, no changes needed
            ;;
    esac

    # Generate secrets
    BETTER_AUTH_SECRET=$(openssl rand -base64 32)
    CONVEX_API_SECRET=$(openssl rand -base64 32)

    # Update .env.local with generated secrets
    # Use | as delimiter since base64 can contain /
    # Wrap in quotes since base64 can contain =, /, +
    portable_sed "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=\"$BETTER_AUTH_SECRET\"|" .env.local
    portable_sed "s|^CONVEX_API_SECRET=.*|CONVEX_API_SECRET=\"$CONVEX_API_SECRET\"|" .env.local

    ensure_env_symlink

    echo -e "${GREEN}Created .env.local with generated secrets${NC}"
    echo ""
}

# Build and start Docker containers
build_and_start_containers() {
    echo "Building and starting Docker containers..."
    docker compose up -d --build

    echo "Waiting for Convex backend to be healthy..."
    local max_attempts=30
    local attempt=0

    until docker compose exec -T convex-backend curl -s -f http://localhost:3210/version > /dev/null 2>&1; do
        attempt=$((attempt + 1))
        if [ $attempt -ge $max_attempts ]; then
            echo -e "${RED}Error: Convex backend failed to start${NC}"
            echo "Check logs with: docker compose logs convex-backend"
            exit 1
        fi
        sleep 2
    done

    echo -e "${GREEN}Containers started successfully${NC}"
    echo ""
}

# Generate and save Convex admin key
setup_convex_admin_key() {
    echo "Generating Convex admin key..."
    ADMIN_KEY=$(docker compose exec -T convex-backend ./generate_admin_key.sh 2>/dev/null | grep -v "^$" | tail -1)

    if [ -z "$ADMIN_KEY" ]; then
        echo -e "${RED}Error: Failed to generate admin key${NC}"
        exit 1
    fi

    # Use awk to safely replace the admin key (handles any special characters)
    awk -v key="$ADMIN_KEY" '/^CONVEX_SELF_HOSTED_ADMIN_KEY=/{$0="CONVEX_SELF_HOSTED_ADMIN_KEY=\""key"\""}1' .env.local > .env.local.tmp && mv .env.local.tmp .env.local

    echo -e "${GREEN}Convex admin key saved to .env.local${NC}"
    echo ""
}

# Sync environment variables to Convex
sync_convex_env() {
    echo "Syncing environment variables to Convex..."

    # Source the .env.local file
    set -a
    source .env.local
    set +a

    # Verify we have the required Convex credentials
    if [ -z "$CONVEX_SELF_HOSTED_URL" ] || [ -z "$CONVEX_SELF_HOSTED_ADMIN_KEY" ]; then
        echo -e "${RED}Error: CONVEX_SELF_HOSTED_URL and CONVEX_SELF_HOSTED_ADMIN_KEY must be set${NC}"
        exit 1
    fi

    # List of vars to sync to Convex (only set if they have values)
    CONVEX_VARS=(
        "SELF_HOSTED"
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

    local synced=0
    local skipped=0

    for var in "${CONVEX_VARS[@]}"; do
        value="${!var}"
        if [ -n "$value" ]; then
            echo "  Setting $var..."
            if npx convex env set "$var" "$value" \
                --url "$CONVEX_SELF_HOSTED_URL" \
                --admin-key "$CONVEX_SELF_HOSTED_ADMIN_KEY" \
                2>/dev/null; then
                synced=$((synced + 1))
            else
                echo -e "    ${YELLOW}Warning: Failed to set $var${NC}"
            fi
        else
            skipped=$((skipped + 1))
        fi
    done

    echo -e "${GREEN}Synced $synced environment variables ($skipped skipped - not set)${NC}"
    echo ""
}

# Deploy Convex functions
deploy_convex() {
    echo "Deploying Convex functions..."

    # Source the .env.local file
    set -a
    source .env.local
    set +a

    npx convex deploy \
        --url "$CONVEX_SELF_HOSTED_URL" \
        --admin-key "$CONVEX_SELF_HOSTED_ADMIN_KEY"

    echo -e "${GREEN}Convex functions deployed${NC}"
    echo ""
}

# Print next steps
print_next_steps() {
    # Source .env.local to get the credentials
    set -a
    source .env.local
    set +a

    local APP_URL="${SITE_URL:-http://localhost:3000}"
    local CONVEX_URL="${NEXT_PUBLIC_CONVEX_URL:-http://localhost:3210}"
    local HOST
    HOST=$(echo "$APP_URL" | sed -E 's|(https?://[^:/]+).*|\1|')

    # Determine dashboard URL based on whether we're using a reverse proxy (no port in CONVEX_URL)
    local DASHBOARD_URL
    if echo "$CONVEX_URL" | grep -qE ':[0-9]+$'; then
        # Port-based access (localhost or LAN IP)
        DASHBOARD_URL="$HOST:6791"
    else
        # Reverse proxy — derive dashboard subdomain from app domain
        local DOMAIN
        DOMAIN=$(echo "$APP_URL" | sed -E 's|https?://||')
        DASHBOARD_URL="https://dashboard.$DOMAIN"
    fi

    echo -e "${GREEN}Setup complete!${NC}"
    echo ""
    echo "Access the application at: $APP_URL/signup"
    echo "Convex Dashboard at: $DASHBOARD_URL"
    echo ""
    echo "Convex Dashboard credentials:"
    echo "  Deployment URL: $CONVEX_SELF_HOSTED_URL"
    echo "  Admin Key: $CONVEX_SELF_HOSTED_ADMIN_KEY"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env.local to add your API keys (Google OAuth, Stripe, OpenAI, etc.)"
    echo "2. Re-run sync to push new keys to Convex:"
    echo "   npm run selfhost -- --sync-only"
    echo ""
}

# Help text
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --init         First-time setup: create .env.local from template"
    echo "  --sync-only    Only sync environment variables to Convex (skip setup)"
    echo "  --help         Show this help message"
    echo ""
}

# Check that .env.local exists
require_env_file() {
    if [ ! -f ".env.local" ]; then
        echo -e "${RED}Error: .env.local not found${NC}"
        echo "Run with --init to create a new .env.local from template"
        exit 1
    fi
    ensure_env_symlink
}

# Main (default - requires existing .env.local)
main() {
    check_prerequisites
    require_env_file
    build_and_start_containers
    setup_convex_admin_key
    sync_convex_env
    deploy_convex
    print_next_steps
}

# Main with --init flag (creates new .env.local)
main_init() {
    check_prerequisites
    setup_env_file
    build_and_start_containers
    setup_convex_admin_key
    sync_convex_env
    deploy_convex
    print_next_steps
}

# Handle flags
case "$1" in
    --init)
        main_init
        ;;
    --sync-only)
        require_env_file
        set -a
        source .env.local
        set +a
        if ! curl -sf http://127.0.0.1:3210 > /dev/null 2>&1; then
            echo -e "${RED}Error: Convex backend is not reachable at http://127.0.0.1:3210${NC}"
            exit 1
        fi
        sync_convex_env
        exit 0
        ;;
    --help)
        show_help
        exit 0
        ;;
    "")
        main
        ;;
    *)
        echo -e "${RED}Unknown option: $1${NC}"
        show_help
        exit 1
        ;;
esac
