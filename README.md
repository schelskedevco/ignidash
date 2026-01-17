# Ignidash

An open-source personal financial planning app with AI-powered features.

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Convex (serverless database + functions)
- **Auth:** Better-Auth with Google OAuth
- **Payments:** Stripe
- **AI:** Azure OpenAI

## Self-Hosting with Docker

See [SELF_HOSTING.md](./SELF_HOSTING.md) for instructions on running Ignidash on your own infrastructure.

## Local Development

### Prerequisites

- Node.js 22+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/schelskedevco/ignidash.git
cd ignidash

# Install dependencies
npm install

# Copy environment template
cp .env.cloud.example .env.local

# Fill in your Convex deployment URL and secrets
# Get your Convex URL from https://dashboard.convex.dev
```

Edit `.env.local` with your Convex deployment URL and generate secrets:

```bash
openssl rand -base64 32  # For BETTER_AUTH_SECRET
openssl rand -base64 32  # For CONVEX_API_SECRET
```

### Syncing Environment Variables

After updating `.env.local`, sync your environment variables to Convex:

```bash
npm run sync-env
```

### Running Locally

```bash
# Terminal 1: Start Convex backend (creates deployment on first run)
npm run dev:convex

# Terminal 2: Start Next.js dev server
npm run dev
```

Open http://localhost:3000 in your browser.

### Available Scripts

| Command              | Description                |
| -------------------- | -------------------------- |
| `npm run dev`        | Start Next.js dev server   |
| `npm run dev:convex` | Start Convex local backend |
| `npm run build`      | Production build           |
| `npm run lint`       | Run ESLint                 |
| `npm run lint:fix`   | Run ESLint with auto-fix   |
| `npm run typecheck`  | TypeScript type checking   |
| `npm run format`     | Format with Prettier       |
| `npm run test`       | Run Vitest tests           |

### Code Style

- ESLint and Prettier run automatically on commit via Husky
- Run `npm run format` to format all files
- Run `npm run lint:fix` to auto-fix linting issues

## License

[AGPL-3.0](https://github.com/schelskedevco/ignidash/blob/main/LICENSE)
