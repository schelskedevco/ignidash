# Self-Hosting Ignidash

Run Ignidash on your own infrastructure using Docker, including a self-hosted Convex backend.

## Setup Guide

Follow the steps below to get your app running.

### Step 1: Install Prerequisites

#### Node.js

1. Install Node.js from the [official website](https://nodejs.org/)
2. Verify Node.js is installed:

```bash
node --version
```

#### Docker

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

1. Ask how you'll access Ignidash (localhost, LAN IP, or domain with reverse proxy)
2. Create `.env.local` from the template with generated secrets
3. Start Docker containers (Convex backend, dashboard, and app)
4. Generate and save the Convex admin key
5. Sync environment variables to Convex
6. Deploy Convex functions

### Step 4: Create Your Account

Once complete, the script will display URLs for your app and Convex Dashboard.

Open the app URL (default: http://localhost:3000/signup), create an account, and you're in.

### Step 5: Enjoy!

Your self-hosted Ignidash is now running. If you find bugs or have feature requests, join our [Discord](https://discord.gg/AVNg9JCNUr) or open a [GitHub Issue](https://github.com/schelskedevco/ignidash/issues).

## Docker Images

| Tag      | Description                                        |
| -------- | -------------------------------------------------- |
| `stable` | Latest tagged release (recommended for production) |
| `latest` | Latest commit to main branch                       |
| `vX.Y.Z` | Specific version                                   |

The default `docker-compose.yml` uses `stable`.

## Commands

| Command                           | Description                                                       |
| --------------------------------- | ----------------------------------------------------------------- |
| `npm run selfhost -- --init`      | First-time setup (creates `.env.local` from template)             |
| `npm run selfhost`                | Rebuild, restart, regenerate admin key, sync env vars, and deploy |
| `npm run selfhost -- --sync-only` | Sync env vars to Convex without rebuilding containers             |
| `npm run selfhost:convex-dev`     | Hot reload for Convex functions in development                    |
| `npm run selfhost:convex-deploy`  | Deploy Convex functions to self-hosted backend                    |
| `npm run docker:build`            | Build images (requires build context in docker-compose.yml)       |
| `npm run docker:up`               | Start services in background                                      |
| `npm run docker:down`             | Stop services                                                     |
| `npm run docker:logs`             | Stream service logs                                               |

> **Note:** `npm run selfhost` generates a new Convex admin key each run. Your Convex Dashboard credentials will change. The new key is saved to `.env.local`.

## Upgrading

```bash
git pull                 # Update app code and Convex functions
docker compose pull      # Pull latest images (app, Convex backend, and dashboard)
npm run selfhost         # Rebuild, sync env vars, and deploy
```

It's recommended to back up with `npx convex export` before upgrading. See [Convex Upgrading Guide](https://github.com/get-convex/convex-backend/blob/main/self-hosted/advanced/upgrading.md) for more.

## Access Configuration

To change your access method after setup, edit these three variables in `.env.local` and re-run `npm run selfhost` to rebuild the containers with the new URLs:

- `SITE_URL` — where the app is reachable (e.g., `http://192.168.1.100:3000` or `https://mydomain.com`)
- `NEXT_PUBLIC_CONVEX_URL` — Convex API (e.g., `http://192.168.1.100:3210` or `https://api.mydomain.com`)
- `NEXT_PUBLIC_CONVEX_SITE_URL` — Convex HTTP Actions (e.g., `http://192.168.1.100:3211` or `https://actions.mydomain.com`)

Always keep `CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210` — the Convex CLI runs on the host machine.

### LAN / IP Access

> **Firewall:** Ports 3000, 3210, 3211, and 6791 must be reachable from client machines. If you're running on a homelab (e.g., Proxmox, TrueNAS), check that your host firewall and any network-level rules allow traffic on these ports.

### Reverse Proxy / Custom Domain

The setup script uses `api.` and `actions.` subdomains by default. If you use different subdomains, edit the URLs above in `.env.local` after setup.

Configure your reverse proxy to forward requests to the local ports:

| Public URL                       | Target           | Notes                                |
| -------------------------------- | ---------------- | ------------------------------------ |
| `https://mydomain.com`           | `localhost:3000` | Ignidash app                         |
| `https://api.mydomain.com`       | `localhost:3210` | Convex API (needs WebSocket support) |
| `https://actions.mydomain.com`   | `localhost:3211` | Convex HTTP Actions                  |
| `https://dashboard.mydomain.com` | `localhost:6791` | Convex Dashboard                     |

> **Important:** The Convex API proxy (`api.mydomain.com` -> `localhost:3210`) **must** support WebSocket connections. Ensure your reverse proxy is configured for WebSocket upgrades (Nginx: `proxy_set_header Upgrade $http_upgrade` + `proxy_set_header Connection "upgrade"`, Caddy: automatic, Traefik: automatic).

## Environment Variables

### Required

| Variable                       | Description                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------ |
| `SELF_HOSTED`                  | Enables Next.js standalone output for Docker builds                            |
| `CONVEX_SELF_HOSTED_URL`       | Convex backend URL for CLI commands (default: `http://127.0.0.1:3210`)         |
| `CONVEX_SELF_HOSTED_ADMIN_KEY` | Admin key for Convex CLI and Dashboard (auto-generated by setup script)        |
| `NEXT_PUBLIC_CONVEX_URL`       | Convex API URL used by the browser (default: `http://localhost:3210`)          |
| `NEXT_PUBLIC_CONVEX_SITE_URL`  | Convex HTTP Actions URL used by the browser (default: `http://localhost:3211`) |
| `SITE_URL`                     | Public URL of the application (default: `http://localhost:3000`)               |
| `BETTER_AUTH_SECRET`           | Secret for encrypting auth sessions and JWKs                                   |
| `CONVEX_API_SECRET`            | Secret for internal API authentication between services                        |

### Optional

See [Optional Environment Variables](./README.md#optional-environment-variables) for Google OAuth, Stripe, AI features, and more.

## Troubleshooting

### "Failed to decrypt private key" error

This happens when `BETTER_AUTH_SECRET` changes, but the database still has keys encrypted with the old secret. Common cause: running `npm run selfhost -- --init` a second time after already logging in.

To fix:

1. Open Convex Dashboard at http://localhost:6791
2. Find the `betterAuth_jwks` table
3. Delete all rows
4. Try logging in again

### Services won't start

Check which services are running and their health status:

```bash
docker compose ps
```

Then check the logs for the failing service:

```bash
docker compose logs
```

A common cause is port conflicts. These are the ports each service requires:

| Port | Service             |
| ---- | ------------------- |
| 3000 | Ignidash app        |
| 3210 | Convex backend API  |
| 3211 | Convex HTTP Actions |
| 6791 | Convex Dashboard    |

Other causes include insufficient memory or Docker not running.

### Missing environment variables in Convex

List current Convex env vars (find the admin key in `.env.local` under `CONVEX_SELF_HOSTED_ADMIN_KEY`):

```bash
npx convex env list --url http://127.0.0.1:3210 --admin-key <your-admin-key>
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
