# Self-Hosting Ignidash

Run Ignidash on your own machine or server with Docker Compose. Everything runs in containers: you do not need Node.js, npm, or the Convex CLI on the host.

The stack has five services:

| Service            | What it does                                                                                 | Runs           |
| ------------------ | -------------------------------------------------------------------------------------------- | -------------- |
| `convex-backend`   | Database and server functions ([Convex](https://convex.dev))                                 | Always         |
| `convex-dashboard` | Optional admin UI for the database                                                           | Always         |
| `convex-admin-key` | Creates the Convex admin key on first start and keeps it in a Docker volume                  | Once per start |
| `convex-init`      | Sends your settings to Convex, deploys Ignidash's server functions, and runs data migrations | Once per start |
| `app`              | The Ignidash web app; starts only after `convex-init` succeeds                               | Always         |

## Prerequisites

- Git
- Docker Engine or Docker Desktop
- Docker Compose v2.17 or newer (v2.24.4 or newer if you [change ports](#changing-ports))
- `openssl` to generate secrets (preinstalled on macOS and most Linux distributions)

Check Docker and Compose:

```bash
docker version
docker compose version
```

## Quick Start

```bash
git clone https://github.com/schelskedevco/ignidash.git
cd ignidash
sh scripts/selfhost.sh --init
```

The script:

1. Asks how you will reach Ignidash: on this computer (localhost), from other devices on your network (LAN IP or hostname), or through your own domain behind a reverse proxy.
2. Creates `.env.local` with freshly generated secrets, readable only by you.
3. Links `.env` to `.env.local` (Docker Compose reads `.env`).
4. Starts everything with `docker compose up -d`.

When it finishes, open the printed URL and create your account. If you chose LAN or domain access, also read [Network Configuration](#network-configuration).

## Manual Installation

Use this instead of the Quick Start if you prefer to configure everything yourself.

```bash
git clone https://github.com/schelskedevco/ignidash.git
cd ignidash
cp .env.selfhost.example .env.local
chmod 600 .env.local
ln -sf .env.local .env
```

Edit `.env.local` and set these required values:

| Variable                      | Description                                                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| `SELF_HOSTED`                 | Keep set to `true`                                                                                        |
| `NEXT_PUBLIC_CONVEX_URL`      | Convex API URL that users' browsers connect to                                                            |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Convex HTTP Actions URL that users' browsers connect to                                                   |
| `SITE_URL`                    | Public URL of the Ignidash app                                                                            |
| `BETTER_AUTH_SECRET`          | Secret that protects logins and sessions; [never change it](#sign-in-works-but-the-dashboard-never-loads) |
| `CONVEX_API_SECRET`           | Secret that protects internal requests between services                                                   |

The URL defaults work when you use Ignidash on the same computer. For other setups, see [Network Configuration](#network-configuration).

Generate each secret with this command, running it once per secret so the two values differ:

```bash
openssl rand -base64 32
```

Start Ignidash:

```bash
docker compose up -d
```

Then open `http://localhost:3000/signup`, or your `SITE_URL` followed by `/signup`.

Keep all settings in `.env.local`; `.env` is only a link to it, and Git ignores both files.

## Checking That It Started

```bash
docker compose ps -a
```

When everything worked, `convex-admin-key` and `convex-init` show `Exited (0)`: they are one-time setup steps, not services that keep running. `app`, `convex-backend`, and `convex-dashboard` show `Up`.

To follow the setup steps while they run:

```bash
docker compose logs -f convex-admin-key convex-init
```

If a setup step fails, the app does not start, and the `convex-init` log says what is wrong (for example, a missing secret). Fix it in `.env.local` and run `docker compose up -d` again. During an upgrade, the previous version of the app may keep running until setup succeeds.

To re-run setup by itself, for example after editing `.env.local`:

```bash
docker compose run --rm convex-init
```

## Network Configuration

Ignidash uses three addresses that users' browsers must reach:

| Setting                       | Default port | Used for                       |
| ----------------------------- | ------------ | ------------------------------ |
| `SITE_URL`                    | 3000         | The web app                    |
| `NEXT_PUBLIC_CONVEX_URL`      | 3210         | Live data (uses WebSockets)    |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | 3211         | Sign-in and other HTTP actions |

> **Important:** the `convex-backend` container must also be able to reach `NEXT_PUBLIC_CONVEX_SITE_URL` itself, because it checks every sign-in against that address. If it cannot, signing in appears to work but the dashboard never loads. The setups below all satisfy this; see [Reverse Proxy](#reverse-proxy) and [Changing Ports](#changing-ports) for the cases that need care.

After changing any of these URLs, run `docker compose up -d`.

### Localhost

The defaults work when the browser runs on the same computer as Docker:

```dotenv
NEXT_PUBLIC_CONVEX_URL=http://localhost:3210
NEXT_PUBLIC_CONVEX_SITE_URL=http://localhost:3211
SITE_URL=http://localhost:3000
```

### LAN Access

To use Ignidash from other devices on your network, replace `localhost` with the Docker host's LAN IP address or hostname:

```dotenv
NEXT_PUBLIC_CONVEX_URL=http://192.168.1.100:3210
NEXT_PUBLIC_CONVEX_SITE_URL=http://192.168.1.100:3211
SITE_URL=http://192.168.1.100:3000
```

Clients must be able to reach ports `3000`, `3210`, and `3211` (`6791` only for the Convex Dashboard). Plain HTTP sends passwords, sessions, and financial data unencrypted, so only use it on a network you fully trust; otherwise use a reverse proxy with HTTPS.

### Reverse Proxy

To serve Ignidash over HTTPS on your own domain, route three hostnames to the three ports:

| Public URL                      | Target           | Notes                               |
| ------------------------------- | ---------------- | ----------------------------------- |
| `https://finance.example.com`   | `localhost:3000` | Ignidash                            |
| `https://api.example.com`       | `localhost:3210` | Convex API; must support WebSockets |
| `https://actions.example.com`   | `localhost:3211` | Convex HTTP Actions                 |
| `https://dashboard.example.com` | `localhost:6791` | Optional Convex Dashboard           |

and set:

```dotenv
NEXT_PUBLIC_CONVEX_URL=https://api.example.com
NEXT_PUBLIC_CONVEX_SITE_URL=https://actions.example.com
SITE_URL=https://finance.example.com
```

If you use Google sign-in, set its callback URL to `{SITE_URL}/api/auth/callback/google`.

As noted [above](#network-configuration), the `convex-backend` container connects to `https://actions.example.com` itself. This works without changes when that name resolves to an address the container can reach and the certificate comes from a public authority such as Let's Encrypt. Two common homelab setups need an override file:

- **The name does not resolve from inside Docker**, for example because it exists only in your local DNS or your router does not support hairpin NAT. Point it at the Docker host.
- **The certificate comes from a private or self-signed CA**, for example Caddy's internal CA, step-ca, or a `.home.arpa` domain. Give the backend a CA bundle that includes your CA: copy the system bundle out of the container (`docker compose exec convex-backend cat /etc/ssl/certs/ca-certificates.crt > ca-bundle.crt`) and append your CA's root certificate to `ca-bundle.crt`.

Create `docker-compose.override.yml` next to `docker-compose.yml` (Compose loads it automatically, and Git ignores it). Keep only the parts you need:

```yaml
services:
  convex-backend:
    extra_hosts:
      - 'actions.example.com:host-gateway'
    environment:
      - SSL_CERT_FILE=/etc/ignidash/ca-bundle.crt
    volumes:
      - ./ca-bundle.crt:/etc/ignidash/ca-bundle.crt:ro
```

Then run `docker compose up -d`.

### Changing Ports

If a default port is already in use, change the host side of the mapping in `docker-compose.override.yml`. `!override` replaces the default mapping instead of adding to it, and needs Docker Compose v2.24.4 or newer.

Changing only the app port is always safe:

```yaml
services:
  app:
    ports: !override
      - '3001:3000'
```

and set `SITE_URL=http://localhost:3001`.

To change the Convex ports as well, use the host's LAN IP address or hostname in the URLs, not `localhost`, so that `convex-backend` can reach its own address:

```yaml
services:
  app:
    ports: !override
      - '3001:3000'
  convex-backend:
    ports: !override
      - '3310:3210'
      - '3311:3211'
```

```dotenv
SITE_URL=http://192.168.1.100:3001
NEXT_PUBLIC_CONVEX_URL=http://192.168.1.100:3310
NEXT_PUBLIC_CONVEX_SITE_URL=http://192.168.1.100:3311
```

Then run `docker compose up -d`.

## Optional Features

These optional values in `.env.local` turn on extra features. `convex-init` sends each one to Convex when it is set:

| Variables                                                       | Feature                                        |
| --------------------------------------------------------------- | ---------------------------------------------- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                      | Google sign-in                                 |
| `OPENAI_API_KEY`, `OPENAI_ENDPOINT`                             | AI chat and insights (Azure OpenAI)            |
| `RESEND_API_KEY`                                                | Password reset and notification emails         |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID` | Subscriptions                                  |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`           | Server-side analytics (also passed to the app) |

After changing them, apply the change:

```bash
docker compose up -d
```

Clearing a value in `.env.local` does not remove it from Convex. To remove one, delete it in the Convex Dashboard under **Settings → Environment Variables**.

Browser-side Stripe and PostHog (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and browser analytics) are compiled into the app image when it is built. The published images are built without them, so using them requires building your own app image.

## Upgrading

Take an [export](#export-recommended-before-every-upgrade) first, then run:

```bash
git pull
docker compose pull
docker compose up -d
```

`sh scripts/selfhost.sh` with no options runs the same `pull` and `up -d`.

On every start, `convex-init` reuses the stored admin key, sends your current settings to Convex, deploys the server functions that match the app version, and runs any new data migrations before the app starts. It never deletes your data or changes your secrets.

The app image (`ignidash`) and the setup image (`ignidash-convex-init`) are always published together with the same tags. The Convex backend and dashboard images are pinned in `docker-compose.yml` to a version tested with each release, so they only change when a release you `git pull` moves them. Before a major Convex upgrade, also review the upstream [Convex upgrading guide](https://github.com/get-convex/convex-backend/blob/main/self-hosted/advanced/upgrading.md).

### Pinning a Version

By default, Ignidash uses the `stable` tag (the latest release). To stay on a specific release, set `IGNIDASH_TAG` in `.env.local`:

```dotenv
IGNIDASH_TAG=0.4.0
```

This selects the tag for both Ignidash images. See [Docker Images](#docker-images) for the available tags.

### Upgrading from v0.3.x or Earlier

Older releases ran `npm run selfhost`, which needed Node.js on the host. Upgrade with the same three commands as above:

```bash
git pull
docker compose pull
docker compose up -d
```

Keep your `.env.local`, the `.env` link, and the Docker volumes. On first start, Ignidash creates a new admin key from the existing Convex data; your users, sessions, and plans are kept. Node.js is no longer needed.

Then remove the old admin key from `.env.local` and make the file private. The old key still gives full access to your data, and older releases left `.env.local` readable by every user on the host:

1. Delete the `CONVEX_SELF_HOSTED_URL` and `CONVEX_SELF_HOSTED_ADMIN_KEY` lines from `.env.local`.
2. Restrict the file:

   ```bash
   chmod 600 .env.local
   ```

`scripts/selfhost.sh` sets these permissions and warns about a leftover admin key whenever it runs.

## Credentials and Dashboard Access

The Convex admin key is stored in the `convex-credentials` Docker volume. It is never printed during startup and never given to the app.

To sign in to the Convex Dashboard (`http://localhost:6791`), display the key:

```bash
docker compose run --rm --no-deps --entrypoint sh convex-init -c 'cat /run/ignidash/admin-key'
```

Treat it like a root password: anyone with it can read and change all data. Avoid saving it in shell history, tickets, or logs.

If the stored key is **deleted**, the next `docker compose up -d` creates a new one automatically.

If the stored key is **wrong**, `convex-init` fails with `BadAdminKey`. This happens when `convex-data` is restored without its matching `convex-credentials` volume. Create a new key and re-run setup:

```bash
docker compose run --rm -e FORCE_REGENERATE_ADMIN_KEY=1 convex-admin-key
docker compose run --rm convex-init
```

Creating a new key does not revoke older keys.

## Backup and Restore

Both methods below run entirely in Docker and stream the backup to a file on the host, so they need no Node.js and work regardless of file ownership on the host. Run them from the Ignidash directory.

Backups contain all user financial data, and the volume archive also contains the Convex instance secret and admin key. The commands create them readable only by you (`umask 077`); store them somewhere equally protected. Keep a copy of `.env.local` with them: restoring with a different `BETTER_AUTH_SECRET` invalidates every login.

### Export (recommended before every upgrade)

A Convex snapshot export, including uploaded files, taken while Ignidash is running:

```bash
mkdir -p backups
(umask 077; docker compose run --rm --no-deps -T --entrypoint sh convex-init -c '
  CONVEX_SELF_HOSTED_ADMIN_KEY=$(cat /run/ignidash/admin-key) &&
  export CONVEX_SELF_HOSTED_ADMIN_KEY &&
  /app/node_modules/.bin/convex export --include-file-storage --path /tmp/backup.zip >&2 &&
  cat /tmp/backup.zip' > "backups/ignidash-$(date +%Y%m%d-%H%M%S).zip")
```

To restore an export into a running deployment, **replacing all of its data**:

```bash
docker compose run --rm --no-deps -T --entrypoint sh convex-init -c '
  cat > /tmp/backup.zip &&
  CONVEX_SELF_HOSTED_ADMIN_KEY=$(cat /run/ignidash/admin-key) &&
  export CONVEX_SELF_HOSTED_ADMIN_KEY &&
  /app/node_modules/.bin/convex import --replace-all --yes /tmp/backup.zip' < backups/ignidash-YYYYMMDD-HHMMSS.zip
```

An export is also the way to move data between Convex backend versions that cannot upgrade in place; see the upstream [export/import guide](https://github.com/get-convex/convex-backend/blob/main/self-hosted/advanced/upgrading.md).

### Volume archive (full disaster recovery)

An exact copy of both volumes: `convex-data` (database, files, deployed functions, migration state, and instance credentials) and `convex-credentials` (the initializer's admin key). Stop the stack first so the copy is consistent:

```bash
mkdir -p backups
docker compose stop
(umask 077; docker compose run --rm --no-deps -T --entrypoint tar convex-admin-key \
  czf - -C / convex/data credentials > "backups/ignidash-volumes-$(date +%Y%m%d-%H%M%S).tar.gz")
docker compose up -d
```

To restore, stop the stack, **replace both volumes** with the archive, and start again:

```bash
docker compose stop
docker compose run --rm --no-deps -T --entrypoint sh convex-admin-key -c '
  find /convex/data /credentials -mindepth 1 -delete && tar xzf - -C /' < backups/ignidash-volumes-YYYYMMDD-HHMMSS.tar.gz
docker compose up -d
```

On a new host, first clone the repository at the same version, restore `.env.local`, run `ln -sf .env.local .env`, and run `docker compose create` to create the empty volumes; then run the restore commands above.

Restore an archive only onto the same Convex backend version it was taken from, or newer.

## Troubleshooting

Start with the service states and logs:

```bash
docker compose ps -a
docker compose logs convex-init convex-backend app
```

Errors from Ignidash's server functions appear in the Convex Dashboard (`http://localhost:6791`, under **Logs**), not in `docker compose logs`. See [Credentials and Dashboard Access](#credentials-and-dashboard-access) for how to sign in.

### The app does not start

`convex-init` failed, so the app was intentionally not started. Its log names the problem:

```bash
docker compose logs convex-admin-key convex-init
```

Fix it and run `docker compose up -d` again. If the log shows `BadAdminKey`, see [Credentials and Dashboard Access](#credentials-and-dashboard-access).

### Sign-in works but the dashboard never loads

Your password is accepted, but the dashboard never loads or shows an error. The Convex backend could not validate the sign-in. Check, in this order:

1. **`convex-backend` cannot reach `NEXT_PUBLIC_CONVEX_SITE_URL`.** `docker compose logs convex-backend` shows `failed to verify TLS certificate` or connection errors. See [Reverse Proxy](#reverse-proxy) and [Changing Ports](#changing-ports).
2. **`BETTER_AUTH_SECRET` changed** after accounts were created. The Convex Dashboard logs show `Failed to decrypt private key`. Put the previous secret back in `.env.local` and run `docker compose up -d`. Do not delete authentication data to work around this.
3. **Browser-facing URLs still use `localhost`** while you connect from another device. See [LAN Access](#lan-access).
4. **A reverse proxy without WebSocket support** for `NEXT_PUBLIC_CONVEX_URL`.

### Port already in use

`docker compose up -d` reports that a port is already allocated. See [Changing Ports](#changing-ports). The defaults are:

| Port | Service             |
| ---- | ------------------- |
| 3000 | Ignidash app        |
| 3210 | Convex API          |
| 3211 | Convex HTTP Actions |
| 6791 | Convex Dashboard    |

## Docker Images

Two images are published to the GitHub Container Registry with identical tags:

| Image                                        | Purpose                                                                      |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| `ghcr.io/schelskedevco/ignidash`             | The Ignidash web app                                                         |
| `ghcr.io/schelskedevco/ignidash-convex-init` | One-time setup: sends settings to Convex, deploys functions, runs migrations |

| Tag                  | Description                                        |
| -------------------- | -------------------------------------------------- |
| `stable`             | Latest tagged release (recommended for production) |
| `latest`             | Latest commit to main branch                       |
| `X.Y.Z` (e.g. 0.4.0) | Specific release (no `v` prefix)                   |
| `X.Y` (e.g. 0.4)     | Latest patch release of a minor version            |
| `<short-sha>`        | A specific commit on main (e.g. `56a1aac`)         |

`docker-compose.yml` uses `stable` unless `IGNIDASH_TAG` is set.

## Testing Changes to Self-Hosting

Contributors changing anything that affects self-hosting can run the same checks as CI:

```bash
npm run test:selfhost       # fast script and configuration checks (needs Docker for the config checks)
npm run test:selfhost:e2e   # builds both images and runs every scenario in this guide (about 15 minutes)
```

To run your own changes as a self-hosted stack, build both images from your working tree and point Compose at them:

```bash
npm run docker:build                    # tags both images as :local
IGNIDASH_TAG=local docker compose up -d
```

## Convex Documentation

- [Self-hosting overview](https://docs.convex.dev/self-hosting)
- [Self-hosted backend README](https://github.com/get-convex/convex-backend/blob/main/self-hosted/README.md)
- [Upgrading self-hosted Convex](https://github.com/get-convex/convex-backend/blob/main/self-hosted/advanced/upgrading.md)
