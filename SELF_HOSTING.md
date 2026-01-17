# Self-Hosting Ignidash

Run Ignidash entirely on your own infrastructure using Docker. This includes a self-hosted Convex backend.

## Prerequisites

- Docker and Docker Compose
- Node.js 22+ (for initial setup only)

## Quick Start

```bash
git clone https://github.com/schelskedevco/ignidash.git
cd ignidash
npm run selfhost -- --init
```

The setup script will:

1. Create `.env.local` from the template with generated secrets (only with `--init`)
2. Start Docker containers (Convex backend, dashboard, and app)
3. Generate and save the Convex admin key
4. Sync environment variables to Convex
5. Deploy Convex functions

Once complete, the script will display:

- **Application:** http://localhost:3000
- **Convex Dashboard:** http://localhost:6791
- **Dashboard credentials** (Deployment URL and Admin Key for logging into the Convex Dashboard)

## Docker Images

| Tag      | Description                                        |
| -------- | -------------------------------------------------- |
| `stable` | Latest tagged release (recommended for production) |
| `latest` | Latest commit to main branch                       |
| `vX.Y.Z` | Specific version                                   |

The default `docker-compose.yml` uses `stable`.

## Commands

| Command                           | Description                                      |
| --------------------------------- | ------------------------------------------------ |
| `npm run selfhost -- --init`      | First-time setup                                 |
| `npm run selfhost`                | Rebuild and restart (uses existing `.env.local`) |
| `npm run selfhost -- --sync-only` | Sync env vars to Convex without restart          |
| `npm run selfhost:convex-dev`     | Hot reload for Convex functions in development   |
| `npm run selfhost:convex-deploy`  | Deploy Convex functions to self-hosted backend   |
| `npm run docker:build`            | Build images                                     |
| `npm run docker:up`               | Start services                                   |
| `npm run docker:down`             | Stop services                                    |
| `npm run docker:logs`             | View logs                                        |

## Upgrading

```bash
git pull
docker compose pull
npm run selfhost
```

Back up with `npx convex export` before upgrading. See [Convex Upgrading Guide](https://github.com/get-convex/convex-backend/blob/main/self-hosted/advanced/upgrading.md).

## Custom Domain

To use your own domain with a reverse proxy, you'll need to configure routing and update the Convex origin environment variables. See [Hosting on Own Infrastructure](https://github.com/get-convex/convex-backend/blob/main/self-hosted/advanced/hosting_on_own_infra.md).

## Environment Variables

### Required

| Variable                       | Description                                           |
| ------------------------------ | ----------------------------------------------------- |
| `SELF_HOSTED`                  | Set to `true` for Docker builds                       |
| `CONVEX_SELF_HOSTED_URL`       | Convex backend URL (default: `http://127.0.0.1:3210`) |
| `CONVEX_SELF_HOSTED_ADMIN_KEY` | Admin key for Convex CLI (auto-generated)             |
| `NEXT_PUBLIC_CONVEX_URL`       | Public Convex URL for browser                         |
| `NEXT_PUBLIC_CONVEX_SITE_URL`  | Public Convex Site URL                                |
| `SITE_URL`                     | Application URL                                       |
| `BETTER_AUTH_SECRET`           | Session encryption secret                             |
| `CONVEX_API_SECRET`            | Internal API authentication                           |

### Optional

| Variable                                                        | Description                   |
| --------------------------------------------------------------- | ----------------------------- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                      | Google OAuth for social login |
| `OPENAI_API_KEY`, `OPENAI_ENDPOINT`                             | Azure OpenAI for AI features  |
| `RESEND_API_KEY`                                                | Email service                 |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` | Payments                      |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`                            | Client-side Stripe            |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`           | Analytics                     |

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

### "Failed to decrypt private key" error

If you see this after changing `BETTER_AUTH_SECRET`:

1. Open Convex Dashboard at http://localhost:6791
2. Find the `betterAuth_jwks` table
3. Delete all rows
4. Try logging in again

## Convex Self-Hosting Documentation

- [Self-Hosting Overview](https://docs.convex.dev/self-hosting)
- [Develop & Deploy Guide](https://stack.convex.dev/self-hosted-develop-and-deploy)
- [GitHub: Self-Hosted README](https://github.com/get-convex/convex-backend/blob/main/self-hosted/README.md)
- [GitHub: Upgrading](https://github.com/get-convex/convex-backend/blob/main/self-hosted/advanced/upgrading.md)
- [GitHub: Hosting on Own Infrastructure](https://github.com/get-convex/convex-backend/blob/main/self-hosted/advanced/hosting_on_own_infra.md)
