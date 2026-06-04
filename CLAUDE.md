# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ignidash is an open-source personal financial planning app (AGPL-3.0). It runs Monte Carlo simulations, historical backtesting, US tax estimation, and AI chat/insights for retirement planning.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend:** Convex (serverless DB + functions)
- **Auth:** Better-Auth with Convex integration + Google OAuth
- **Payments:** Stripe
- **AI:** Azure OpenAI (streaming chat + insights)
- **State:** Zustand 5 (with Immer, persist, devtools)
- **Forms:** React Hook Form + Zod 4 validation
- **Charts:** Recharts 3
- **Analytics:** PostHog

## Commands

```bash
npm run dev              # Next.js dev server
npm run dev:convex       # Local Convex backend (run alongside dev)
npm run build            # Production build
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format all
npm run typecheck        # TypeScript check (tsc --noEmit)

# Testing
npm run test             # Vitest watch mode
npm run test:once        # Vitest single run
npm run test:once -- src/lib/calc/__tests__/taxes.test.ts  # Run single test file
npm run test:coverage    # Coverage report
npm run test:e2e         # Playwright e2e tests
```

## Pre-commit Hooks

Husky runs `lint-staged` on commit, which auto-runs `eslint --fix` + `prettier --write` on staged `.js/.jsx/.ts/.tsx` files and `prettier --write` on `.json/.md/.css`. Files in `convex/_generated/` are excluded.

## CI/CD

- `test.yml` — Runs on PR to `main`: checkout → setup Node → run tests
- `docker-publish.yml` — Runs on push to `main` or `v*` tags: builds Docker image, publishes to GHCR
- Manual dispatch supports `skip_tests` input

## Path Aliases

- `@/*` → `src/*`
- `@/convex/*` → `convex/*`

## Architecture

### Routing (Next.js App Router)

- `src/app/(auth)/` — Sign in/up, password reset (public)
- `src/app/(marketing)/` — Home, pricing, about (public)
- `src/app/(legal)/` — Privacy, terms (public)
- `src/app/dashboard/` — Protected area: simulator, insights, compare
- `src/app/dashboard/simulator/[planId]/` — Main simulator view per plan
- `src/app/api/auth/` — Better-Auth API endpoints

### Convex Backend (`convex/`)

All server functions (queries, mutations, actions) live here. Key files:

- `plans.ts`, `account.ts`, `income.ts`, `expense.ts`, `debt.ts` — CRUD for financial entities
- `messages.ts`, `conversations.ts` — AI chat
- `insights.ts` — AI-generated insights
- `http.ts` — HTTP endpoints (Stripe webhooks)
- `utils/auth_utils.ts` — `getUserIdOrThrow(ctx)` for auth in every query/mutation
- `utils/sys_prompt_utils.ts` — Dynamic AI system prompt from plan data
- `validators/` — Input validators for Convex functions
- `_generated/` — Auto-generated types and API (do not edit)
- `betterAuth/_generated/` — Auto-generated auth types (do not edit)

### Convex Function Rules

Every Convex query/mutation MUST:

1. Import and call `getUserIdOrThrow(ctx)` at the top — throws `ConvexError` if unauthenticated
2. Validate all args with Convex validators (`v.object()`, `v.union()`, etc.)
3. Throw `ConvexError` (not `Error`) for user-facing errors
4. Use `patchPlanWithSnapshot(ctx, planId, patch)` before mutations to enable undo
5. Use `getPlanForCurrentUserOrThrow(ctx, planId)` for plan-specific operations

Migration pattern: Use `@convex-dev/migrations`. NEVER remove old migration entries — always append new ones.

### Simulation Engine (`src/lib/calc/`)

The core financial simulator runs month-by-month loops producing yearly `SimulationDataPoint`s:

- `simulation-engine.ts` — `FinancialSimulationEngine` orchestrates the loop
- `portfolio.ts`, `account.ts`, `incomes.ts`, `expenses.ts`, `taxes.ts`, `debts.ts` — Per-domain calculation modules
- `returns-providers/` — Strategy pattern: `FixedReturnsProvider`, `StochasticReturnsProvider`, `LcgHistoricalBacktestReturnsProvider`
- `data-extractors/` — Extract chart data, table data, key metrics from simulation results
- `__tests__/` — Unit tests for the engine

### Web Workers (`src/lib/workers/`)

Heavy simulation work runs off-main-thread via Comlink:

- `simulation-worker-api.ts` — Worker pool management
- `simulation.worker.ts` — Runs individual simulations
- `merge-worker-api.ts` / `merge.worker.ts` — Aggregates multi-simulation results

### State Management (`src/lib/stores/simulator-store.ts`)

Single Zustand store (`useSimulatorStore`) with slices: `results`, `preferences`, `chat`, `insights`, `nux`, `numbers`. Uses Immer middleware for mutable updates. Only `preferences` and `nux` are persisted to localStorage.

**Selector pattern**: Use individual selector hooks (not destructuring):

