# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ignidash** is a full-stack financial planning application built with Next.js 16 and Convex. It helps users simulate retirement scenarios using Monte Carlo methods, historical backtesting, and AI-powered insights. The app targets FIRE (Financial Independence, Early Retirement) planning with features like multi-plan comparison, tax optimization, and portfolio analysis.

## Essential Commands

### Development

```bash
npm run dev              # Start Next.js dev server (http://localhost:3000)
npm run dev:convex       # Start Convex local backend
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Run ESLint
npm run lint:fix         # Run ESLint with auto-fix
npm run typecheck        # TypeScript type checking without output
npm run format           # Format all files with Prettier
npm run test             # Run Vitest tests
npm run create-demo      # Generate demo data from inputs JSON
```

### Working with Convex

- Backend code lives in `/convex` directory
- Run `npx convex dev` to start Convex backend with live reload
- Database schema defined in `convex/schema.ts`
- Use `npx convex dashboard` to view database in browser

### Code Quality

- Pre-commit hooks automatically run ESLint (with fixes) and Prettier on staged files
- ESLint uses flat config format - modify `eslint.config.mjs`, not `.eslintrc`
- Run `npm run format` after making changes to ensure consistent formatting
- Generated Convex files in `convex/_generated/` are ignored by lint-staged

## Architecture & Key Patterns

### Tech Stack

**Frontend:**

- Next.js 16 with App Router (React 19)
- TypeScript 5 with strict mode
- Tailwind CSS v4
- Zustand 5 for state management
- React Hook Form + Zod for form validation
- Recharts for financial visualizations
- SWR + Convex React for data fetching

**Backend:**

- Convex (serverless backend-as-a-service)
- Better-Auth with Google OAuth
- Stripe for payments
- Azure OpenAI for AI insights
- Resend for transactional emails

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth pages (signin, signup, password reset)
│   ├── (marketing)/       # Public marketing pages
│   ├── dashboard/         # Protected dashboard pages
│   │   ├── simulator/[planId]/  # Main financial simulator UI
│   │   ├── insights/      # AI insights generation
│   │   └── compare/       # Multi-plan comparison
│   ├── settings/          # User account settings
│   ├── api/auth/[...all]/ # Better-Auth API routes
│   └── layout.tsx         # Root layout with providers
├── components/
│   ├── ui/                # Reusable UI components
│   ├── layout/            # Layout components (sidebar, navbar, main-area)
│   ├── catalyst/          # Catalyst design system components
│   └── providers/         # React context providers
├── hooks/                 # Custom React hooks (18 hooks)
├── lib/
│   ├── auth-server.ts     # Better-Auth server config
│   ├── auth-client.ts     # Better-Auth client setup
│   ├── stores/            # Zustand stores
│   │   └── simulator-store.ts  # Global simulator state
│   ├── schemas/           # Zod validation schemas
│   │   ├── inputs/        # Form input schemas
│   │   ├── finances/      # Asset/liability schemas
│   │   └── tables/        # Table data schemas
│   ├── calc/              # Financial calculation engine
│   │   ├── simulation-engine.ts  # Main simulation runner
│   │   ├── portfolio.ts   # Portfolio calculations
│   │   ├── taxes.ts       # Tax calculations
│   │   ├── returns-providers/  # Different return strategies
│   │   ├── data-extractors/    # Extract data from simulations
│   │   └── analysis/      # Multi-simulation analysis
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── workers/           # Web Workers for heavy computation
└── convex-client-provider.tsx  # Convex + Better-Auth provider

