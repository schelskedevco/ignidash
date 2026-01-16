# Self-Hosting Ignidash

This guide explains how to self-host Ignidash on your own infrastructure using Docker.

## Prerequisites

- **Docker** and **Docker Compose** installed
- **Node.js 22+** (for deploying Convex functions)
- **4GB RAM minimum** (recommended for running all services)
- A domain or local environment for testing

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/ignidash.git
cd ignidash
```

### 2. Configure Environment Variables

```bash
cp .env.self-hosted.example .env
```

Edit `.env` and set the required values:

```bash
# Generate secrets (run these commands and paste the output)
openssl rand -base64 32  # For BETTER_AUTH_SECRET
openssl rand -base64 32  # For CONVEX_API_SECRET
```

### 3. Start the Services

```bash
docker compose up -d
```

This starts three services:

- **Convex Backend** - Database and serverless functions
- **Convex Dashboard** - Admin interface for Convex
- **Ignidash App** - The Next.js application

### 4. Generate Convex Admin Key

```bash
docker compose exec convex-backend ./generate_admin_key.sh
```

Copy the generated key and add it to your `.env` file:

```bash
CONVEX_SELF_HOSTED_ADMIN_KEY=<your-generated-key>
```

### 5. Set Convex Environment Variables

Convex functions run on the Convex backend and need their own environment variables (separate from the Next.js app). Set the required variables:

```bash
# Required for AI features (skip if not using AI)
npx convex env set OPENAI_API_KEY "your-azure-api-key"
npx convex env set OPENAI_ENDPOINT "https://your-resource.openai.azure.com/"

# Required for analytics (skip if not using PostHog)
npx convex env set NEXT_PUBLIC_POSTHOG_KEY "your-posthog-key"
npx convex env set NEXT_PUBLIC_POSTHOG_HOST "https://us.i.posthog.com"
```

### 6. Deploy Convex Functions

```bash
npm install convex@latest
npx convex deploy --url $CONVEX_SELF_HOSTED_URL --admin-key $CONVEX_SELF_HOSTED_ADMIN_KEY
```

### 7. Access the Application

- **Application**: http://localhost:3000
- **Convex Dashboard**: http://localhost:6791
- **Convex Backend API**: http://localhost:3210

## Environment Variables

### Required Variables

| Variable                       | Description                                                   |
| ------------------------------ | ------------------------------------------------------------- |
| `CONVEX_SELF_HOSTED_URL`       | URL of your Convex backend (default: `http://127.0.0.1:3210`) |
| `CONVEX_SELF_HOSTED_ADMIN_KEY` | Admin key for Convex CLI (generated in step 4)                |
| `NEXT_PUBLIC_CONVEX_URL`       | Public URL for Convex (what browsers connect to)              |
| `NEXT_PUBLIC_CONVEX_SITE_URL`  | Public URL for Convex HTTP actions                            |
| `SITE_URL`                     | Your application's public URL                                 |
| `BETTER_AUTH_SECRET`           | Secret for session encryption (32+ random characters)         |
| `CONVEX_API_SECRET`            | Secret for internal API authentication                        |

### Optional Variables

#### Google OAuth (Social Login)

```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

To set up Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new OAuth 2.0 Client ID
3. Set authorized redirect URI to: `{SITE_URL}/api/auth/callback/google`

#### AI Features (Azure OpenAI)

```bash
OPENAI_API_KEY=your-azure-api-key
OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
```

Required for AI chat and insights features. You'll need:

1. An Azure OpenAI resource
2. Two model deployments:
   - `gpt-5.2-chat` (for chat)
   - `gpt-5.2` (for insights)

**Note**: If not configured, AI features will be hidden from the UI.

#### Email (Resend)

```bash
RESEND_API_KEY=re_xxxxx
```

Required for password reset and notification emails. Get your API key at [resend.com](https://resend.com).

#### Payments (Stripe)

```bash
STRIPE_SECRET_KEY=sk_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID=price_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxxxx
```

Required for subscription features. Set up at [stripe.com](https://stripe.com).

#### Analytics (PostHog)

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Optional analytics. You can use PostHog Cloud or self-host PostHog.

**Note**: If not configured, analytics will be disabled silently.

## Docker Commands

```bash
# Build images
npm run docker:build

