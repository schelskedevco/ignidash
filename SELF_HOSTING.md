# Self-Hosting Ignidash

Run your own instance of Ignidash. Choose the hosting option that best fits your needs:

| Option                                    | Best For                              | Infrastructure        |
| ----------------------------------------- | ------------------------------------- | --------------------- |
| [Docker Self-Hosted](#docker-self-hosted) | Full control, air-gapped environments | Your servers (Docker) |
| [Cloud Hosted](#cloud-hosted)             | Simpler setup, managed backend        | Convex Cloud + Vercel |

---

## Docker Self-Hosted

Run Ignidash entirely on your own infrastructure using Docker. This includes a self-hosted Convex backend.

### Convex Self-Hosting Documentation

- [Self-Hosting Overview](https://docs.convex.dev/self-hosting)
- [Develop & Deploy Guide](https://stack.convex.dev/self-hosted-develop-and-deploy)
- [GitHub: Self-Hosted README](https://github.com/get-convex/convex-backend/blob/main/self-hosted/README.md)
- [GitHub: Hosting on Own Infrastructure](https://github.com/get-convex/convex-backend/blob/main/self-hosted/advanced/hosting_on_own_infra.md)
- [GitHub: Upgrading](https://github.com/get-convex/convex-backend/blob/main/self-hosted/advanced/upgrading.md)

### Prerequisites

- Docker and Docker Compose
- Node.js 22+

### Quick Start

```bash
git clone https://github.com/schelskedevco/ignidash.git
cd ignidash
git checkout v0.1.0  # Always checkout a release tag
npm install
npm run selfhost -- --init
```

> **Important:** Always checkout a release tag before running `npm install`. This ensures your local Convex functions match the Docker image version. Using `main` may cause version mismatches.

The setup script will:

- Create `.env.local` from the template with generated secrets
- Start Docker containers (Convex backend, dashboard, and app)
- Generate and save the Convex admin key
- Sync environment variables to Convex
- Deploy Convex functions

Once complete:

- Application: http://localhost:3000
- Convex Dashboard: http://localhost:6791

### Docker Commands

```bash
npm run docker:build   # Build images
npm run docker:up      # Start services
npm run docker:down    # Stop services
npm run docker:logs    # View logs
```

### Upgrading

**Update the app:**

```bash
git fetch --tags
git checkout v0.2.0  # Checkout the new release tag
npm install
docker compose down
npm run selfhost
```

**Update Convex backend:**

```bash
docker compose down && docker compose pull && docker compose up -d
```

New versions may require database migrations - back up with `npx convex export` first. See [Convex Upgrading Guide](https://github.com/get-convex/convex-backend/blob/main/self-hosted/advanced/upgrading.md).

---

## Cloud Hosted

Run Ignidash using Convex Cloud for the backend and deploy the frontend to Vercel (or any Node.js host). This is simpler to set up and maintain.

### Prerequisites

- Node.js 22+
- [Convex account](https://dashboard.convex.dev) (free tier available)
- [Vercel account](https://vercel.com) (optional, for hosting)

### Convex Documentation

- [Next.js Quickstart](https://docs.convex.dev/quickstart/nextjs)
- [Production Guide](https://docs.convex.dev/production)
- [Hosting Options](https://docs.convex.dev/production/hosting)

### Setup

#### 1. Create Convex Project

1. Go to [dashboard.convex.dev](https://dashboard.convex.dev)
2. Create a new project
3. Note your project URL (e.g., `https://your-project-name.convex.cloud`)

#### 2. Configure Environment

```bash
cp .env.cloud.example .env.local
```

Fill in your Convex project details:

```bash
CONVEX_DEPLOYMENT=dev:your-project-name
NEXT_PUBLIC_CONVEX_URL=https://your-project-name.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://your-project-name.convex.site
```

Generate secrets:

```bash
openssl rand -base64 32  # For BETTER_AUTH_SECRET
openssl rand -base64 32  # For CONVEX_API_SECRET
```

#### 3. Run Locally or Deploy

**Local development:**

```bash
npm run dev          # Start Next.js app
npm run dev:convex   # Start Convex dev server (in another terminal)
```

This deploys your Convex functions and watches for changes.

**Deploy to Vercel:**

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add your environment variables in Vercel's project settings
4. Deploy

See [Convex hosting docs](https://docs.convex.dev/production/hosting) for detailed Vercel setup.

---

## Environment Variables

### Where Variables Are Used

| Location             | Purpose                      | Variables                        |
| -------------------- | ---------------------------- | -------------------------------- |
| `.env.local`         | Local dev, Convex CLI        | All variables                    |
| `npx convex env set` | Convex serverless functions  | SITE_URL, auth secrets, API keys |
| Docker build args    | Client-side (baked at build) | SELF*HOSTED, NEXT_PUBLIC*\*      |
| Docker runtime       | Server-side networking       | SELF*HOSTED*\*                   |

### Required Variables

| Variable                       | Description                                                 | Docker | Cloud |
| ------------------------------ | ----------------------------------------------------------- | ------ | ----- |
| `SELF_HOSTED`                  | Set to `true` for Docker builds (enables standalone output) | Yes    | No    |
| `CONVEX_SELF_HOSTED_URL`       | Convex backend URL (default: `http://127.0.0.1:3210`)       | Yes    | No    |
| `CONVEX_SELF_HOSTED_ADMIN_KEY` | Admin key for Convex CLI (generated)                        | Yes    | No    |
| `CONVEX_DEPLOYMENT`            | Convex Cloud deployment ID                                  | No     | Yes   |
| `NEXT_PUBLIC_CONVEX_URL`       | Public Convex URL (browser)                                 | Yes    | Yes   |
| `NEXT_PUBLIC_CONVEX_SITE_URL`  | Public Convex Site URL                                      | Yes    | Yes   |
| `SITE_URL`                     | Application URL                                             | Yes    | Yes   |
| `BETTER_AUTH_SECRET`           | Session encryption secret                                   | Yes    | Yes   |
| `CONVEX_API_SECRET`            | Internal API authentication                                 | Yes    | Yes   |

### Optional Variables

| Variable                                                        | Description                   |
| --------------------------------------------------------------- | ----------------------------- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                      | Google OAuth for social login |
| `OPENAI_API_KEY`, `OPENAI_ENDPOINT`                             | Azure OpenAI for AI features  |
| `RESEND_API_KEY`                                                | Email service                 |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` | Payments                      |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`                            | Client-side Stripe            |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`           | Analytics                     |

---

## Troubleshooting

### Docker: Services won't start

```bash
docker compose logs
```

Common issues: port conflicts (3000, 3210, 3211, 6791), insufficient memory.

### Docker: Can't connect to Convex

```bash
curl http://localhost:3210/version
```

### Docker: Missing environment variables in Convex

```bash
npx convex env list --url http://127.0.0.1:3210 --admin-key YOUR_KEY
```

Re-sync with:

```bash
npm run selfhost -- --sync-only
```

### Docker: "Failed to decrypt private key" error on login

If you see this error after changing `BETTER_AUTH_SECRET`:

```
BetterAuthError: Failed to decrypt private key. Make sure the secret currently in use is the same as the one used to encrypt the private key.
```

The JWKS (JSON Web Key Set) was encrypted with a previous secret. To fix:

1. Open Convex Dashboard at http://localhost:6791
2. Find the `betterAuth_jwks` table (in the Better Auth component tables)
3. Delete all rows in that table
4. Try logging in again - new keys will be generated automatically

### Cloud: Convex deployment issues

Check the [Convex status page](https://status.convex.dev) and your project dashboard at [dashboard.convex.dev](https://dashboard.convex.dev).