convex/
├── schema.ts              # Database schema definition
├── auth.ts                # Auth queries/mutations
├── plans.ts               # Financial plan CRUD
├── finances.ts            # Asset/liability management
├── conversations.ts       # AI chat conversations
├── messages.ts            # Chat messages with AI
├── insights.ts            # AI insights generation
├── betterAuth/            # Better-Auth integration
├── validators/            # Convex validators (mirror Zod schemas)
└── templates/             # Default plan templates
```

### Path Aliases

- `@/*` → `src/*`
- `@/convex/*` → `convex/*` (for importing generated Convex code)

### State Management (Zustand)

The app uses a single Zustand store in `src/lib/stores/simulator-store.ts`:

```typescript
// Global state persisted to localStorage
{
  results: {
    selectedPercentile,
    simulationMode,
    chartTimeframe
  },
  preferences: {
    isSidebarOpen,
    referenceLines
  },
  chat: {
    selectedConversationId
  },
  insights: {
    selectedPlanId
  }
}
```

- Uses Immer middleware for immutable updates
- Persistence middleware for localStorage sync
- Redux DevTools integration in development

### Authentication Flow (Better-Auth + Convex)

- Better-Auth provides auth framework with Google OAuth
- Session management with JWT strategy
- Role-based access control (user roles in DB)
- Rate limiting on sensitive operations (password reset, email change)
- Email service via Resend
- Stripe integration for subscription management

**Key files:**

- `src/lib/auth-server.ts` - Server-side auth setup
- `src/lib/auth-client.ts` - Client-side auth hooks
- `convex/auth.ts` - Auth queries/mutations
- `src/app/api/auth/[...all]/route.ts` - Auth API handler

### Database Schema (Convex)

**Plans table:**

- User financial plans with timeline, incomes, expenses, accounts
- Market assumptions (stock/bond returns, inflation)
- Tax settings (filing status)
- Simulation settings
- Privacy settings

**Finances table:**

- User assets and liabilities
- Separate from plans for reusability

**Conversations table:**

- AI chat conversations per plan
- System prompts and metadata

**Messages table:**

- Chat messages with author (user/assistant/system)
- Token usage tracking

**Insights table:**

- AI-generated financial insights per plan
- Token usage and processing time

**Indexes:**

- Plans: `by_userId`
- Finances: `by_userId`
- Conversations: `by_planId_and_updatedAt`
- Messages: `by_conversationId`, `by_userId`
- Insights: `by_planId_and_updatedAt`

### Financial Simulation Engine

The core calculation engine lives in `src/lib/calc/`:

**Main entry point:** `simulation-engine.ts`

- Takes `SimulatorInputs` (validated by Zod)
- Returns `SimulationResult` with time-series data
- Supports multiple simulation modes:
  - Fixed returns (deterministic)
  - Stochastic returns (random normal distribution)
  - Historical backtest (LCG algorithm)
  - Monte Carlo variations

**Core modules:**

- `portfolio.ts` - Portfolio value tracking, rebalancing
- `account.ts` - Individual account transactions
- `taxes.ts` - Income tax, capital gains, Social Security tax
- `incomes.ts` - Income processing with inflation
- `expenses.ts` - Expense tracking with inflation
- `contribution-rules.ts` - Investment contribution logic
- `returns.ts` - Return calculations from different providers

**Data extraction:**

- `key-metrics-extractor.ts` - Success rate, retirement age, bankruptcy detection
- `chart-data-extractor.ts` - Time-series for charts
- `table-data-extractor.ts` - Year-by-year breakdown

**Web Workers:**

- `simulation.worker.ts` - Offload heavy calculations to background thread
- `merge.worker.ts` - Merge multiple simulation results
- Uses Comlink for cross-thread communication

### Validation Architecture

The app uses parallel validation layers:

1. **Frontend (Zod):** `src/lib/schemas/inputs/`
   - Form validation with React Hook Form
   - Type inference: `type SimulatorInputs = z.infer<typeof simulatorSchema>`

2. **Backend (Convex):** `convex/validators/`
   - Runtime validation before DB operations
   - Mirrors Zod schemas

3. **Transformers:** `convex-to-zod-transformers.ts`
   - Converts Convex DB objects to Zod-validated frontend types

### Custom Hooks Pattern

The app has 18 custom hooks in `src/hooks/`:

**Data fetching:**

- `use-convex-data.ts` - Wrapper hooks for all Convex queries
- `use-selected-plan-id.ts` - Global plan selection state
- `use-regen-simulation.ts` - Trigger simulation recalculation

**Common pattern:**

```typescript
// Custom hook wrapping Convex query
export function useCurrentUser() {
  return useQuery(api.auth.currentUser);
}
```

### Styling Architecture

- **Tailwind CSS v4** with modern `@import "tailwindcss"` syntax
- Prettier automatically sorts Tailwind classes via `prettier-plugin-tailwindcss`
- Global styles in `src/app/globals.css` with CSS custom properties for theming
- Catalyst UI component library for design consistency
- Headless UI and Radix UI for accessible components
- `clsx` and `tailwind-merge` via `cn()` utility for conditional classes

### AI Integration

**Chat conversations:**

- System prompts stored per conversation
- Messages with token usage tracking (input/output/total)
- Streaming responses from Azure OpenAI

**Insights generation:**

- AI-powered financial analysis
- Markdown export for analysis reports
- System prompts for different insight types

**Key files:**

- `convex/conversations.ts` - Conversation management
- `convex/messages.ts` - Message CRUD with AI
- `convex/insights.ts` - Insight generation

### Component Organization

**Layout pattern:**

- Desktop/mobile variants for responsive design
- `MainArea` wrapper with optional secondary column
- `Sidebar` with role-based auth display

**Component types:**

- `ui/` - Reusable primitives (buttons, inputs, cards)
- `layout/` - Page structure components
- `catalyst/` - Design system components
- Feature-specific components in page directories

### TypeScript Configuration

- Strict mode enabled with incremental compilation
- Path aliases: `@/*` → `src/*`, `@/convex/*` → `convex/*`
- React 19 types with overrides for compatibility
- Separate `tsconfig.json` for Convex backend

## Development Workflow

### Adding a New Feature

1. **Define schema:** Add Zod schema in `src/lib/schemas/`
2. **Add Convex validator:** Mirror in `convex/validators/`
3. **Update DB schema:** Modify `convex/schema.ts`
4. **Create queries/mutations:** Add in relevant `convex/*.ts` file
5. **Add custom hook:** Wrap query in `src/hooks/use-convex-data.ts`
6. **Build UI:** Create components in `src/components/`
7. **Add page:** Create route in `src/app/`

### Working with Forms

1. Define Zod schema in `src/lib/schemas/inputs/`
2. Use React Hook Form with `@hookform/resolvers/zod`
3. Submit to Convex mutation with validation

```typescript
const schema = z.object({ name: z.string() });
const form = useForm({ resolver: zodResolver(schema) });
const mutation = useMutation(api.plans.update);
```

### Running Simulations

1. Inputs validated by Zod schema
2. Passed to `simulation-engine.ts`
3. Heavy computation offloaded to Web Worker
4. Results extracted by data extractors
5. Charts/tables rendered from extracted data

### Testing Locally

```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Convex
npm run dev:convex

# Terminal 3: Run tests
npm run test
```

## Important Notes

- Generated Convex code in `convex/_generated/` should never be edited
- Always validate inputs with Zod before passing to calculation engine
- Use Web Workers for simulations to keep UI responsive
- Pre-commit hooks will auto-format code - don't bypass with `--no-verify`
- Convex functions are serverless - keep them fast and focused
- Better-Auth sessions are JWT-based - check auth state client-side
- Stripe webhooks handled in Convex for subscription events

## Key Dependencies to Know

- **convex** - Backend-as-a-service with real-time sync
- **better-auth** - Auth framework with OAuth and session management
- **zustand** - Lightweight state management
- **zod** - Schema validation and type inference
- **recharts** - Chart library for financial visualizations
- **react-hook-form** - Form state management with validation
- **stripe** - Payment processing
- **@azure/openai** - AI insights generation
- **@dnd-kit** - Drag-and-drop for UI interactions
- **next-themes** - Dark mode support