# Start services (detached)
npm run docker:up

# Stop services
npm run docker:down

# View logs
npm run docker:logs

# View specific service logs
docker compose logs -f app
docker compose logs -f convex-backend
```

## Production Deployment

For production deployments, consider:

### 1. Use a Reverse Proxy

Add nginx or Traefik in front of the services for:

- SSL termination
- Rate limiting
- Request filtering

Example nginx configuration:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Configure Persistent Storage

The Convex backend stores data in a Docker volume. For production:

- Back up the `convex-data` volume regularly
- Consider using external database storage (PostgreSQL/MySQL) - see [Convex docs](https://github.com/get-convex/convex-backend)

### 3. Update Environment URLs

Update `SITE_URL` and Convex URLs to your production domain:

```bash
SITE_URL=https://your-domain.com
NEXT_PUBLIC_CONVEX_URL=https://convex.your-domain.com
NEXT_PUBLIC_CONVEX_SITE_URL=https://convex-site.your-domain.com
```

### 4. Configure Stripe Webhooks

For production Stripe integration:

1. Set up a webhook endpoint at `{SITE_URL}/api/auth/webhook/stripe`
2. Update `STRIPE_WEBHOOK_SECRET` with your production webhook secret

## Troubleshooting

### Services won't start

Check logs for errors:

```bash
docker compose logs
```

Common issues:

- Port conflicts (3000, 3210, 3211, 6791)
- Insufficient memory
- Missing environment variables

### Can't connect to Convex

1. Verify the backend is running:

   ```bash
   curl http://localhost:3210/version
   ```

2. Check that URLs match between services:
   - App uses `http://convex-backend:3210` internally
   - Browser uses `http://localhost:3210`

### Authentication not working

1. Verify `BETTER_AUTH_SECRET` is set
2. Check `SITE_URL` matches your actual URL
3. For Google OAuth, verify redirect URIs are correct

### AI features not showing

AI features require both `OPENAI_API_KEY` and `OPENAI_ENDPOINT` to be set. If either is missing, AI features are hidden from the UI.

### Convex functions not deploying

1. Ensure you have the latest Convex CLI:

   ```bash
   npm install convex@latest
   ```

2. Verify admin key is correct:

   ```bash
   npx convex deploy --url http://127.0.0.1:3210 --admin-key YOUR_KEY
   ```

3. **"OPENAI_API_KEY environment variable is not set" error**: Convex functions need environment variables set separately from your `.env.local` file. Use `npx convex env set`:

   ```bash
   npx convex env set OPENAI_API_KEY "your-key"
   npx convex env set OPENAI_ENDPOINT "your-endpoint"
   ```

4. View current Convex environment variables:

   ```bash
   npx convex env list
   ```

5. **"Invalid provider domain URL: empty host" error**: This occurs when the Convex backend doesn't know its public URL. The docker-compose.yml includes the necessary environment variables (`CONVEX_CLOUD_ORIGIN` and `CONVEX_SITE_ORIGIN`). If you changed ports or are deploying to a different host:
   - Restart the Convex backend after making changes: `docker compose restart convex-backend`
   - For production, update these values in docker-compose.yml to your actual URLs

## Updating

To update to a newer version:

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose down
docker compose build
docker compose up -d

# Redeploy Convex functions
npx convex deploy --url $CONVEX_SELF_HOSTED_URL --admin-key $CONVEX_SELF_HOSTED_ADMIN_KEY
```

## Support

- [GitHub Issues](https://github.com/your-org/ignidash/issues) - Report bugs
- [Convex Discord](https://discord.gg/convex) - Convex self-hosting help (in `#self-hosted` channel)
