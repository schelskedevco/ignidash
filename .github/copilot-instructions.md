# Copilot Instructions — Ignidash

You are coding Ignidash, a Next.js 16 personal finance app with Convex backend.

## Hook Usage Rules

Prefer these custom hooks over raw APIs:

| Instead of this...                           | Use this hook                            | Import                                |
| -------------------------------------------- | ---------------------------------------- | ------------------------------------- |
| `useQuery(api.plans.getPlan, ...)`           | `usePlanData()`                          | `@/hooks/use-convex-data`             |
| `useQuery(api.income.getAll, ...)`           | `useIncomesData()`                       | `@/hooks/use-convex-data`             |
| `useQuery(api.account.getAll, ...)`          | `useAccountsData()`                      | `@/hooks/use-convex-data`             |
| `useQuery(api.expense.getAll, ...)`          | `useExpensesData()`                      | `@/hooks/use-convex-data`             |
| `useQuery(api.debt.getAll, ...)`             | `useDebtsData()`                         | `@/hooks/use-convex-data`             |
| `useQuery(api.market_assumptions.get, ...)`  | `useMarketAssumptionsData()`             | `@/hooks/use-convex-data`             |
| `useQuery(api.timeline.get, ...)`            | `useTimelineData()`                      | `@/hooks/use-convex-data`             |
| `useQuery(api.simulation_settings.get, ...)` | `useSimulationSettingsData()`            | `@/hooks/use-convex-data`             |
| `useQuery(api.contribution_rules.get, ...)`  | `useContributionRulesData()`             | `@/hooks/use-convex-data`             |
| `useQuery(api.glide_path.get, ...)`          | `useGlidePathData()`                     | `@/hooks/use-convex-data`             |
| `useQuery(api.tax_settings.get, ...)`        | `useTaxSettingsData()`                   | `@/hooks/use-convex-data`             |
| Hardcoding plan ID from params               | `useSelectedPlanId()`                    | `@/hooks/use-selected-plan-id`        |
| Writing raw `matchMedia`                     | `useIsMobile()`                          | `@/hooks/use-mobile`                  |
| Manual `next-themes` usage for toggle        | `useThemeSwitcher()`                     | `@/hooks/use-theme-switcher`          |
| Writing "re-run" logic manually              | `useRegenSimulation()`                   | `@/hooks/use-regen-simulation`        |
| Manual `useEffect` for mount check           | `useMounted()`                           | `@/hooks/use-mounted`                 |
| Manual outside-click listeners               | `useClickDetection(onOutside, onInside)` | `@/hooks/use-outside-click`           |
| Tracking previous value manually             | `usePrevious(value)`                     | `@/hooks/use-previous`                |
| Manual chart color logic                     | `useChartTheme()`                        | `@/hooks/use-chart-theme`             |
| Manual data slicing for charts               | `useChartDataSlice(data, type)`          | `@/hooks/use-chart-data-slice`        |
| Manual x-axis tick calculation               | `useChartInterval(dataLength)`           | `@/hooks/use-chart-interval`          |
| Managing notification state manually         | `useSuccessNotification()`               | `@/hooks/use-success-notification`    |
| Writing scroll-preservation logic            | `useScrollPreservation()`                | `@/hooks/use-scroll-preserving-state` |
| Building sidebar nav manually                | `useNavigationItems()`                   | `@/hooks/use-sidebar-navigation`      |
| Writing copy-link logic manually             | `useLinkSharing()`                       | `@/hooks/use-link-sharing`            |

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4
- **Backend:** Convex (serverless DB + functions)
- **Auth:** Better-Auth + Google OAuth
- **State:** Zustand 5 (with Immer, persist, devtools)
- **Charts:** Recharts 3
- **Forms:** React Hook Form + Zod 4
- **AI:** Azure OpenAI
- **Payments:** Stripe
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
npm run test:coverage    # Coverage report
npm run test:e2e         # Playwright e2e tests
```

## Path Aliases

- `@/*` → `src/*`
- `@/convex/*` → `convex/*`

## Routing (Next.js App Router)

- `src/app/(auth)/` — Sign in/up, password reset (public)
- `src/app/(marketing)/` — Home, pricing, about (public)
- `src/app/(legal)/` — Privacy, terms (public)
- `src/app/dashboard/` — Protected area: simulator, insights, compare
- `src/app/dashboard/simulator/[planId]/` — Main simulator view per plan
- `src/app/api/auth/` — Better-Auth API endpoints

## Convex Backend (`convex/`)

Key files:

- `plans.ts`, `account.ts`, `income.ts`, `expense.ts`, `debt.ts` — CRUD for financial entities
- `messages.ts`, `conversations.ts` — AI chat
- `insights.ts` — AI-generated insights
- `http.ts` — HTTP endpoints (Stripe webhooks)
- `utils/auth_utils.ts` — `getUserIdOrThrow(ctx)` for auth
- `validators/` — Input validators
- `_generated/` — Auto-generated types (do not edit)

### Convex Function Rules

Every Convex query/mutation MUST:

1. Import and call `getUserIdOrThrow(ctx)` at the top — throws `ConvexError` if unauthenticated
2. Validate all args with Convex validators (`v.object()`, `v.union()`, etc.)
3. Throw `ConvexError` (not `Error`) for user-facing errors
4. Use `patchPlanWithSnapshot(ctx, planId, patch)` before mutations to enable undo
5. Use `getPlanForCurrentUserOrThrow(ctx, planId)` for plan-specific operations

Migration pattern: Use `@convex-dev/migrations`. NEVER remove old migration entries — always append new ones.

## Currency Formatting

- `formatCurrency(amount, {cents?})` from `@/lib/utils/format-currency` — Full display ($1,234,567)
- `formatCompactCurrency(amount, digits)` — Compact ($1.5M, $200k)
- `formatNumber()` from `@/lib/utils` — only for non-currency values (percentages, plain numbers)

## Code Style

- Prettier: single quotes, semicolons, trailing commas (ES5), 140 char width, Tailwind class sorting
- ESLint: flat config (ESLint 9), extends `next/core-web-vitals` + `next/typescript` + `prettier`
- Unused variables: underscore prefix allowed (e.g., `_unused`)
- `'use client'` for all interactive components

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

## Self-Documentation Rule

When creating a new file in `src/hooks/`, you MUST also update both:

1. `CLAUDE.md` — Add the hook to the Hooks section with description + import path
2. `.github/copilot-instructions.md` — Add it to the table above with the "instead of" pattern

Similarly, when creating new notable files, components, patterns, or conventions, update both `CLAUDE.md` and `.github/copilot-instructions.md` to document them.

If you find yourself performing the same multi-step task repeatedly (e.g., scaffolding a new page with the three-column layout, or creating a Convex mutation with all boilerplate), consider packaging it as a VS Code Skill in `.github/skills/<name>/SKILL.md` so it can be invoked via `/` slash commands.

## State Management

Use Zustand store selectors from `@/lib/stores/simulator-store` (not raw setState):

- `useSimulationStatus()`, `useChartTimeFrameToShow()`, etc. — prefer individual selectors
- ✅ `const status = useSimulationStatus()` — correct
- ❌ `const { simulationStatus } = useSimulatorStore()` — avoid destructuring
- Actions accessed via `useActions()?.regenerateResults`

## UI Conventions

- All interactive components are `'use client'`
- Use shadcn/ui components from `@/components/ui/` and Catalyst from `@/components/catalyst/`
- Format currency with `formatCurrency()` from `@/lib/utils/format-currency`
- Format non-currency numbers with `formatNumber()` from `@/lib/utils`
- Prettier: single quotes, semicolons, trailing commas (ES5), 140 char width

## Page Layout Pattern

Every simulator page uses the three-column responsive layout:

```tsx
<MainArea>
  <MobileMainArea />
  <DesktopMainArea />
</MainArea>
<SecondaryColumn>
  <DesktopSecondaryColumnArea />
</SecondaryColumn>
```

- `MainArea` from `@/components/layout/main-area`
- `SecondaryColumn` from `@/components/layout/secondary-column`

## Dialog Pattern

Use Catalyst dialog for modals:

```tsx
<Dialog size="xl" open={open} onClose={() => setOpen(false)}>
  <DialogTitle onClose={() => setOpen(false)}>Title</DialogTitle>
  <DialogBody>Content</DialogBody>
  <DialogActions>Buttons</DialogActions>
</Dialog>
```
