# Self-Hosting Ignidash

Run Ignidash on your own infrastructure using Docker, including a self-hosted Convex backend.

## Setup Guide

Follow the steps below to get your app running.

### Step 1: Install Docker

1. Install Docker Engine by following [the official guide](https://docs.docker.com/get-docker/)
2. Start the Docker service on your machine
3. Verify Docker is installed and running:

```bash
docker run hello-world
```

If Docker is set up correctly, this command will print a success message.

### Step 2: Clone the Repository

```bash
git clone https://github.com/schelskedevco/ignidash.git
cd ignidash
```

### Step 3: Run the Setup Script

```bash
npm run selfhost -- --init
```

The setup script will:

1. Create `.env.local` from the template with generated secrets
2. Start Docker containers (Convex backend, dashboard, and app)
3. Generate and save the Convex admin key
4. Sync environment variables to Convex
5. Deploy Convex functions

### Step 4: Access Your App

Once complete, the script will display:

- **Application:** http://localhost:3000
- **Convex Dashboard:** http://localhost:6791
- **Dashboard credentials** (Deployment URL and Admin Key)

Open your browser and navigate to http://localhost:3000. You should see the Ignidash home page.

### Step 5: Create Your Account

The first time you run the app, create a new account:

1. Click "Create an account" on the sign in page
2. Enter your email, name, and password
3. You're in!

### Step 6: Enjoy!

Your self-hosted Ignidash is now running. If you find bugs or have feature requests, join our [Discord](https://discord.gg/AVNg9JCNUr) or open a [GitHub Issue](https://github.com/schelskedevco/ignidash/issues).

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

To use your own domain with a reverse proxy, configure routing and update the Convex origin environment variables. See [Hosting on Own Infrastructure](https://github.com/get-convex/convex-backend/blob/main/self-hosted/advanced/hosting_on_own_infra.md).

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

See [Optional Environment Variables](./README.md#optional-environment-variables) for Google OAuth, Stripe, AI features, and more.

## Troubleshooting

### "Failed to decrypt private key" error

This happens when `BETTER_AUTH_SECRET` changes but the database still has keys encrypted with the old secret. Common cause: running `npm run selfhost -- --init` a second time after already logging in.

To fix:

1. Open Convex Dashboard at http://localhost:6791
2. Find the `betterAuth_jwks` table
3. Delete all rows
4. Try logging in again

### Services won't start

```bash
docker compose logs
```

Common issues: port conflicts (3000, 3210, 3211, 6791), insufficient memory.

### Missing environment variables in Convex

```bash
npx convex env list --url http://127.0.0.1:3210 --admin-key YOUR_KEY
```

Re-sync with:

```bash
npm run selfhost -- --sync-only
```

## Convex Self-Hosting Documentation

- [Self-Hosting Overview](https://docs.convex.dev/self-hosting)
- [Develop & Deploy Guide](https://stack.convex.dev/self-hosted-develop-and-deploy)
- [GitHub: Self-Hosted README](https://github.com/get-convex/convex-backend/blob/main/self-hosted/README.md)
- [GitHub: Upgrading](https://github.com/get-convex/convex-backend/blob/main/self-hosted/advanced/upgrading.md)
- [GitHub: Hosting on Own Infrastructure](https://github.com/get-convex/convex-backend/blob/main/self-hosted/advanced/hosting_on_own_infra.md)