- ✅ `const status = useSimulationStatus()` — individual exported selector
- ❌ `const { simulationStatus } = useSimulatorStore()` — avoid destructuring
- Actions accessed via `useActions()?.regenerateResults` (nested under `actions` slice)

### Data Flow Pattern

1. Convex queries fetched via hooks in `src/hooks/use-convex-data.ts` (wraps `useQuery`)
2. Data transformed from Convex documents → Zod types via `src/lib/utils/data-transformers.ts` using `xFromConvex()` functions (wrapped in `useMemo`)
3. Zod-validated inputs fed into simulation engine
4. Results extracted by data extractors into chart/table/metric data
5. SWR used for derived data caching (multi-simulation analysis)

### SWR Cache & Worker Architecture

Two-level SWR cache for simulation results:

- **Level 1**: `['simulationHandle', planId, simulationSeed, simulationMode]` → merged worker results
- **Level 2**: `['derived', handle, sortMode]` → analysis, tableData, chartData, keyMetrics
- Options: `revalidateOnFocus: false`, `revalidateIfStale: false`, `revalidateOnReconnect: false`
- Worker pool: 500 simulations → distributed across workers in 10-sim chunks via Comlink
- Merge worker aggregates all results into single dataset
- Cache cleared via `mutate(() => true, undefined, { revalidate: false })` before regeneration

### Schemas & Validation (`src/lib/schemas/`)

- `inputs/simulator-schema.ts` — Root `SimulatorInputs` type composing all sub-schemas
- `inputs/` — Per-domain form schemas (income, account, expense, etc.)
- `finances/` — Financial object schemas
- `tables/` — Table row schemas

### Hooks (`src/hooks/`)

~25 custom hooks. Always use these instead of raw Convex/React APIs. Listed by category:

**Data Fetching** (from `use-convex-data.ts`)

- `usePlanData()` → plan with simulator inputs
- `usePlanName()` → just the plan name
- `useIncomesData()` → all incomes
- `useExpensesData()` → all expenses
- `useAccountsData()` → all accounts
- `useDebtsData()` → all debts
- `usePhysicalAssetsData()` → physical assets
- `useMarketAssumptionsData()` → return rate assumptions
- `useTimelineData()` → timeline events
- `useSimulationSettingsData()` → simulation config
- `useAllSimulationSettingsData()` → all settings across plans
- `useContributionRulesData()` → contribution rules
- `useGlidePathData()` → glide path allocations
- `useTaxSettingsData()` → tax settings
- `useConversationsData()`, `useMessagesData()` → AI chat data
- `useInsightsData()` → AI insights

**State & Interaction**

- `useSelectedPlanId()` → plan ID from route params (`@/hooks/use-selected-plan-id`)
- `useResultsState(startAge)` → age selector for simulation results (`@/hooks/use-results-state`)
- `useRegenSimulation()` → "re-run" button logic + random seed (`@/hooks/use-regen-simulation`)
- `useActiveSeed()` → resolves active simulation seed from table/percentile (`@/hooks/use-active-seed`)
- `useUndoPlanChange()` → Ctrl+Z undo for plan changes (`@/hooks/use-undo-plan-change`)
- `useNavigationItems()` → sidebar nav items with auth-aware visibility (`@/hooks/use-sidebar-navigation`)
- `useLinkSharing()` → copy link button with checkmark feedback (`@/hooks/use-link-sharing`)

**UI Utilities**

- `useIsMobile()` → mobile breakpoint (768px) detection (`@/hooks/use-mobile`)
- `useMounted()` → hydration-safe client-side check (`@/hooks/use-mounted`)
- `useThemeSwitcher()` → dark/light toggle icon + label (`@/hooks/use-theme-switcher`)
- `useClickDetection()` → inside/outside click tracking (`@/hooks/use-outside-click`)
- `usePrevious(value)` → previous value ref (`@/hooks/use-previous`)
- `useSuccessNotification()` → auto-dismissing toast state (`@/hooks/use-success-notification`)
- `useScrollPreservation()` → maintain scroll position across state updates (`@/hooks/use-scroll-preserving-state`)

**Charting** (Recharts)

- `useChartDataSlice(data, type)` → slice data by time frame (`@/hooks/use-chart-data-slice`)
- `useChartInterval(dataLength)` → x-axis tick spacing (`@/hooks/use-chart-interval`)
- `useChartTheme()` → dark/light color palette for charts (`@/hooks/use-chart-theme`)
- `useUniqueChartItems(data, extractor)` → deduplicated chart legend items (`@/hooks/use-unique-chart-items`)
- `usePayoffEstimate(params)` → debt payoff month estimate (`@/hooks/use-payoff-estimate`)

**Auth & Misc**

- `useBetterAuthField()` → per-field loading/error state for settings (`@/hooks/use-better-auth-field`)
- `usePostHogIdentify()` → PostHog user identification (`@/hooks/use-posthog-identify`)
- `useRedirectUrl()` → safe redirect URL from search params (`@/hooks/use-redirect-url`)
- `useLinkableFinances(items, syncedIds, typeFilter)` → filter linkable finance items (`@/hooks/use-linkable-finances`)
- `useAlreadySyncedIds(items, syncIdKey)` → collect synced entity IDs (`@/hooks/use-already-synced-ids`)
- `useDataViewSelectHandler()` → select change handler for data views (`@/hooks/use-data-view-select`)

