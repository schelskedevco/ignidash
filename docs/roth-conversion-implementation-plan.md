# Roth Conversion Implementation Plan

## Overview

Roth conversions move funds from tax-deferred accounts (IRA, 401k, 403b) to Roth accounts (Roth IRA, Roth 401k, Roth 403b), with the converted amount taxed as ordinary income in the year of conversion. This is the #1 tax strategy for FIRE (the Roth conversion ladder) and is essential for competitive parity with Boldin, ProjectionLab, Pralana, and NewRetirement.

This plan starts with **user-specified conversion amounts** (annual fixed dollar amounts or bracket-filling). Optimization (MILP-based) is deferred to a later phase.

---

## Phase 1: Schema & Data Layer

### 1A: New Conversion Rule Schema (`src/lib/schemas/inputs/`)

Create `conversion-rule-schema.ts`:

```typescript
import { z } from 'zod';
import { currencyFieldForbidsZero, optionalCurrencyFieldAllowsZero } from '@/lib/utils/zod-utils';

export const conversionRuleSchema = z.object({
  id: z.string(),
  enabled: z.boolean().default(true),
  /** Name for display in the UI */
  name: z.string().min(1).max(50).default('Roth Conversion'),
  /** Source account ID (must be a tax-deferred account: 401k, 403b, ira) */
  sourceAccountId: z.string(),
  /** Target account ID (must be a Roth account: roth401k, roth403b, rothIra) */
  targetAccountId: z.string(),
  /** Start age/year for conversions */
  startTimePoint: z.discriminatedUnion('type', [
    z.object({ type: z.literal('immediate') }),
    z.object({ type: z.literal('customAge'), age: z.number().min(0).max(120) }),
    z.object({ type: z.literal('retirement') }),
  ]),
  /** End age/year for conversions (optional — runs indefinitely if omitted) */
  endTimePoint: z
    .discriminatedUnion('type', [
      z.object({ type: z.literal('customAge'), age: z.number().min(0).max(120) }),
      z.object({ type: z.literal('rmdAge') }),
    ])
    .optional(),
  /** How the conversion amount is determined */
  amount: z.discriminatedUnion('type', [
    // Fixed dollar amount each year
    z.object({ type: z.literal('fixedAmount'), dollarAmount: currencyFieldForbidsZero('Amount must be greater than 0') }),
    // Fill up to a target marginal tax bracket
    z.object({ type: z.literal('fillBracket'), targetBracket: z.number().min(0.1).max(0.37) }),
    // Convert the entire balance
    z.object({ type: z.literal('fullBalance') }),
  ]),
});

export type ConversionRuleInputs = z.infer<typeof conversionRuleSchema>;
```

### 1B: Update Simulator Schema

Add `conversionRules` to `src/lib/schemas/inputs/simulator-schema.ts`:

```typescript
import { conversionRuleSchema } from './conversion-rule-schema';

// In the simulatorSchema object:
conversionRules: z.array(conversionRuleSchema).default([]),
```

### 1C: Convex Validator

Create `convex/validators/conversion_rules_validator.ts`:

```typescript
import { v } from 'convex/values';

export const conversionRulesValidator = v.object({
  id: v.string(),
  enabled: v.boolean(),
  name: v.string(),
  sourceAccountId: v.string(),
  targetAccountId: v.string(),
  startTimePoint: v.union(
    v.object({ type: v.literal('immediate') }),
    v.object({ type: v.literal('customAge'), age: v.number() }),
    v.object({ type: v.literal('retirement') })
  ),
  endTimePoint: v.optional(
    v.union(
      v.object({ type: v.literal('customAge'), age: v.number() }),
      v.object({ type: v.literal('rmdAge') })
    )
  ),
  amount: v.union(
    v.object({ type: v.literal('fixedAmount'), dollarAmount: v.number() }),
    v.object({ type: v.literal('fillBracket'), targetBracket: v.number() }),
    v.object({ type: v.literal('fullBalance') })
  ),
});
```

### 1D: Update Convex Schema

In `convex/validators/plan_data_fields.ts`, add:

```typescript
import { conversionRulesValidator } from './conversion_rules_validator';

// In planDataFields:
conversionRules: v.array(conversionRulesValidator),
```

Also update `convex/schema.ts` — but of type `Doc<'plans'>['conversionRules']` is auto-generated, no manual schema change needed since `planDataFields` feeds into the table.

### 1E: Data Transformers

In `src/lib/utils/data-transformers.ts`, add:

```typescript
export function conversionRuleFromConvex(
  rule: Doc<'plans'>['conversionRules'][number]
): ConversionRuleInputs {
  return { ...rule };
}

export function conversionRuleToConvex(
  rule: ConversionRuleInputs
): Doc<'plans'>['conversionRules'][number] {
  return { ...rule };
}
```

Update `simulatorFromConvex` to include:

```typescript
const conversionRules = plan.conversionRules.map(conversionRuleFromConvex);
```

Update return to include `conversionRules`.

### 1F: Update Plan CRUD Mutations

Update `convex/plans.ts`:
- `createPlan`: Include empty `conversionRules: []` in defaults
- `upsertAccount` → no change needed (accounts are separate)
- Add new mutation `upsertConversionRule` (or handle via generic plan update)
- New mutation `deleteConversionRule`
- Include conversion rules in plan snapshot/restore

---

## Phase 2: Account Model Changes

### 2A: Track Conversion Basis in TaxFreeAccount

In `src/lib/calc/account.ts`, add conversion basis tracking to `TaxFreeAccount`:

```typescript
export class TaxFreeAccount extends InvestmentAccount {
  readonly taxCategory: TaxCategory = 'taxFree';
  private contributionBasis: number;
  /** Tracks the cumulative amount that has been converted into this account.
   *  Needed for 5-year aging rule enforcement. */
  private conversionBasis: number;

  constructor(data: AccountInputs & { type: RothAccountType }) {
    super(data);
    this.contributionBasis = data.contributionBasis ?? 0;
    this.conversionBasis = data.conversionBasis ?? 0;
  }

  getConversionBasis(): number {
    return this.conversionBasis;
  }

  /** Applies a conversion deposit (transfer from tax-deferred account) */
  applyConversion(amount: number, allocation: AssetAllocation): AssetFlows {
    const contributed = super.applyContributionShared(amount, 'self', allocation);
    this.conversionBasis += amount;
    return contributed;
  }

  /** Override applyWithdrawal to handle 5-year rule on converted amounts */
  applyWithdrawal(amount: number, type: WithdrawalType, withdrawalAllocation: AssetAllocation) {
    const contributionWithdrawn = Math.min(amount, this.contributionBasis);
    this.contributionBasis -= contributionWithdrawn;

    // After exhausting contribution basis, next withdraw from conversion basis
    const conversionWithdrawn = Math.min(amount - contributionWithdrawn, this.conversionBasis);
    this.conversionBasis -= conversionWithdrawn;

    // Remaining is earnings withdrawn
    const earningsWithdrawn = amount - contributionWithdrawn - conversionWithdrawn;
    this.cumulativeEarningsWithdrawn += earningsWithdrawn;

    const withdrawn = super.applyWithdrawalShared(amount, type, withdrawalAllocation);
    return { ...withdrawn, earningsWithdrawn: earningsWithdrawn + conversionWithdrawn, realizedGains: 0 };
  }
}
```

### 2B: Add conversionBasis to Account Schema

Update `accountFormSchema` in `src/lib/schemas/inputs/account-form-schema.ts`:

```typescript
// In the Roth discriminated union member:
z.object({
  ...investmentAccountSchema.shape,
  type: z.enum(['roth401k', 'roth403b', 'rothIra']),
  contributionBasis: optionalCurrencyFieldAllowsZero('Contribution basis cannot be negative'),
  conversionBasis: optionalCurrencyFieldAllowsZero('Conversion basis cannot be negative'),
}),
```

Update Convex `accounts_validator.ts`:

```typescript
conversionBasis: v.optional(v.number()),
```

Update data transformers.

### 2C: Add applyConversion to TaxDeferredAccount

