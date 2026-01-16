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

    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi

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
            return
        fi
    fi

    cp .env.selfhost.example .env.local

    # Generate secrets
    BETTER_AUTH_SECRET=$(openssl rand -base64 32)
    CONVEX_API_SECRET=$(openssl rand -base64 32)

    # Update .env.local with generated secrets (macOS vs Linux sed)
    # Use | as delimiter since base64 can contain /
    # Wrap in quotes since base64 can contain =, /, +
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=\"$BETTER_AUTH_SECRET\"|" .env.local
        sed -i '' "s|^CONVEX_API_SECRET=.*|CONVEX_API_SECRET=\"$CONVEX_API_SECRET\"|" .env.local
    else
        sed -i "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=\"$BETTER_AUTH_SECRET\"|" .env.local
        sed -i "s|^CONVEX_API_SECRET=.*|CONVEX_API_SECRET=\"$CONVEX_API_SECRET\"|" .env.local
    fi

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
    echo -e "${GREEN}Setup complete!${NC}"
    echo ""
    echo "Access the application at: http://localhost:3000"
    echo "Convex Dashboard at: http://localhost:6791"
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
        set -a
        source .env.local
        set +a
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