## Hook Usage Rules

When generating components or pages, follow these rules:

1. **NEVER** use raw `useQuery(api.xxx, ...)` directly — always use the corresponding hook from `use-convex-data.ts`.
2. **NEVER** hardcode plan IDs — use `useSelectedPlanId()` to read from route params.
3. **ALWAYS** use `useIsMobile()` for responsive/mobile-specific UI.
4. **ALWAYS** use `useThemeSwitcher()` for dark/light toggle buttons.
5. **ALWAYS** use `useMounted()` before accessing browser APIs in SSR context.
6. **ALWAYS** use `useRegenSimulation()` for any "regenerate" or "re-run" simulation button.
7. **ALWAYS** use `useChartTheme()` for Recharts color values.
8. **ALWAYS** use `useChartDataSlice()` to respect user's time frame preference on chart data.

## Self-Documentation Rule

**IMPORTANT**: Whenever you create a new hook in `src/hooks/`, update this CLAUDE.md file:

1. Add the new hook to the appropriate category above
2. Include a one-line description of what it does
3. List its import path

You MUST also update `.github/copilot-instructions.md` — add the new hook to the "Instead of this..." table with the same pattern.

Similarly, if you create a new notable file, component, pattern, or convention, document it in both `CLAUDE.md` and `.github/copilot-instructions.md`.

If you find yourself performing the same complex multi-step task repeatedly (e.g., scaffolding a new page with the full layout, or creating a Convex function with all boilerplate), consider packaging it as a VS Code Skill in `.github/skills/<name>/SKILL.md` so it can be invoked via `/` slash commands.

### Simulator Page Pattern

Every simulator page uses a **three-column responsive layout**:

```tsx
<MainArea>
  <MobileMainArea />        // Shown on small screens (sm breakpoint)
  <DesktopMainArea />       // Shown on desktop (hidden <xl)
</MainArea>
<SecondaryColumn>
  <DesktopSecondaryColumnArea />  // Sticky right sidebar (xl+)
</SecondaryColumn>
```

- `MainArea` from `@/components/layout/main-area` — responsive padding, `@container`
- `SecondaryColumn` from `@/components/layout/secondary-column` — sticky sidebar

### Dialog Pattern

Reusable Catalyst dialog:

```tsx
const [open, setOpen] = useState(false);
<Dialog size="xl" open={open} onClose={() => setOpen(false)}>
  <DialogTitle onClose={() => setOpen(false)}>Title</DialogTitle>
  <DialogDescription>Description</DialogDescription>
  <DialogBody>Content</DialogBody>
  <DialogActions>Buttons</DialogActions>
</Dialog>;
```

### Components

- `src/components/ui/` — shadcn/ui components (button, card, badge, skeleton, etc.)
- `src/components/catalyst/` — Catalyst UI library (dialog, table, fieldset, sidebar-layout, etc.)
- `src/components/layout/sidebar/` — Desktop and mobile sidebars
- `src/components/providers/` — Theme provider (next-themes wrapper)

### Currency Formatting

Centralized in `src/lib/config/currency.ts` and `src/lib/utils/format-currency.ts`:

- `formatCurrency(amount, {cents?})` — Full display ($1,234,567)
- `formatCompactCurrency(amount, digits)` — Compact ($1.5M, $200k)
- `getCurrencySymbol()` — Returns '$'
- `formatCurrencyPlaceholder(amount)` — Form placeholders

`formatNumber` in `src/lib/utils.ts` is only for non-currency values (percentages, plain numbers).

## Code Style

- Prettier: single quotes, semicolons, trailing commas (ES5), 140 char width, Tailwind class sorting
- ESLint: flat config (ESLint 9), extends `next/core-web-vitals` + `next/typescript` + `prettier`
- Unused variables: underscore prefix allowed (e.g., `_unused`)
- All components are `'use client'` unless explicitly server components

## Naming & Export Conventions

- **Default exports**: React components only
- **Named exports**: Everything else (hooks, utilities, types, validators)
- **File names**: kebab-case (`use-selected-plan-id.ts`, `desktop-sidebar.tsx`)
- **Component names**: PascalCase
- **Type names**: No I/T prefix — plain PascalCase (`Props`, not `IProps`; `SimulatorInputs`)
- **Validator files**: `*-validator.ts` pattern
- **Test files**: `*.test.ts` alongside source code
- **Hook files**: `use-*.ts` prefix

## Auth & AI Gating

- Subscription tiers: trial (7-day) → active (paid) → admin
- Token costs (micro-dollars): uncached input 1.75, cached input 0.175, output 14.0
- Usage limits: $1/day, $5/month for trials; $2.50/week → $5/month for active
- Rate limiters: 3 requests per 3 hours (password reset, email change, account deletion)
- AI function gating: check `getSubscriptionInfo()` + `checkUsageLimits()` before streaming
