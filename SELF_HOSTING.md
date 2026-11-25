# Self-Hosting Ignidash

Run Ignidash with Docker Compose, including its self-hosted Convex backend. Node.js, npm, and the Convex CLI are not required on the host.

## Prerequisites

- Git
- Docker Engine (or Docker Desktop)
- Docker Compose v2.17 or newer
- `openssl` to generate secrets (preinstalled on macOS and most Linux distributions)

Verify Docker and Compose before continuing:

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

The script asks how you will reach Ignidash (localhost, a LAN IP or hostname, or a domain behind a reverse proxy), creates `.env.local` with freshly generated secrets, links `.env` to it, and starts the stack with `docker compose up -d`. When it finishes, open the printed URL and create your account.

The script only calls Docker. If you prefer to set things up by hand, follow the manual steps below instead.

## Manual Installation

```bash
git clone https://github.com/schelskedevco/ignidash.git
cd ignidash
cp .env.selfhost.example .env.local
chmod 600 .env.local
ln -sf .env.local .env
```

Edit `.env.local` and configure these required values:

| Variable                      | Description                                                   |
| ----------------------------- | ------------------------------------------------------------- |
| `SELF_HOSTED`                 | Keep set to `true`                                            |
| `NEXT_PUBLIC_CONVEX_URL`      | Convex API URL reachable by users' browsers                   |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Convex HTTP Actions URL reachable by users' browsers          |
| `SITE_URL`                    | Public URL of the Ignidash application                        |
| `BETTER_AUTH_SECRET`          | Stable secret used by Better Auth for sessions and encryption |
| `CONVEX_API_SECRET`           | Stable secret used to protect internal HTTP actions           |

Docker Compose reads `.env` when interpolating `docker-compose.yml`, so the `.env` → `.env.local` symlink is what makes the public URLs above reach the containers. Keep all configuration in `.env.local`. Neither file is tracked by Git.

Generate each secret with:

```bash
openssl rand -base64 32
```

Run the command twice and use a different value for each secret. Never change `BETTER_AUTH_SECRET` or `CONVEX_API_SECRET` during a normal restart or upgrade.

Start the deployment:

```bash
docker compose up -d
```

Compose automatically waits for Convex, creates a persistent administrative credential, synchronizes the Convex environment, deploys the Convex functions bundled in the `ignidash-convex-init` image, and runs pending migrations before starting Ignidash.

Open `http://localhost:3000/signup` unless you configured another `SITE_URL`.

## Initialization Status

Follow first-run initialization:

```bash
docker compose logs -f convex-admin-key convex-init
```

Inspect all service states:

```bash
docker compose ps -a
```

After successful initialization, `convex-admin-key` and `convex-init` should show `Exited (0)`. They are one-shot services, not background daemons. The `app` service starts only after `convex-init` exits successfully.

On a fresh installation or recreated app container, initialization failure keeps the app stopped. During an in-place upgrade, an already-running app may continue serving the previous version until Compose recreates it. Correct the reported configuration or connectivity problem, then retry:

```bash
docker compose up -d
```

To run initialization explicitly without restarting the other services:

```bash
docker compose run --rm convex-init
```

## Network Configuration

The public URLs in `.env.local` are used by browsers. Docker-internal service addresses are configured separately and must not be placed in the public URL variables.

### Localhost

The example defaults are suitable when the browser runs on the Docker host:

```dotenv
NEXT_PUBLIC_CONVEX_URL=http://localhost:3210
NEXT_PUBLIC_CONVEX_SITE_URL=http://localhost:3211
SITE_URL=http://localhost:3000
```

### LAN Access

Replace `localhost` with the Docker host's LAN address or hostname:

```dotenv
NEXT_PUBLIC_CONVEX_URL=http://192.168.1.100:3210
NEXT_PUBLIC_CONVEX_SITE_URL=http://192.168.1.100:3211
SITE_URL=http://192.168.1.100:3000
```