In `src/lib/calc/account.ts`, `TaxDeferredAccount`:

```typescript
/** Withdraws funds for a Roth conversion (no tax impact at withdrawal time — tax paid at filing) */
applyConversion(amount: number, allocation: AssetAllocation): AssetFlows {
  // Mark this withdrawal for tax tracking but don't trigger withholding
  const withdrawn = super.applyWithdrawalShared(amount, 'regular', allocation);
  return withdrawn;
}
```

Conversions from tax-deferred accounts should NOT be treated as regular withdrawals (which trigger early withdrawal penalties). The conversion amount must be tracked separately so the tax processor can add it to ordinary income.

### 2D: Add `PortfolioSnapshotData` fields for conversion tracking

In `portfolio.ts`, add to the portfolio data types:

```typescript
// In PortfolioFlowData (within portfolio.ts):
conversionsFromTaxDeferred: number;
conversionsToRoth: number;

// In PortfolioSnapshotData (check the existing interface):
cumulativeConversionsFromTaxDeferred: number;
cumulativeConversionsToRoth: number;
```

---

## Phase 3: Simulation Engine — Roth Conversion Processor

### 3A: Create Conversion Rules Processor

New file `src/lib/calc/conversions.ts`:

```typescript
import type { ConversionRuleInputs } from '@/lib/schemas/inputs/conversion-rule-schema';
import type { SimulationState } from './simulation-engine';
import type { PortfolioData } from './portfolio';
import type { PhaseData } from './phase';
import { Account, TaxDeferredAccount, TaxFreeAccount } from './account';
import type { AssetFlows, AssetAllocation } from './asset';

export interface ConversionData {
  totalConverted: number;
  conversionsByRule: Record<string, number>;
  perAccountConversions: Record<string, {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
  }>;
}

export class ConversionProcessor {
  private annualConversionData: ConversionData = {
    totalConverted: 0,
    conversionsByRule: {},
    perAccountConversions: {},
  };

  constructor(private simulationState: SimulationState) {}

  processConversionRules(rules: ConversionRuleInputs[], phase: PhaseData | null): ConversionData {
    // Reset annual data
    this.annualConversionData = {
      totalConverted: 0,
      conversionsByRule: {},
      perAccountConversions: {},
    };

    const activeRules = rules.filter(rule => rule.enabled && this.isRuleActive(rule, phase));
    for (const rule of activeRules) {
      const fromAccount = this.simulationState.portfolio
        .getAccounts()
        .find(a => a.getAccountID() === rule.sourceAccountId) as TaxDeferredAccount | undefined;
      const toAccount = this.simulationState.portfolio
        .getAccounts()
        .find(a => a.getAccountID() === rule.targetAccountId) as TaxFreeAccount | undefined;

      if (!fromAccount || !toAccount) continue;
      if (fromAccount.getBalance() <= 0) continue;

      // Calculate conversion amount
      const conversionAmount = this.calculateConversionAmount(rule, fromAccount);

      if (conversionAmount <= 0) continue;
      if (fromAccount.getBalance() < conversionAmount) continue; // Skip if insufficient balance

      // Execute the conversion
      const allocation = this.getAllocation();

      // Withdraw from tax-deferred (tracked as conversion, not regular withdrawal)
      fromAccount.applyConversion(conversionAmount, allocation);

      // Deposit into Roth (tracked as conversion basis, not contribution)
      toAccount.applyConversion(conversionAmount, allocation);

      this.annualConversionData.totalConverted += conversionAmount;
      this.annualConversionData.conversionsByRule[rule.id] = conversionAmount;
      this.annualConversionData.perAccountConversions[rule.sourceAccountId] = {
        fromAccountId: rule.sourceAccountId,
        toAccountId: rule.targetAccountId,
        amount: conversionAmount,
      };
    }

    return this.annualConversionData;
  }

  private isRuleActive(rule: ConversionRuleInputs, phase: PhaseData | null): boolean {
    const age = this.simulationState.time.age;

    switch (rule.startTimePoint.type) {
      case 'immediate':
        break; // Always active from start
      case 'customAge':
        if (age < rule.startTimePoint.age) return false;
        break;
      case 'retirement':
        if (phase?.name !== 'retirement') return false;
        break;
    }

    if (rule.endTimePoint) {
      switch (rule.endTimePoint.type) {
        case 'customAge':
          if (age >= rule.endTimePoint.age) return false;
          break;
        case 'rmdAge':
          if (age >= this.simulationState.time.rmdAge) return false;
          break;
      }
    }

    return true;
  }

  private calculateConversionAmount(rule: ConversionRuleInputs, fromAccount: TaxDeferredAccount): number {
    switch (rule.amount.type) {
      case 'fixedAmount':
        return rule.amount.dollarAmount;
      case 'fullBalance':
        return fromAccount.getBalance();
      case 'fillBracket':
        return 0; // Placeholder — requires tax bracket lookup (see "Bracket-Filling" below)
    }
  }

  private getAllocation(): AssetAllocation {
    // Use the overall portfolio weighted allocation for conversions
    return this.simulationState.portfolio.getWeightedAssetAllocation() ?? { stocks: 0.6, bonds: 0.4, cash: 0 };
  }

  resetAnnualData(): void {
    this.annualConversionData = {
      totalConverted: 0,
      conversionsByRule: {},
      perAccountConversions: {},
    };
  }

  getAnnualData(): ConversionData {
    return this.annualConversionData;
  }
}
```

