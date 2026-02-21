# User Feedback

Collected from Discord (Feb 2026).

---

## HSA family plan limits not supported

The engine only models individual HSA coverage ($4,400 / $5,400 catch-up). IRS Notice 2025-67 also defines $8,750 for family coverage, which is not currently available.

## HSA employer flat contribution can't be modeled

Employer match on an HSA requires employee contributions to trigger. There is no way to model a flat employer contribution that is deposited regardless of employee activity.

## Pre-tax expenses not supported

Insurance premiums, FSA contributions, and other payroll deductions that reduce gross income before taxes are not modeled. All expenses are currently treated as post-tax.

## Income/expense section naming and ordering

The "Net Worth" label on the sidebar section is confusing; users expect to see incomes and expenses there. Items appear in insertion order rather than chronologically.

## No way to model income/expense changes over time without separate entries

A single income or expense cannot step up or down at a future date. Users must create multiple entries with different timeframes to approximate salary raises, benefit changes, etc.

## Mortgage/debt extra payment modeling not supported

There is no way to specify extra principal payments on a debt beyond the fixed monthly payment. Users who want to model accelerated payoff have no mechanism to do so.

## Cash flow Sankey diagram request

Users want a Sankey-style visualization showing how income flows through taxes, expenses, contributions, and savings in a single view.

## Real financial account connections

Support linking real brokerage and bank accounts via Plaid or a similar aggregation service so that portfolio balances, holdings, and transactions can sync automatically instead of requiring manual entry.

## Simulation engine documentation

Publish documentation explaining how the simulation engine works — the Monte Carlo methodology, historical backtesting approach, tax modeling, and withdrawal strategies — including how it compares to and differs from tools like ProjectionLab.

## Loading indicators never resolve on Safari (self-hosted)

On the self-hosted version of the app running in Safari, skeleton/shimmer loading states sometimes persist indefinitely and never transition to the loaded content.

## Configurable semantic milestones for simulation events

Allow users to define named milestones (e.g., "At Retirement", "Kids Leave Home") and attach simulation events to them. This would let income changes, expense adjustments, and contribution rules reference milestones rather than hard-coded dates, so updating one milestone cascades to all linked events.

## Support for local LLMs as an alternative to Azure OpenAI

Allow users to point the AI insights and chat features at a local LLM backend (e.g., Ollama, llama.cpp) instead of requiring an Azure OpenAI deployment, giving self-hosted users a fully offline option.

## Direct income-to-account routing

Support directing a specific income stream into a designated account without it passing through the general cash flow. This would enable modeling scenarios like an employer HSA contribution that deposits directly into an HSA regardless of employee contributions, or an employer match that flows straight into a 401(k).

## Contribution phase-outs at income thresholds

The contribution engine enforces annual dollar limits by account type and age but has no MAGI awareness. Roth IRA contributions should phase out and become disallowed above income thresholds, and traditional IRA deductibility should phase out if covered by a workplace plan. `calculateContribution` already receives `incomesData`, so MAGI can be approximated without a circular dependency.

## Expanded tax support

See [tax-support-roadmap.md](./tax-support-roadmap.md) for the full breakdown of planned and backlog tax features with difficulty ratings and architecture notes.

## Automatically liquidate physical assets to avoid bankruptcy

When investment accounts are fully depleted and the engine records a shortfall (`outstandingShortfall` in `PortfolioProcessor`), physical assets with positive equity are never considered as a fallback funding source. Sales are currently date-driven only (`shouldSellThisPeriod` checks user-configured `saleDate` TimePoints), and the withdrawal order in `getWithdrawalOrder` only includes investment account types. Since sale proceeds already flow into `netCashFlow` when a scheduled sale occurs, the plumbing exists — but there is no mechanism to trigger an unscheduled liquidation of physical assets when the portfolio can no longer cover expenses.
