# Self-Hosting Ignidash

Run Ignidash on your own infrastructure using Docker.

## Prerequisites

- Docker and Docker Compose
- Node.js 22+
- 4GB RAM minimum

## Quick Start

```bash
git clone https://github.com/your-org/ignidash.git
cd ignidash
npm install
npm run selfhost
```

The setup script will:

- Create `.env.local` from the template with generated secrets
- Start Docker containers (Convex backend, dashboard, and app)
- Generate and save the Convex admin key
- Sync environment variables to Convex
- Deploy Convex functions

Once complete:

- Application: http://localhost:3000
- Convex Dashboard: http://localhost:6791

## Manual Setup

If you prefer to set things up manually:

### 1. Create Environment File

```bash
cp .env.example .env.local
```

Generate and add secrets to `.env.local`:

```bash
openssl rand -base64 32  # For BETTER_AUTH_SECRET
openssl rand -base64 32  # For CONVEX_API_SECRET
```

### 2. Start Docker Containers

```bash
npm run docker:up
```

### 3. Generate Convex Admin Key

```bash
docker compose exec convex-backend ./generate_admin_key.sh
```

Add the generated key to `.env.local` as `CONVEX_SELF_HOSTED_ADMIN_KEY`.

### 4. Sync Environment Variables to Convex

Convex serverless functions need their own environment variables (separate from `.env.local`). Sync them:

```bash
npm run selfhost -- --sync-only
```

Or set them manually:

```bash
npx convex env set SITE_URL "http://localhost:3000" --url http://127.0.0.1:3210 --admin-key YOUR_KEY
npx convex env set BETTER_AUTH_SECRET "your-secret" --url http://127.0.0.1:3210 --admin-key YOUR_KEY
# ... repeat for other variables
```

### 5. Deploy Convex Functions

```bash
npx convex deploy --url $CONVEX_SELF_HOSTED_URL --admin-key $CONVEX_SELF_HOSTED_ADMIN_KEY
```

## Environment Variables

### Where Variables Are Used

| Location             | Purpose                      | Variables                        |
| -------------------- | ---------------------------- | -------------------------------- |
| `.env.local`         | Local dev, Convex CLI        | All variables                    |
| `npx convex env set` | Convex serverless functions  | SITE_URL, auth secrets, API keys |
| Docker build args    | Client-side (baked at build) | SELF*HOSTED, NEXT_PUBLIC*\*      |
| Docker runtime       | Server-side networking       | SELF*HOSTED*\*                   |

### Required Variables

| Variable                       | Description                                                 |
| ------------------------------ | ----------------------------------------------------------- |
| `SELF_HOSTED`                  | Set to `true` for Docker builds (enables standalone output) |
| `CONVEX_SELF_HOSTED_URL`       | Convex backend URL (default: `http://127.0.0.1:3210`)       |
| `CONVEX_SELF_HOSTED_ADMIN_KEY` | Admin key for Convex CLI (generated)                        |
| `SITE_URL`                     | Application URL                                             |
| `BETTER_AUTH_SECRET`           | Session encryption secret                                   |
| `CONVEX_API_SECRET`            | Internal API authentication                                 |

### Optional Variables

| Variable                                                        | Description                   |
| --------------------------------------------------------------- | ----------------------------- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                      | Google OAuth for social login |
| `OPENAI_API_KEY`, `OPENAI_ENDPOINT`                             | Azure OpenAI for AI features  |
| `RESEND_API_KEY`                                                | Email service                 |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` | Payments                      |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`                            | Client-side Stripe            |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`           | Analytics                     |

## Docker Commands

```bash
npm run docker:build   # Build images
npm run docker:up      # Start services
npm run docker:down    # Stop services
npm run docker:logs    # View logs
```

## Troubleshooting

### Services won't start

```bash
docker compose logs
```

Common issues: port conflicts (3000, 3210, 3211, 6791), insufficient memory.

### Can't connect to Convex

```bash
curl http://localhost:3210/version
```

### Missing environment variables in Convex

```bash
npx convex env list --url http://127.0.0.1:3210 --admin-key YOUR_KEY
```

Re-sync with:

```bash
npm run selfhost -- --sync-only
```

## Updating

```bash
git pull
docker compose down
docker compose build
docker compose up -d
npx convex deploy --url $CONVEX_SELF_HOSTED_URL --admin-key $CONVEX_SELF_HOSTED_ADMIN_KEY
```