### 3B: Integrate into Simulation Engine

In `src/lib/calc/simulation-engine.ts`:

1. **Import** the `ConversionProcessor` and `ConversionRuleInputs` type
2. **Constructor**: Pass `conversionRules` to the engine (add to inputs)
3. **Init** the processor alongside other processors

```typescript
import { ConversionProcessor } from './conversions';
import type { ConversionRuleInputs } from '@/lib/schemas/inputs/conversion-rule-schema';

// In FinancialSimulationEngine:
private readonly conversionRules: ConversionRuleInputs[];

constructor(inputs: SimulatorInputs) {
  this.conversionRules = Object.values(inputs.conversionRules ?? []);
}

// In runSimulation:
const conversionProcessor = new ConversionProcessor(simulationState);
```

4. **Annual loop**: Process conversions after RMDs but before tax reconciliation:

```typescript
// In the annual block (when month % 12 === 0):
// Get annual data from processors
const annualPortfolioDataBeforeTaxes = portfolioProcessor.getAnnualData();

// Process Roth conversions (annual event)
const conversionData = conversionProcessor.processConversionRules(
  this.conversionRules,
  simulationState.phase
);
```

The conversion amount needs to flow into the tax processor as ordinary income. This is the critical integration point.

### 3C: Flow Conversion Amount Into Tax Processor

The conversion amount must be added to `incomeSourcesData.taxableRetirementDistributions` or as a separate `conversionIncome` field. This makes it taxed as ordinary income.

**Option A (Recommended — minimal changes):** Add a `conversionIncome` field to `IncomesData` that gets picked up by `TaxProcessor.getTaxableIncomeData()`.

In `incomes.ts` — `IncomesData` interface:

```typescript
export interface IncomesData {
  // ...existing fields...
  conversionIncome: number;
}
```

In `simulation-engine.ts`, after processing conversions:

```typescript
// Conversion amounts flow into income for tax calculation
annualIncomesData.conversionIncome = conversionData.totalConverted;
```

In `taxes.ts` — `getTaxableIncomeData()`:

```typescript
// Add conversion income to ordinary income
const conversionIncome = annualIncomesData.conversionIncome ?? 0;
const incomeTaxedAsOrdinaryExceptSocSec = earnedIncome + taxableRetirementDistributions + taxableInterestIncome + conversionIncome;
```

**Option B:** Pass `ConversionData` directly to `TaxProcessor.process()`. Cleaner but more parameter changes.

Both work. Option A is simpler. **Use Option A for the initial build.**

---

## Phase 4: Tax Processor Changes

### 4A: Add Conversion Income to Taxable Ordinary Income

