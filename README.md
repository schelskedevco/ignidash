# Ignidash

A financial planning application for simulating retirement scenarios using Monte Carlo methods, historical backtesting, and AI-powered insights. Built for FIRE (Financial Independence, Early Retirement) planning.

## Features

- **Monte Carlo Simulations** - Run thousands of scenarios with stochastic returns
- **Historical Backtesting** - Test against real market data
- **Multi-Plan Comparison** - Compare different retirement strategies side-by-side
- **Tax Optimization** - Model tax implications across account types
- **Portfolio Analysis** - Track asset allocation and rebalancing
- **AI Insights** - Get AI-powered analysis of your financial plans

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend:** Convex (serverless database + functions)
- **Auth:** Better-Auth with Google OAuth
- **Payments:** Stripe
- **AI:** Azure OpenAI

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
cp .env.selfhost.example .env.local

# Generate secrets
openssl rand -base64 32  # For BETTER_AUTH_SECRET
openssl rand -base64 32  # For CONVEX_API_SECRET
```

Edit `.env.local` and fill in the generated secrets.

### Running Locally

```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start Convex local backend
npm run dev:convex
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

## Self-Hosting with Docker

See [SELF_HOSTING.md](./SELF_HOSTING.md) for instructions on running Ignidash on your own infrastructure.

## License

MIT