Ports `3000`, `3210`, and `3211` must be reachable by clients. Port `6791` is needed only for direct dashboard access. Plain HTTP exposes passwords, sessions, financial data, and tokens to the network, so use TLS on any network you do not fully trust.

### Reverse Proxy

Example public routing:

| Public URL                      | Target           | Notes                                |
| ------------------------------- | ---------------- | ------------------------------------ |
| `https://finance.example.com`   | `localhost:3000` | Ignidash                             |
| `https://api.example.com`       | `localhost:3210` | Convex API; WebSocket support needed |
| `https://actions.example.com`   | `localhost:3211` | Convex HTTP Actions                  |
| `https://dashboard.example.com` | `localhost:6791` | Optional Convex Dashboard            |

Configure matching values:

```dotenv
NEXT_PUBLIC_CONVEX_URL=https://api.example.com
NEXT_PUBLIC_CONVEX_SITE_URL=https://actions.example.com
SITE_URL=https://finance.example.com
```

The proxy for port `3210` must preserve WebSocket upgrade headers. Configure Google OAuth's callback as `{SITE_URL}/api/auth/callback/google`.

## Optional Features

Optional values in `.env.local` are synchronized to Convex when nonempty:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`, `OPENAI_ENDPOINT`
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`

`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is not synchronized to Convex. The published `stable` image was built without browser-side Stripe or PostHog values, so those require a custom frontend image.

After changing configuration, sync it to Convex with:

```bash
docker compose run --rm convex-init
```

If you changed the public URLs, also run `docker compose up -d` so the app and backend pick them up.

Empty optional values are skipped; they do not delete an existing value from Convex. Remove a previously configured value through the Convex Dashboard if it must be deleted.

The published `stable` frontend has public browser variables baked in at image-build time. Runtime configuration patches the public Convex URLs, but changing browser-side Stripe or PostHog values requires a custom frontend image. Server-side PostHog configuration is synchronized to Convex and also passed to the app container, which reads it when it starts; run `docker compose up -d` after changing it.

## Upgrading

Take an [export](#export-recommended-before-every-upgrade) first, then update and reconcile the deployment:

```bash
git pull
docker compose pull
docker compose up -d
```

(`sh scripts/selfhost.sh` with no arguments does the same `pull` and `up -d`.)

Both images, `ignidash` (the app) and `ignidash-convex-init` (the Convex initializer), are published together with the same tags, so the Convex functions that get deployed always match the app version. On every `up`, the initializer reuses the stored admin credential, updates configured Convex environment values, deploys functions idempotently, and runs any pending migrations, waiting for them to finish. It never deletes Convex data or regenerates application secrets.

The Convex backend and dashboard images are pinned by digest in `docker-compose.yml` to an upstream build tested with this release, so `docker compose pull` only changes the Convex version when you `git pull` a release that moves the pin. Review the upstream [Convex upgrading guide](https://github.com/get-convex/convex-backend/blob/main/self-hosted/advanced/upgrading.md) before a major Convex backend upgrade.

### Pinning a version

By default, Compose uses the `stable` tag. To pin a specific release, set `IGNIDASH_TAG` in `.env.local`:

```dotenv
IGNIDASH_TAG=0.4.0
```

`IGNIDASH_TAG` selects the tag for both the app and the initializer images. See [Docker Images](#docker-images) for the available tags.

### Upgrading from v0.3.x or earlier

Older releases ran `npm run selfhost`, which used Node.js and the Convex CLI on the host. Upgrade in place with the same three commands:

```bash
git pull
docker compose pull
docker compose up -d
```

Keep your existing `.env.local`, the `.env` symlink, and the Docker volumes. On first start, the initializer creates its own admin credential from the persisted Convex instance secret; existing data, users, sessions, and old admin keys are kept.

After upgrading, delete the `CONVEX_SELF_HOSTED_URL` and `CONVEX_SELF_HOSTED_ADMIN_KEY` lines from `.env.local` and restrict the file's permissions. The initializer ignores those lines and the app never receives an admin key, but the old key still grants full access to your Convex data, and older releases created `.env.local` readable by every user on the host:

```bash
chmod 600 .env.local
```

`scripts/selfhost.sh` applies these permissions and warns about a leftover admin key whenever it runs. Node.js is no longer needed on the host.

## Credentials and Dashboard Access

The generated Convex admin key is stored in the `convex-credentials` Docker volume. It is not printed during startup and is not passed to the app container.

Display it only when dashboard or administrative access is required:

```bash
docker compose run --rm --no-deps --entrypoint sh convex-init -c 'cat /run/ignidash/admin-key'
```

Treat the output as a full administrative credential. Avoid saving it in shell history, tickets, or logs.

If the stored key is lost while `convex-data` remains intact, generate another key and rerun initialization:

```bash
docker compose run --rm -e FORCE_REGENERATE_ADMIN_KEY=1 convex-admin-key
docker compose run --rm convex-init
```

If `convex-data` is restored without its matching `convex-credentials` volume, regenerate the key the same way. Generating another key does not necessarily revoke older keys. Rotating the Convex instance secret invalidates all keys and is an advanced recovery procedure that should not be performed during a routine deployment.

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

### Signup or login fails

Confirm initialization succeeded before investigating the frontend:

```bash
docker compose ps -a
docker compose logs convex-init convex-backend app
```

Common causes are:

- Empty `BETTER_AUTH_SECRET` or `CONVEX_API_SECRET`
- Incorrect `SITE_URL`
- Browser-facing Convex URLs still using `localhost` during LAN access
- A reverse proxy that does not support WebSockets on port `3210`
- An initializer deployment or migration failure

### Failed to decrypt a Better Auth private key

This indicates that `BETTER_AUTH_SECRET` changed while encrypted Better Auth data remained in Convex. Restore the previous secret from backup. Do not routinely delete JWK or session data, because doing so invalidates authentication material rather than repairing the underlying secret mismatch.

### App remains stopped

Inspect the one-shot initializer:

```bash
docker compose logs convex-admin-key convex-init
```

The app intentionally does not start after a failed initialization. Fix the reported error and rerun `docker compose up -d`.

### Port conflict

Default ports are:

| Port | Service             |
| ---- | ------------------- |
| 3000 | Ignidash app        |
| 3210 | Convex API          |
| 3211 | Convex HTTP Actions |
| 6791 | Convex Dashboard    |

## Docker Images

Two images are published to the GitHub Container Registry with identical tags:

| Image                                        | Purpose                                                               |
| -------------------------------------------- | --------------------------------------------------------------------- |
| `ghcr.io/schelskedevco/ignidash`             | The Ignidash web app                                                  |
| `ghcr.io/schelskedevco/ignidash-convex-init` | One-shot initializer: syncs env vars, deploys Convex, runs migrations |

| Tag                  | Description                                        |
| -------------------- | -------------------------------------------------- |
| `stable`             | Latest tagged release (recommended for production) |
| `latest`             | Latest commit to main branch                       |
| `X.Y.Z` (e.g. 0.4.0) | Specific release (no `v` prefix)                   |
| `X.Y` (e.g. 0.4)     | Latest patch release of a minor version            |
| `<short-sha>`        | A specific commit on main (e.g. `56a1aac`)         |

`docker-compose.yml` uses `stable` unless `IGNIDASH_TAG` is set.

## Convex Documentation

- [Self-hosting overview](https://docs.convex.dev/self-hosting)
- [Self-hosted backend README](https://github.com/get-convex/convex-backend/blob/main/self-hosted/README.md)
- [Upgrading self-hosted Convex](https://github.com/get-convex/convex-backend/blob/main/self-hosted/advanced/upgrading.md)