In `src/lib/calc/taxes.ts`:

1. Add `conversionIncome` to `IncomeSourcesData` interface:

```typescript
export interface IncomeSourcesData {
  // ...existing fields...
  conversionIncome: number;
}
```

2. In `getTaxableIncomeData()`, after the existing line:

```typescript
const earnedIncome = totalIncomeFromIncomes - socialSecurityIncome - taxFreeIncome;
```

Add:

```typescript
const conversionIncome = annualIncomesData.conversionIncome ?? 0;
```

3. Add `conversionIncome` to the ordinary income total:

```typescript
const incomeTaxedAsOrdinaryExceptSocSec = earnedIncome + taxableRetirementDistributions + taxableInterestIncome + conversionIncome;
```

4. Return `conversionIncome` in the result object.

### 4B: Ensure Conversions Don't Trigger Early Withdrawal Penalties

Conversions from tax-deferred accounts should NOT incur the 10% early withdrawal penalty (IRS rules allow conversions regardless of age). The existing code applies penalties based on `age < regularQualifiedWithdrawalAge` to withdrawals identified in the portfolio data.

In `getTaxableIncomeData()`, the withdrawal tracking loops through accounts:

```typescript
case '401k':
case '403b':
case 'ira': {
  const annualWithdrawals = sumFlows(account.withdrawals);
  taxDeferredWithdrawals += annualWithdrawals;
  if (age < regularQualifiedWithdrawalAge) early401kAndIraWithdrawals += annualWithdrawals;
  break;
}
```

To avoid penalizing conversions, the `applyConversion()` method on `TaxDeferredAccount` should **not** increment `cumulativeWithdrawals` in the same way. Or we pass a separate flag. The cleanest approach: track conversion withdrawals separately in the account model.

### 4C: Track Conversion Withdrawals Separately

In `TaxDeferredAccount`:

```typescript
private cumulativeConversionWithdrawals: number = 0;

applyConversion(amount: number, allocation: AssetAllocation): AssetFlows {
  const withdrawn = super.applyWithdrawalShared(amount, 'regular', allocation);
  // Track separately to exclude from penalty calculations
  this.cumulativeConversionWithdrawals += amount;
  // Reverse the withdrawal tracking — conversions aren't ordinary withdrawals
  // Actually: the balance decreased, but we don't want it counted in taxable distributions
  // Better approach: tag withdrawals as conversion type
  return withdrawn;
}

getCumulativeConversionWithdrawals(): number {
  return this.cumulativeConversionWithdrawals;
}
```

Alternative approach: Don't use `applyWithdrawalShared` at all. Instead, directly manipulate balance:

```typescript
applyConversion(amount: number, allocation: AssetAllocation): AssetFlows {
  if (amount > this.balance) throw new Error('Insufficient funds for conversion');
  
  // Directly reduce balance without going through withdrawal tracking
  const currentBondsValue = this.balance * this.currPercentBonds;
  const currentStocksValue = this.balance * (1 - this.currPercentBonds);
  
  const bondWithdrawal = Math.min(amount * allocation.bonds, currentBondsValue);
  const stockWithdrawal = amount - bondWithdrawal;
  
  const newBondsValue = currentBondsValue - bondWithdrawal;
  const newStocksValue = currentStocksValue - stockWithdrawal;
  this.balance = newBondsValue + newStocksValue;
  this.currPercentBonds = this.balance > 0 ? newBondsValue / this.balance : this.currPercentBonds;
  
  // Update cumulative conversion tracking
  this.cumulativeConversionWithdrawals += amount;
  
  return { stocks: stockWithdrawal, bonds: bondWithdrawal, cash: 0 };
}
```

**This second approach is cleaner** — no risk of double-counting withdrawals in RMD tracking or penalty calculations.

### 4D: Exclude Conversions from Taxable Distributions

In `TaxProcessor.getTaxableIncomeData()`, when computing `taxableRetirementDistributions`, the conversion amounts are automatically excluded because `applyConversion()` doesn't increment `cumulativeWithdrawals`. The income from conversions enters taxation via the separate `conversionIncome` field.

---

## Phase 5: Portfolio Processor Changes

### 5A: Track Conversion Flows in Portfolio Data

In `portfolio.ts`, update `PortfolioFlowData`:

```typescript
export interface PortfolioFlowData {
  // ...existing fields...
  conversions: number;
  conversionsByAccount: Record<string, { from: number; to: number }>;
}
```

In `PortfolioProcessor.buildPortfolioData()`, add the conversion flow data.

### 5B: Conversion Ordering — When to Convert

Conversions should happen:
1. After RMDs (RMDs take priority)
2. Before tax settlement (so conversion income is included in the tax calculation)
3. Before regular withdrawal processing (conversions consume tax-deferred balance)

The order in the annual loop should be:

```typescript
// 1. Process RMDs (January)
if (simulationState.time.age >= simulationContext.rmdAge && simulationState.time.month % 12 === 1)
  portfolioProcessor.processRequiredMinimumDistributions();

// ... monthly income/expense processing ...

if (simulationState.time.month % 12 === 0) {
  // 2. Get annual portfolio data before taxes
  const annualPortfolioDataBeforeTaxes = portfolioProcessor.getAnnualData();

  // 3. Process Roth conversions (NEW)
  const conversionData = conversionProcessor.processConversionRules(this.conversionRules, simulationState.phase);
  annualIncomesData.conversionIncome = conversionData.totalConverted;

  // 4. Settle taxes (now includes conversion income)
  const { taxesData, portfolioData: annualPortfolioDataAfterTaxes, discretionaryExpense } = this.settleTaxes(
    taxProcessor, portfolioProcessor, annualPortfolioDataBeforeTaxes,
    annualIncomesData, annualReturnsData, annualPhysicalAssetsData
  );
  // ...
}
```

Note: There's a subtlety here. The conversion happens **_before_** tax settlement, which means:
- The portfolio balance is lower when we go into tax settlement
- The tax bill is higher (conversion income added)
- The tax settlement may need to withdraw from a portfolio that now has less tax-deferred value

This is correct behavior. The settleTaxes convergence loop handles the circular dependency (tax withdrawals → income → more tax).

---

## Phase 6: Data Extractor Changes

### 6A: Simulation Data Extractor

In `src/lib/calc/data-extractors/simulation-data-extractor.ts`, add conversion tracking to `CashFlowData`:

```typescript
export interface CashFlowData {
  // ...existing fields...
  conversionsToRoth: number;
}
```

Update extraction logic to read conversion data from portfolio data points.

### 6B: Chart Data Extractor

In `src/lib/calc/data-extractors/chart-data-extractor.ts`:

- Add conversion data to net worth chart (breakdown of Roth growth from conversions vs. contributions)
- Add conversion amount to cash flow chart (separate line item)
- New optional chart type: "Roth Conversions Over Time"

### 6C: Key Metrics Extractor

In `src/lib/calc/data-extractors/key-metrics-extractor.ts`:

- Add `lifetimeConversions` to metrics
- Add `totalRothBalanceAtRetirement` to metrics
- Add `taxSavingsFromConversions` metric (tax paid vs. tax avoided)

---

## Phase 7: UI

### 7A: Conversion Rules Dialog

Create `src/app/dashboard/simulator/[planId]/components/inputs/dialogs/conversion-rule-dialog.tsx`:

```tsx
'use client';

// Standard Catalyst dialog pattern
// Fields:
// - Name (text input)
// - Source account (select of TaxDeferredAccount types)
// - Target account (select of RothAccount types)
// - Start time (immediate / at custom age / at retirement)
// - End time (optional: custom age / at RMD age)
// - Amount type (fixed dollar / fill bracket / full balance)
// - If fixedAmount: dollar amount input
// - If fillBracket: target bracket dropdown (10%/12%/22%/24%/32%/35%/37%)
// - If fullBalance: no extra inputs

// Validation: source must be tax-deferred, target must be Roth
// Warning if source and target accounts for same employer type don't match
// (e.g., converting 401k → Roth IRA is fine, just warn user about tax implications)
```

### 7B: Conversion Rules List

Add to the "Financial Inputs" sidebar/manage area. Show a summary card per rule:

```
Roth Conversion #1
  $20,000/year · IRA → Roth IRA · Age 55–72
  [Edit] [Delete]
```

### 7C: Simulator Page Display

- Add "Conversions" section to the results view
- Show conversion amounts per year in the cash flow chart (new series)
- Show Roth balance breakdown: contributions vs. conversions vs. earnings in net worth chart
- Show in the key metrics panel estimated tax savings from conversions

### 7D: Bracket-Filling UX (Enhancement for Phase 1)

Bracket-filling is the most powerful conversion strategy but requires tax bracket lookups that depend on the tax calculation itself. For Phase 1:

- **Implement after fixed-amount conversions work**
- The conversion processor needs a reference to the tax processor (or marginal rates)
- Algorithm:
  1. Calculate taxes WITHOUT conversion
  2. Determine headroom in current marginal bracket: `bracket.max - taxableIncome`
  3. Convert up to that amount (but never exceed source account balance)
  4. Recalculate taxes with conversion included
  5. Verify the conversion didn't push into the next bracket beyond target

This creates a mutual dependency: conversion amount depends on tax bracket, tax bracket depends on conversion amount. Handle with iteration (similar to `settleTaxes`).

---

## Phase 8: Testing Strategy

### Unit Tests

1. **Account tests** (`convex/mutations.test.ts` adjacent):
   - `TaxFreeAccount.applyConversion()` increases conversion basis
   - Withdrawal ordering: contributions → conversion basis → earnings
   - 5-year aging rule enforcement (track conversion dates)
   - `TaxDeferredAccount.applyConversion()` reduces balance without affecting cumulative withdrawals

2. **ConversionProcessor tests**:
   - Fixed amount conversion executes correctly
   - Rule activation by age (start/end)
   - Rule activation by phase (retirement)
   - Insufficient balance → skip gracefully
   - Multiple rules execute in order
   - Full balance conversion works

3. **Tax processor tests**:
   - Conversion income added to ordinary income
   - No early withdrawal penalty on conversion amounts
   - Marginal bracket correctly calculated with conversion income
   - NIIT correctly applies to conversion income

4. **Integration tests** (`src/lib/calc/__tests__/`):
   - Full simulation year with conversion rule works
   - `settleTaxes` converges with conversion income included
   - Roth balance correctly separated into contribution basis, conversion basis, and earnings
   - Withdrawal from Roth after conversion respects basis ordering

### Existing Test Suite Impact

- `mutations.test.ts`: Update snapshot expectations to include `conversionRules: []`
- `plan_snapshots.test.ts`: Update snapshot expectations
- `taxes.test.ts`: Add test cases for conversion income taxation
- `chart-data-extractor.test.ts`: Update expected data shapes
- `key-metrics-extractor.test.ts`: Add conversion metrics

---

## Files Changed — Complete Checklist

### New Files
| File | Purpose |
|------|---------|
| `src/lib/schemas/inputs/conversion-rule-schema.ts` | Zod schema for conversion rules |
| `convex/validators/conversion_rules_validator.ts` | Convex validator for conversion rules |
| `src/lib/calc/conversions.ts` | Conversion processor engine |
| `src/app/dashboard/simulator/[planId]/components/inputs/dialogs/conversion-rule-dialog.tsx` | UI dialog |

### Modified Files — Convex Layer
| File | Changes |
|------|---------|
| `convex/validators/plan_data_fields.ts` | Add `conversionRules` field |
| `convex/validators/accounts_validator.ts` | Add `conversionBasis` field |
| `convex/plans.ts` | Include `conversionRules` in create/update |
| `convex/plan_snapshots.ts` | Include `conversionRules` in snapshots |

### Modified Files — Schema Layer
| File | Changes |
|------|---------|
| `src/lib/schemas/inputs/simulator-schema.ts` | Add `conversionRules` array |
| `src/lib/schemas/inputs/account-form-schema.ts` | Add `conversionBasis` to Roth accounts |

### Modified Files — Calc Engine
| File | Changes |
|------|---------|
| `src/lib/calc/simulation-engine.ts` | Integrate conversion processor into annual loop |
| `src/lib/calc/portfolio.ts` | Add `conversions` to portfolio data types |
| `src/lib/calc/account.ts` | Add `applyConversion()`, conversion basis tracking |
| `src/lib/calc/taxes.ts` | Add conversion income to ordinary income |
| `src/lib/calc/incomes.ts` | Add `conversionIncome` to `IncomesData` |

### Modified Files — Data Layer
| File | Changes |
|------|---------|
| `src/lib/utils/data-transformers.ts` | Add `conversionRuleFromConvex`/`ToConvex` |
| `src/lib/calc/data-extractors/simulation-data-extractor.ts` | Add conversion fields |
| `src/lib/calc/data-extractors/chart-data-extractor.ts` | Add conversion chart data |
| `src/lib/calc/data-extractors/key-metrics-extractor.ts` | Add conversion metrics |
| `src/lib/calc/data-extractors/table-data-extractor.ts` | Add conversion table columns |

### Modified Files — UI
| File | Changes |
|------|---------|
| Account dialog | Add conversion basis read-only display |
| Simulator page | Conversion results section |
| Cash flow chart | Conversion series |
| Net worth chart | Roth breakdown by source |

### Documentation
| File | Changes |
|------|---------|
| `CLAUDE.md` | Document conversion processor |
| `.github/copilot-instructions.md` | Document conversion rules pattern |

---

## Bracket-Filling Algorithm (Detailed)

For Phase 1, focus on `fixedAmount` and `fullBalance` first. Add `fillBracket` as an enhancement.

```typescript
// In ConversionProcessor.calculateConversionAmount():
case 'fillBracket': {
  // This requires knowing the marginal tax bracket WITHOUT this conversion
  // Approach: use the previous year's marginal bracket as a heuristic
  // (or iterate within the tax convergence loop)
  
  // For a first pass: get the top marginal rate from the last known tax data
  // stored in simulation state
  const lastTaxData = this.lastKnownTaxData;
  if (!lastTaxData) return 0; // Can't compute in first year
  
  const targetRate = rule.amount.targetBracket;
  const currentTopRate = lastTaxData.federalIncomeTaxes.topMarginalFederalIncomeTaxRate;
  
  if (currentTopRate >= targetRate) return 0; // Already at or above target bracket
  
  // Estimate headroom: approximate taxable income at target bracket
  const brackets = lastTaxData.federalIncomeTaxes.federalIncomeTaxBrackets;
  const targetBracket = brackets.find(b => b.rate === targetRate);
  if (!targetBracket) return 0;
  
  const taxableIncome = lastTaxData.federalIncomeTaxes.taxableIncomeTaxedAsOrdinary;
  const headroom = Math.max(0, targetBracket.max - taxableIncome);
  
  // Don't convert more than available balance
  return Math.min(headroom, fromAccount.getBalance());
}
```

This is approximate — the true calculation requires iterating the tax loop with conversion. In practice, the estimate gets very close after 1-2 years of convergence.

---

## Implementation Sequence

```
Phase 1 (Schema):     Days 1-3   — Create schemas, validators, transformers
Phase 2 (Account):    Days 4-6   — Add conversion basis, applyConversion()
Phase 3 (Processor):  Days 7-12  — Build conversion processor, integrate into engine
Phase 4 (Tax):        Days 10-13 — Wire conversion income into tax calculation
Phase 5 (Portfolio):  Days 13-15 — Track conversion flows in portfolio data
Phase 6 (Extractors): Days 16-18 — Update data extractors for conversion data
Phase 7 (UI):         Days 19-25 — Build conversion rules dialog and results display
Phase 8 (Tests):      Days 26-30 — Unit tests, integration tests, snapshot updates

Total estimate: 4-5 weeks for a single developer
```

Dependencies within phases:
- Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
- Phase 6 can start in parallel with Phase 4
- Phase 7 can start in parallel with Phase 5
- Phase 8 is continuous throughout