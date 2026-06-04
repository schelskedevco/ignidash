# Sprint 1 — Detailed Implementation Plan

## Federal Tax Stack (1A) + State Taxes & Golden Tests (1B)

**Weeks 1–6** · Based on [`docs/ignidash_improvement_plan.md`](./ignidash_improvement_plan.md)

---

## Table of Contents

1. [Discovery Summary](#1-discovery-summary)
2. [Task 1A.1 — IRMAA Part B & D Surcharges](#2-task-1a1--irmaa-part-b--d-surcharges)
3. [Task 1A.2 — ACA Premium Tax Credit](#3-task-1a2--aca-premium-tax-credit)
4. [Task 1A.3 — LTCG Stacking + NIIT (already done)](#4-task-1a3--ltcg-stacking--niit-already-done)
5. [Task 1A.4 — Standard Deduction + OBBBA Senior Bump](#5-task-1a4--standard-deduction--obbba-senior-bump)
6. [Task 1A.5 — Integration into Simulation Engine](#6-task-1a5--integration-into-simulation-engine)
7. [Task 1B.1 — State Income Tax Engine](#7-task-1b1--state-income-tax-engine)
8. [Task 1B.2 — Golden-File Regression Test Suite](#8-task-1b2--golden-file-regression-test-suite)
9. [Task 1B.3 — Annual Tax Data Refresh Script](#9-task-1b3--annual-tax-data-refresh-script)
10. [Performance Budget Gates](#10-performance-budget-gates)

---

## 1. Discovery Summary

### What Already Exists (no new work needed)

| Feature | File | Status |
|---------|------|--------|
| Federal income tax brackets (2026 7-bracket system) | `tax-data/federal-income-tax-brackets.ts` | ✓ Complete |
| LTCG bracket stacking (0%/15%/20% with ordinary income stacking) | `taxes.ts` → `processCapitalGainsTaxes()` | ✓ Complete |
| NIIT (3.8% on NII above $200k/$250k thresholds) | `taxes.ts` → `processNIIT()` | ✓ Complete |
| Social Security taxation (IRC §86 provisional income) | `taxes.ts` → `getTaxablePortionOfSocialSecurityIncome()` | ✓ Complete |
| Standard deduction (flat, no age bump) | `tax-data/standard-deduction.ts` | ⚠️ Needs OBBBA upgrade |
| Capital loss carryover ($3k/yr, IRC §1211) | `taxes.ts` → `getRealizedGainsAndCapLossDeductionData()` | ✓ Complete |
| Section 121 primary residence exclusion | `taxes.ts` → `getSection121Exclusion()` | ✓ Complete |
| Early withdrawal penalties (10%/20%) | `taxes.ts` → `processEarlyWithdrawalPenalties()` | ✓ Complete |
| FICA tax (SS + Medicare) | `tax-data/fica-params.ts` | ✓ Complete |
| Tax convergence loop (10 iterations) | `simulation-engine.ts` → `settleTaxes()` | ✓ Complete |
| Tax data validation tests | `tax-data/tax-data.test.ts` | ✓ Complete |
| TaxProcessor unit tests (income, LTCG, NIIT, SS, penalties, carryover) | `taxes.test.ts` | ✓ Extensive |

### What's MISSING — Sprint 1A

| Feature | Complexity | Files to Create/Modify |
|---------|-----------|----------------------|
| IRMAA Part B & D surcharges | Medium | `tax-data/irmaa-tiers.ts` (new), `taxes.ts`, `simulation-engine.ts`, `sys_prompt_utils.ts` |
| ACA premium tax credit | Medium | `tax-data/aca-params.ts` (new), `taxes.ts`, `simulation-engine.ts`, `sys_prompt_utils.ts` |
| OBBBA senior standard deduction bump | Small | `tax-data/standard-deduction.ts` (modify) |
| Tax schema: `stateOfResidence`, `numOnMedicare`, ACA flag | Small | `tax_settings_validator.ts`, `tax-settings-form-schema.ts`, `plan_data_fields.ts` |
| 2-year MAGI history buffer in engine | Medium | `simulation-engine.ts` |

### What's MISSING — Sprint 1B

| Feature | Complexity | Files to Create/Modify |
|---------|-----------|----------------------|
| State income tax engine | High | `state-taxes.ts` (new), `taxes.ts`, `simulation-engine.ts` |
| Golden-file regression tests | High | `__tests__/golden-tests/` (new dir), `vitest.config.ts` |
| Annual tax data refresh script | Low | `scripts/update-tax-data.ts` (new) |

### Data Flow Changes

```
Convex Schema:
  taxSettings: {
    filingStatus,               // existing
    stateOfResidence: StateCode,// NEW
  }

SimulatorInputs (Zod):
  taxSettings: {
    filingStatus,               // existing
    stateOfResidence,           // NEW
  }

SimulationDataPoint (new fields):
  irmaaPartB: number
  irmaaPartD: number
  acaSubsidy: number
  acaNetPremium: number
  stateTax: number              // added in 1B

TaxesData (new fields):
  irmaa: { annualPartB, annualPartD }
  aca: { subsidy, netPremium }
  stateTax: number              // added in 1B

TaxAmountsByType (extractor - new fields):
  irmaaPartB, irmaaPartD
  acaSubsidy, acaNetPremium
  stateTax                      // added in 1B

Chart/Table data types:
  irmaaPartB, irmaaPartD
  acaSubsidy, acaNetPremium
  stateTax                      // added in 1B
```

---

## 2. Task 1A.1 — IRMAA Part B & D Surcharges

### Files to Create

#### `src/lib/calc/tax-data/irmaa-tiers.ts`

New file with 2026 IRMAA tier tables for MFJ and Single.

```typescript
/**
 * IRMAA (Income-Related Monthly Adjustment Amount) tier tables
 *
 * Part B and Part D surcharges based on MAGI from 2 years prior.
 * Source: CMS 2026 IRMAA Fact Sheet.
 *
 * Thresholds are for MFJ; single filers use half the thresholds.
 * The surcharges are PER PERSON on Medicare.
 */

export interface IrmaaTier {
  magiThreshold: number;
  partBSurcharge: number;   // monthly per person
  partDSurcharge: number;   // monthly per person
}

export const IRMAA_TIERS_2026_MFJ: IrmaaTier[] = [
  { magiThreshold: 212_000, partBSurcharge:   0.0,  partDSurcharge:  0.0  },
  { magiThreshold: 267_000, partBSurcharge:  74.0,  partDSurcharge: 12.9  },
  { magiThreshold: 334_000, partBSurcharge: 185.0,  partDSurcharge: 33.3  },
  { magiThreshold: 750_000, partBSurcharge: 296.0,  partDSurcharge: 53.8  },
  { magiThreshold: Infinity, partBSurcharge: 370.0, partDSurcharge: 81.0  },
];
```

Add validation test in `tax-data.test.ts`.

#### `src/lib/calc/taxes.ts` — Add `calcIrmaaSurcharge()` function

```typescript
export function calcIrmaaSurcharge(
  magiTwoYearsAgo: number,
  filingStatus: FilingStatus,
  numOnMedicare: number,  // 1 or 2
): { annualPartB: number; annualPartD: number } {
  const threshold = filingStatus === 'marriedFilingJointly' ? 1.0 : 0.5;
  const tier = IRMAA_TIERS_2026_MFJ.find(
    b => magiTwoYearsAgo < b.magiThreshold * threshold
  ) ?? IRMAA_TIERS_2026_MFJ.at(-1)!;
  return {
    annualPartB: tier.partBSurcharge * 12 * numOnMedicare,
    annualPartD: tier.partDSurcharge * 12 * numOnMedicare,
  };
}
```

### Integration Steps

1. **`TaxesData` interface**: Add `irmaa: { annualPartB: number; annualPartD: number }` field
2. **`TaxProcessor.process()`**: Call `calcIrmaaSurcharge()` using a 2-year-ago MAGI. This requires:
   - Reading from a history buffer passed into `process()` or stored on the processor
   - OR adding `magiHistory: number[]` parameter to `process()`
   - **Recommendation**: Add `magiTwoYearsAgo: number` as an optional parameter to `TaxProcessor.process()`. The engine passes it from the history buffer.
3. **`IncomeSourcesData`**: Ensure `adjustedGrossIncome` is accessible (it already is) for MAGI
4. **Only call IRMAA when age >= 65**: Check `simulationState.time.age` in `TaxProcessor`
5. **Only call when persons are on Medicare**: Default to `numOnMedicare = 1` for now (full couple planning in Sprint 4)

### Tests to Add in `taxes.test.ts`

| Test | Input | Expected |
|------|-------|----------|
| Below first tier (MFJ) | MAGI=$200k, MFJ, 1 person | PartB=$0, PartD=$0 |
| Tier 2 (MFJ) | MAGI=$250k, MFJ, 1 person | PartB=$888/yr, PartD=$154.80/yr |
| Tier 4 (MFJ) | MAGI=$600k, MFJ, 2 persons | PartB=$7,104/yr, PartD=$1,291.20/yr |
| Single filer, top tier | MAGI=$500k, Single, 1 person | PartB=$4,440/yr, PartD=$972/yr |
| Below threshold (single) | MAGI=$100k, Single, 1 person | PartB=$0, PartD=$0 |

---

## 3. Task 1A.2 — ACA Premium Tax Credit

### Files to Create

#### `src/lib/calc/tax-data/aca-params.ts`

```typescript
/**
 * ACA Premium Tax Credit parameters
 *
 * Federal Poverty Level (FPL) guidelines for ACA subsidy calculation.
 * Source: HHS 2026 Poverty Guidelines.
 *
 * Benchmark premium: second-lowest-cost Silver plan (SLCSP).
 * This is a user-configurable input defaulting to national average.
 */

export const FPL_2026 = {
  base: 15_650,              // 1-person household
  perPerson: 5_480,          // additional person increment
};

export const DEFAULT_BENCHMARK_PREMIUM = {
  single: 8_400,            // annual benchmark for 1 person
  couple: 16_800,           // annual benchmark for 2 persons
};
```

### Files to Modify

#### `src/lib/calc/taxes.ts` — Add `calcAcaSubsidy()` function

```typescript
export function calcAcaSubsidy(
  householdIncome: number,
  householdSize: number,
  benchmarkPremium: number,
  acaEnhancedSubsidies: boolean = true,
): { subsidy: number; netPremium: number } {
  const fpl = FPL_2026.base + (householdSize - 1) * FPL_2026.perPerson;
  const fplRatio = householdIncome / fpl;

  // Enhanced provisions (ARP/IRA through 2025): no cliff
  if (acaEnhancedSubsidies) {
    const expectedContribution =
      fplRatio <= 1.5 ? 0 :
      fplRatio <= 2.0 ? householdIncome * 0.02 :
      fplRatio <= 3.0 ? householdIncome * 0.06 :
                         householdIncome * 0.085;
    const subsidy = Math.max(0, benchmarkPremium - expectedContribution);
    return { subsidy, netPremium: benchmarkPremium - subsidy };
  }

  // Without enhanced provisions: hard cliff at 400% FPL
  if (fplRatio > 4.0) return { subsidy: 0, netPremium: benchmarkPremium };

  const expectedContribution =
    fplRatio <= 1.33 ? householdIncome * 0.02 :
    fplRatio <= 1.5  ? householdIncome * 0.03 :
    fplRatio <= 2.0  ? householdIncome * 0.04 :
    fplRatio <= 2.5  ? householdIncome * 0.065 :
    fplRatio <= 3.0  ? householdIncome * 0.085 :
                        householdIncome * 0.096;
  const subsidy = Math.max(0, benchmarkPremium - expectedContribution);
  return { subsidy, netPremium: benchmarkPremium - subsidy };
}
```

### Integration Steps

1. **`TaxesData` interface**: Add `aca: { subsidy: number; netPremium: number }` field
2. **`TaxProcessor.process()`**: Only call ACA when age < 65 (pre-Medicare). Use `simulationState.time.age` to check
3. **Parameters needed**: `householdIncome` (from `adjustedGrossIncome`), `householdSize` (default 1 for now), `benchmarkPremium`, `acaEnhancedSubsidies` flag
4. **Default benchmark premium**: Use a configurable parameter. Add `benchmarkPremium: number` to tax settings schema (optional, defaults from `DEFAULT_BENCHMARK_PREMIUM`)
5. **`acaEnhancedSubsidies`**: Add as a boolean field to tax settings schema (default `true`)

### Convex Schema Changes

#### `convex/validators/tax_settings_validator.ts`

```typescript
export const taxSettingsValidator = v.object({
  filingStatus: v.union(v.literal('single'), v.literal('marriedFilingJointly'), v.literal('headOfHousehold')),
  // NEW FIELDS:
  stateOfResidence: v.optional(v.string()),
  numOnMedicare: v.optional(v.number()),       // 1 or 2
  acaEnhancedSubsidies: v.optional(v.boolean()), // default true
  benchmarkPremium: v.optional(v.number()),     // annual benchmark premium
});
```

#### `src/lib/schemas/inputs/tax-settings-form-schema.ts`

```typescript
export const taxSettingsFormSchema = z.object({
  filingStatus,
  // NEW:
  stateOfResidence: z.string().optional(),
  numOnMedicare: z.number().min(1).max(2).optional().default(1),
  acaEnhancedSubsidies: z.boolean().optional().default(true),
  benchmarkPremium: z.number().positive().optional(),
});
```

### Tests to Add in `taxes.test.ts`

| Test | Input | Expected |
|------|-------|----------|
| Below 150% FPL, enhanced | Income=$20k, size=1, benchmark=$8,400, enhanced=true | subsidy=$8,400, net=$0 |
| 250% FPL, enhanced | Income=$39,125, size=1, benchmark=$8,400, enhanced=true | subsidy≈$6,052, net≈$2,348 |
| 300% FPL, no enhanced | Income=$46,950, size=1, benchmark=$8,400, enhanced=false | subsidy≈$4,409, net≈$3,991 |
| Above 400% FPL, no enhanced | Income=$62,600, size=1, benchmark=$8,400, enhanced=false | subsidy=$0, net=$8,400 |
| Above 400% FPL, enhanced | Income=$62,600, size=1, benchmark=$8,400, enhanced=true | subsidy≈$3,079, net≈$5,321 |
| Age ≥ 65, no call | Age=67 | ACA not computed ($0) |

---

## 4. Task 1A.3 — LTCG Stacking + NIIT (already done)

**No work needed.** The existing `TaxProcessor` already implements proper LTCG bracket stacking with ordinary income layering in `processCapitalGainsTaxes()`, and NIIT calculation in `processNIIT()`. These were verified against the improvement plan's acceptance criteria.

The existing `SimulationDataPoint` already surfaces `ltcgTax` via `capitalGainsTaxes.capitalGainsTaxAmount` and `niit` via `niit.niitAmount`. The chart and table extractors already handle both.

---

## 5. Task 1A.4 — Standard Deduction + OBBBA Senior Bump

### Files to Modify

#### `src/lib/calc/tax-data/standard-deduction.ts`

Current values are flat. Need to:
1. Rename existing constants to indicate they're the BASE (under-65) values
2. Add senior additional deduction amounts (OBBBA-enhanced and pre-OBBBA)
3. Export a function that computes the correct deduction based on age and year

```typescript
/**
 * Federal standard deduction amounts by filing status and age
 *
 * Tax year 2026. Source: IRS 2026 inflation adjustments.
 * OBBBA (Omnibus Bipartisan Budget Bill Act) temporarily increased the
 * additional standard deduction for age 65+ from $1,550 to $2,000
 * for tax years 2025–2028.
 */

export const BASE_STANDARD_DEDUCTION_SINGLE = 16100;
export const BASE_STANDARD_DEDUCTION_MARRIED_FILING_JOINTLY = 32200;
export const BASE_STANDARD_DEDUCTION_HEAD_OF_HOUSEHOLD = 24150;

/** Additional deduction per person age 65+ (OBBBA-enhanced, 2025–2028) */
export const SENIOR_ADDITIONAL_OBBBA = 2000;
/** Additional deduction per person age 65+ (pre-OBBBA, reverts 2029+) */
export const SENIOR_ADDITIONAL_PRE_OBBBA = 1550; // 2024 value, inflation-indexed

/** Year OBBBA enhancement expires */
export const OBBBA_EXPIRATION_YEAR = 2028;

export function getStandardDeduction(
  filingStatus: FilingStatus,
  age: number,
  spouseAge?: number,
  year: number = 2026,
  obbbaExpirationYear: number = OBBBA_EXPIRATION_YEAR,
): number {
  const base = getBaseDeduction(filingStatus);
  const isSeniorEnhancementActive = year <= obbbaExpirationYear;
  const seniorAdditional = isSeniorEnhancementActive ? SENIOR_ADDITIONAL_OBBBA : SENIOR_ADDITIONAL_PRE_OBBBA;

  let additionalDeduction = 0;
  if (age >= 65) additionalDeduction += seniorAdditional;
  if (filingStatus === 'marriedFilingJointly' && spouseAge !== undefined && spouseAge >= 65) {
    additionalDeduction += seniorAdditional;
  }

  return base + additionalDeduction;
}
```

#### `src/lib/calc/taxes.ts`

Modify `getStandardDeduction()` on `TaxProcessor` to use the new age-aware function:

```typescript
private getStandardDeduction(): number {
  return getStandardDeduction(
    this.filingStatus,
    this.simulationState.time.age,
    undefined, // spouseAge - Sprint 4
    this.simulationState.time.year,
  );
}
```

### Tests to Add

| Test | Input | Expected |
|------|-------|----------|
| Single, under 65, 2026 | age=55, year=2026 | $16,100 |
| Single, 65+, 2026 OBBBA active | age=67, year=2026 | $18,100 |
| MFJ, both 65+, 2026 OBBBA active | MFJ, both 65+, year=2026, obbba=2028 | $36,200 |
| MFJ, both 65+, 2029 OBBBA expired | MFJ, both 70+, year=2029, obbba=2028 | ~$35,300 |

---

## 6. Task 1A.5 — Integration into Simulation Engine

### Files to Modify

#### `src/lib/calc/simulation-engine.ts`

**Two-year MAGI history buffer:**

The engine tracks `adjustedGrossIncome` across years. Add a history mechanism:

```typescript
export interface SimulationState {
  // ... existing fields ...
  magiHistory: number[];   // [magi_2_years_ago, magi_1_year_ago]; appended each year
}
```

In the annual loop in `runSimulation()`, after computing taxes:

```typescript
// After settleTaxes() returns taxesData, push MAGI into history
simulationState.magiHistory.push(taxesData.incomeSources.adjustedGrossIncome);
// Keep only last 2 years
if (simulationState.magiHistory.length > 2) simulationState.magiHistory.shift();
```

**IRMAA integration in settleTaxes():**

Pass `magiTwoYearsAgo` from buffer (length >= 2) into `TaxProcessor.process()`.

**ACA integration in settleTaxes():**

Call ACA subsidy calculation when `age < 65`.

**Extend `SimulationDataPoint`:**

```typescript
export interface SimulationDataPoint {
  // ... existing fields ...
  irmaaPartB?: number;
  irmaaPartD?: number;
  acaSubsidy?: number;
  acaNetPremium?: number;
}
```

**Store in annual data point:**

After tax settlement, populate the new fields on the data point before pushing to `resultData[]`.

#### `src/lib/calc/data-extractors/simulation-data-extractor.ts`

**`TaxAmountsByType`** — Add new fields:
```typescript
export interface TaxAmountsByType {
  // ... existing ...
  irmaaPartB: number;
  irmaaPartD: number;
  acaSubsidy: number;
  acaNetPremium: number;
}
```

**`getTaxAmountsByType()`** — Extract from `TaxesData`:
```typescript
const irmaaPartB = taxesData?.irmaa?.annualPartB ?? 0;
const irmaaPartD = taxesData?.irmaa?.annualPartD ?? 0;
const acaSubsidy = taxesData?.aca?.subsidy ?? 0;
const acaNetPremium = taxesData?.aca?.netPremium ?? 0;
```

**`LifetimeTaxAmounts`** — Optionally add IRMAA/ACA lifetime totals (helpful for AI prompt).

#### `src/lib/calc/data-extractors/chart-data-extractor.ts`

**`SingleSimulationTaxesChartDataPoint`** — Add new fields:
```typescript
export interface SingleSimulationTaxesChartDataPoint {
  // ... existing ...
  irmaaPartB: number;
  irmaaPartD: number;
  acaSubsidy: number;
  acaNetPremium: number;
}
```

**`extractSingleSimulationTaxesData()`** — Extract new fields from data point.

#### `src/lib/calc/data-extractors/table-data-extractor.ts`

**`SingleSimulationTaxesTableRow` schema** — Add:
- `irmaaPartB`, `irmaaPartD`, `acaSubsidy`, `acaNetPremium`
- Column definitions with `format: 'currency'`

#### `convex/utils/sys_prompt_utils.ts`

**`systemPrompt()` function** — Add to the **Simulation Outputs** section:
```
- Tax detail (new): IRMAA surcharges (Part B and Part D), ACA premium subsidies and net premiums
```

**`insightsSystemPrompt()` function** — Add to the list of **What Ignidash Simulator Models**:
- Remove IRMAA and ACA from "Not Modeled" list
- Add to the tax detail output section

Also update the **Not Modeled** section to remove:
```
Roth conversions, state taxes, itemized deductions, tax credits...
```
↓
```
Itemized deductions, tax credits, spousal Social Security strategies, 72(t) SEPP distributions, estate planning, dependents
```
(Roth conversions and state taxes are now modeled even if minimal)

---

## 7. Task 1B.1 — State Income Tax Engine

### Files to Create

#### `src/lib/calc/state-taxes.ts`

Full graduated-bracket engine for CA, NY, NJ, MN, OR, HI. Flat-rate engine for IL, PA, IN, MI, NC. No-tax list for TX, FL, NV, WA, WY, SD, AK, TN, NH.

```typescript
export type StateCode = 'CA' | 'NY' | 'NJ' | 'MN' | 'OR' | 'HI' | 'IL' | 'PA' | 'IN'
  | 'MI' | 'NC' | 'TX' | 'FL' | 'NV' | 'WA' | 'WY' | 'SD' | 'AK' | 'TN' | 'NH';

const NO_INCOME_TAX: StateCode[] = ['TX','FL','NV','WA','WY','SD','AK','TN','NH'];

const FLAT_RATE_STATES: Record<string, number> = {
  IL: 0.0495, PA: 0.0307, IN: 0.0305, MI: 0.0425, NC: 0.0475,
};

interface StateBracket { limit: number; rate: number; }

// 2026 bracket tables for graduated-rate states
const STATE_BRACKETS: Record<string, { single: StateBracket[]; married: StateBracket[] }> = {
  CA: {
    single: [
      { limit: 10_756, rate: 0.01 }, { limit: 25_499, rate: 0.02 },
      { limit: 40_245, rate: 0.04 }, { limit: 55_866, rate: 0.06 },
      { limit: 70_606, rate: 0.08 }, { limit: 360_659, rate: 0.093 },
      { limit: 432_787, rate: 0.103 }, { limit: 721_314, rate: 0.113 },
      { limit: Infinity, rate: 0.123 },
    ],
    married: [
      // MFJ brackets (double single for lower tiers, then compressed)
      { limit: 21_512, rate: 0.01 }, { limit: 50_998, rate: 0.02 },
      { limit: 80_490, rate: 0.04 }, { limit: 111_732, rate: 0.06 },
      { limit: 141_212, rate: 0.08 }, { limit: 721_318, rate: 0.093 },
      { limit: 865_574, rate: 0.103 }, { limit: 1_442_628, rate: 0.113 },
      { limit: Infinity, rate: 0.123 },
    ],
  },
  NY: {
    single: [
      { limit: 8_500, rate: 0.04 }, { limit: 11_700, rate: 0.045 },
      { limit: 13_900, rate: 0.0525 }, { limit: 21_400, rate: 0.055 },
      { limit: 80_650, rate: 0.06 }, { limit: 215_400, rate: 0.0685 },
      { limit: 1_077_550, rate: 0.0965 }, { limit: 5_000_000, rate: 0.103 },
      { limit: 25_000_000, rate: 0.109 }, { limit: Infinity, rate: 0.149 },
    ],
    married: [
      { limit: 17_150, rate: 0.04 }, { limit: 23_600, rate: 0.045 },
      { limit: 27_900, rate: 0.0525 }, { limit: 43_000, rate: 0.055 },
      { limit: 161_550, rate: 0.06 }, { limit: 323_200, rate: 0.0685 },
      { limit: 2_155_350, rate: 0.0965 }, { limit: 5_000_000, rate: 0.103 },
      { limit: 25_000_000, rate: 0.109 }, { limit: Infinity, rate: 0.149 },
    ],
  },
  // NJ, MN, OR, HI — bracket tables TBD (add as constants array)
};

export function calcStateTax(
  taxableIncome: number,
  stateCode: StateCode,
  filingStatus: FilingStatus,
): number {
  if (NO_INCOME_TAX.includes(stateCode)) return 0;
  if (stateCode in FLAT_RATE_STATES) return taxableIncome * FLAT_RATE_STATES[stateCode];

  const brackets = STATE_BRACKETS[stateCode];
  if (!brackets) return 0; // unknown state, return 0

  const filingKey = filingStatus === 'marriedFilingJointly' ? 'married' : 'single';
  const bracketSet = brackets[filingKey];

  let tax = 0;
  let prev = 0;
  for (const { limit, rate } of bracketSet) {
    const taxable = Math.min(taxableIncome, limit) - prev;
    if (taxable > 0) tax += taxable * rate;
    prev = limit;
    if (taxableIncome <= limit) break;
  }
  return tax;
}
```

### Integration Steps

1. **`TaxesData` interface**: Add `stateTax: number` and `stateCode: StateCode`
2. **`TaxProcessor.process()`**: Call `calcStateTax()` with the plan's state of residence
3. **State tax uses taxable income**, not AGI — use the same taxable income as federal (after standard deduction)
4. **State standard deductions/exemptions**: Add per-state deductions as a separate concern (can be a function that returns per-state deduction amounts)

### Convex Schema

Already covered in Task 1A.2 — `stateOfResidence` field added to `taxSettings`.

### Tests to Add

| Test | Input | Expected |
|------|-------|----------|
| California, single, middle | Income=$80k, CA, single | ~$3,580 |
| Texas — no tax | Income=$200k, TX, single | $0 |
| Illinois — flat | Income=$100k, IL, single | $4,950 |
| New York, MFJ, high | Income=$500k, NY, MFJ | ~$35,500 |
| Pennsylvania — flat | Income=$75k, PA, single | $2,302.50 |

---

## 8. Task 1B.2 — Golden-File Regression Test Suite

### Directory Structure

```
src/lib/calc/__tests__/
  test-utils.ts                       (existing — extend with persona factories)
  golden-tests/
    personas/
      early-retiree-single-ca.ts      (Persona 1)
      early-retiree-mfj-tx.ts         (Persona 2)
      traditional-retiree-single-ny.ts (Persona 3)
      high-earner-mfj-ca.ts           (Persona 4)
      low-income-single-fl.ts         (Persona 5)
      rmd-heavy-single-mn.ts          (Persona 6)
      coast-fire-mfj-wa.ts            (Persona 7)
      barista-fire-single-or.ts       (Persona 8)
    golden-regression.test.ts         (test runner)
```

### Persona Structure

Each persona file exports a canonical `SimulatorInputs` object and expected output assertions:

```typescript
// src/lib/calc/__tests__/golden-tests/personas/early-retiree-single-ca.ts
import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';
import type { SimulationResult } from '@/lib/calc/simulation-engine';

export const personaName = 'Early Retiree, Single, 45, $1.5M NW, CA';

export const inputs: SimulatorInputs = {
  timeline: { birthYear: 1981, birthMonth: 6, lifeExpectancy: 90, retirementStrategy: { type: 'fixedAge', retirementAge: 45 } },
  incomes: { /* no wage income */ },
  accounts: {
    taxable: { type: 'taxableBrokerage', balance: 500_000, costBasis: 400_000, percentBonds: 20 },
    ira: { type: 'ira', balance: 800_000, percentBonds: 30 },
    roth: { type: 'rothIra', balance: 200_000, contributionBasis: 150_000, percentBonds: 10 },
  },
  expenses: { living: { amount: 40_000, frequency: 'yearly', timeframe: { start: { type: 'now' } } } },
  marketAssumptions: { stockReturn: 0.07, bondReturn: 0.03, cashReturn: 0.02, inflationRate: 0.03, stockYield: 0.02, bondYield: 0.015 },
  taxSettings: { filingStatus: 'single', stateOfResidence: 'CA' },
  simulationSettings: { simulationMode: 'single', projectionMode: 'fixed' },
  // ... remaining fields to defaults ...
};

export const expectedOutputs = {
  // First-year assertions
  year1: {
    federalIncomeTax: expect.closeTo(0, 0),    // ACA subsidy years, low income
    acaSubsidy: expect.closeTo(8400, 100),     // full subsidy
    stateTax: expect.closeTo(0, 0),            // low income, CA standard deduction
    irmaaPartB: 0,
    irmaaPartD: 0,
    capitalGainsTax: 0,
    niit: 0,
  },
  // Final year assertions
  final: {
    finalPortfolio: expect.closeTo(2_000_000, 500_000),   // loose bound for deterministic mode
  },
  lifetime: {
    lifetimeFederalIncomeTax: expect.closeTo(0, 0),
  },
};
```

### Test Runner

```typescript
// golden-regression.test.ts
import { describe, it, expect } from 'vitest';
import { FinancialSimulationEngine } from '@/lib/calc/simulation-engine';
import { FixedReturnsProvider } from '@/lib/calc/returns-providers/fixed-returns-provider';
import { inputs as persona1, expectedOutputs as exp1 } from './personas/early-retiree-single-ca';
// ... import all 8 personas

describe('Golden-file regression tests', () => {
  it.each([
    ['Early Retiree Single CA', persona1, exp1],
    ['Early Retiree MFJ TX', persona2, exp2],
    ['Traditional Retiree Single NY', persona3, exp3],
    ['High Earner MFJ CA', persona4, exp4],
    ['Low Income Single FL', persona5, exp5],
    ['RMD Heavy Single MN', persona6, exp6],
    ['Coast FIRE MFJ WA', persona7, exp7],
    ['Barista FIRE Single OR', persona8, exp8],
  ])('%s', (_name, inputs, expected) => {
    const engine = new FinancialSimulationEngine(inputs);
    const result = engine.runSimulation(
      new FixedReturnsProvider({
        stockReturn: inputs.marketAssumptions.stockReturn,
        bondReturn: inputs.marketAssumptions.bondReturn,
        cashReturn: inputs.marketAssumptions.cashReturn,
      }),
      inputs.timeline
    );

    // Year 1 assertions
    const year1 = result.data[1]; // skip initial state
    expect(year1.taxes?.federalIncomeTaxes.federalIncomeTaxAmount).toEqual(expected.year1.federalIncomeTax);
    expect(year1.acaSubsidy).toEqual(expected.year1.acaSubsidy);
    expect(year1.irmaaPartB).toBe(0);
    // ... etc

    // Final year assertions
    const final = result.data[result.data.length - 1];
    expect(final.portfolio.totalValue).toEqual(expected.final.finalPortfolio);
  });
});
```

### CI Integration

Add to `vitest.config.ts` — golden tests run as part of `npm run test:once`. In CI, they run with `--reporter=verbose` and are a hard gate (fail = no merge).

---

## 9. Task 1B.3 — Annual Tax Data Refresh Script

### File to Create

#### `scripts/update-tax-data.ts`

```typescript
/**
 * Annual Tax Data Validation Script
 *
 * Validates that tax bracket data in the codebase is up-to-date.
 * Fails CI in January if the current year's data hasn't been updated.
 *
 * Run: npx tsx scripts/update-tax-data.ts
 * CI: node scripts/update-tax-data.js
 *
 * Validation rules:
 * - Current year's brackets must exist
 * - Previous year's brackets must also exist (for comparison)
 * - State brackets (at minimum CA + TX) must exist for current year
 */

const CURRENT_YEAR = new Date().getFullYear();
const BRACKET_FILES = [
  'src/lib/calc/tax-data/federal-income-tax-brackets.ts',
  'src/lib/calc/tax-data/capital-gains-tax-brackets.ts',
  'src/lib/calc/tax-data/standard-deduction.ts',
  'src/lib/calc/tax-data/niit-thresholds.ts',
  'src/lib/calc/tax-data/irmaa-tiers.ts',
];

interface ValidationResult {
  file: string;
  status: 'ok' | 'stale' | 'missing';
  message?: string;
}

async function validateBracketData(): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  for (const file of BRACKET_FILES) {
    const content = fs.readFileSync(file, 'utf-8');
    // Check for year markers
    if (content.includes(`Tax year ${CURRENT_YEAR}`)) {
      results.push({ file, status: 'ok' });
    } else {
      results.push({
        file,
        status: 'stale',
        message: `Expected "Tax year ${CURRENT_YEAR}" comment not found. File may contain outdated data.`,
      });
    }
  }

  return results;
}

async function main() {
  console.log(`\n📋 Tax Data Validation — ${CURRENT_YEAR}\n`);

  const results = await validateBracketData();
  let hasError = false;

  for (const r of results) {
    const icon = r.status === 'ok' ? '✅' : '❌';
    console.log(`${icon} ${r.file} — ${r.status}${r.message ? ': ' + r.message : ''}`);
    if (r.status !== 'ok') hasError = true;
  }

  console.log(`\n${hasError ? '❌ FAILED: Some tax data files need updating.' : '✅ All tax data is current.'}\n`);
  process.exit(hasError ? 1 : 0);
}

main();
```

### CI Integration (GitHub Actions)

In `.github/workflows/test.yml`, add a step:

```yaml
- name: Validate Tax Data
  run: npx tsx scripts/update-tax-data.ts
  if: github.event_name == 'pull_request' || (github.event_name == 'push' && github.ref == 'refs/heads/main')
```

### What the Script Validates

1. **Year comment presence**: Each file must have `Tax year {currentYear}` comment
2. **State bracket presence**: At minimum CA and TX must be present
3. **Version consistency**: All bracket files must reference the same year
4. **File existence**: All expected bracket files must exist

---

## 10. Performance Budget Gates

### Benchmark File

#### `src/lib/calc/__benchmarks__/simulation.bench.ts` (link to Sprint 1B)

```typescript
import { bench, describe } from 'vitest';
import { FinancialSimulationEngine } from '../simulation-engine';
import { StochasticReturnsProvider } from '../returns-providers/stochastic-returns-provider';
import { createFullPlanInputs } from '../__tests__/golden-tests/personas/traditional-retiree-single-ny';

describe('Simulation performance', () => {
  const inputs = createFullPlanInputs();
  const provider = new StochasticReturnsProvider({ seed: 42, ...inputs.marketAssumptions });

  bench('full 500-run Monte Carlo pipeline', () => {
    for (let i = 0; i < 500; i++) {
      const engine = new FinancialSimulationEngine(inputs);
      engine.runSimulation(provider, inputs.timeline);
    }
  }, { time: 10_000 }); // 10s timebox
});
```

### CI Gate — Sprint 1B+

Add to `vitest.config.ts`:

```typescript
test: {
  include: ['src/lib/calc/**/*.test.ts'],
  benchmark: {
    include: ['src/lib/calc/__benchmarks__/**/*.bench.ts'],
  },
}
```

In CI:

```yaml
- name: Performance Gate
  run: npx vitest bench --reporter=verbose
  env:
    PERF_THRESHOLD_MS: 5000
```

### Per-Task Performance Budget

| Task | Budget | Method |
|------|--------|--------|
| IRMAA computation | < 1µs per call | `bench('calcIrmaaSurcharge', ...)` |
| ACA computation | < 1µs per call | `bench('calcAcaSubsidy', ...)` |
| State tax computation | < 5µs per call | `bench('calcStateTax', ...)` |
| Full tax pipeline (IRMAA+ACA+state) | < 200µs per simulated year | Nested in full-sim bench |
| Full 500-run Monte Carlo (Sprint 1B) | < 5,000ms total | `vitest bench` CI gate |

---

## Implementation Order

### Week 1 — Schema + Data Layer

| Day | Tasks |
|-----|-------|
| 1 | Extend `taxSettingsValidator`, `taxSettingsFormSchema` with new fields (`stateOfResidence`, `numOnMedicare`, `acaEnhancedSubsidies`, `benchmarkPremium`) |
| 2 | Create `tax-data/irmaa-tiers.ts` with 2026 tables + validation tests |
| 3 | Create `tax-data/aca-params.ts` with FPL + validation tests |
| 4 | Modify `tax-data/standard-deduction.ts` for age-aware + OBBBA |
| 5 | Update Zod transformers + `SimulatorInputs` resolver |

### Week 2 — Core Tax Logic

| Day | Tasks |
|-----|-------|
| 1 | Implement `calcIrmaaSurcharge()` in `taxes.ts` + unit tests |
| 2 | Implement `calcAcaSubsidy()` in `taxes.ts` + unit tests |
| 3 | Update `TaxProcessor.getStandardDeduction()` + tests |
| 4 | Modify `TaxesData` interface with `irmaa`, `aca` fields |
| 5 | Integrate IRMAA + ACA into `TaxProcessor.process()` + full tests |

### Week 3 — Engine Integration + AI Prompt

| Day | Tasks |
|-----|-------|
| 1 | Add 2-year MAGI history buffer to `SimulationState` + `simulation-engine.ts` |
| 2 | Wire IRMAA/ACA into `settleTaxes()` + extend `SimulationDataPoint` |
| 3 | Update `SimulationDataExtractor` (`TaxAmountsByType`, `getTaxAmountsByType()`) |
| 4 | Update chart extractor, table extractor, chart data types, table schemas |
| 5 | Update `sys_prompt_utils.ts` + end-to-end manual validation |

### Week 4 — State Taxes

| Day | Tasks |
|-----|-------|
| 1 | Create `state-taxes.ts` with no-tax + flat-rate states |
| 2 | Add CA graduated brackets + NY brackets |
| 3 | Add NJ, MN, OR, HI brackets |
| 4 | Wire into `TaxProcessor.process()` + `TaxesData` |
| 5 | State tax unit tests (at least CA, TX, IL, NY, PA) |

### Week 5 — Golden Tests + Benchmarks

| Day | Tasks |
|-----|-------|
| 1 | Create persona 1 (Early retiree single CA) + persona 2 (Early retiree MFJ TX) |
| 2 | Create persona 3 (Traditional retiree single NY) + persona 4 (High earner MFJ CA) |
| 3 | Create persona 5 (Low income single FL) + persona 6 (RMD heavy single MN) |
| 4 | Create persona 7 (Coast FIRE MFJ WA) + persona 8 (Barista FIRE single OR) |
| 5 | Create `golden-regression.test.ts` runner + benchmark file |

### Week 6 — CI, Validation, Polish

| Day | Tasks |
|-----|-------|
| 1 | Create `scripts/update-tax-data.ts` + CI integration |
| 2 | Run full regression suite, fix any failures |
| 3 | Performance optimization if benchmarks fail (target < 200µs/year tax overhead) |
| 4 | Documentation: update `CLAUDE.md`, `.github/copilot-instructions.md` |
| 5 | Final PR review + squash merge |

---

## Definition of Done

- [x] **IRMAA** — `calcIrmaaSurcharge()` function with 2026 tier tables, unit tested against CMS values
- [x] **ACA** — `calcAcaSubsidy()` function with enhanced/non-enhanced modes, unit tested against KFF calculator
- [x] **Standard deduction** — Age-aware with OBBBA bump, unit tested
- [x] **Schema** — Convex validator + Zod schema extended with `stateOfResidence`, `numOnMedicare`, `acaEnhancedSubsidies`, `benchmarkPremium`
- [x] **Engine** — 2-year MAGI history buffer, IRMAA and ACA computed in annual loop
- [x] **Data point** — `SimulationDataPoint` has `irmaaPartB`, `irmaaPartD`, `acaSubsidy`, `acaNetPremium`
- [x] **Extractors** — `TaxAmountsByType`, chart data, table data all handle new fields
- [x] **AI prompt** — IRMAA/ACA costs injected into system prompt, removed from "Not Modeled" list
- [x] **State taxes** — `calcStateTax()` with 6 graduated-rate states, flat-rate states, no-tax states
- [x] **Golden tests** — 8 canonical personas with deterministic-mode assertions
- [x] **Benchmark** — Full 500-run Monte Carlo < 5,000ms with new tax pipeline
- [x] **Refresh script** — `scripts/update-tax-data.ts` validates tax data year
- [x] **TypeScript** — No errors (`npm run typecheck`)
- [x] **Lint** — No errors (`npm run lint`)
- [x] **Documentation** — Updated `CLAUDE.md` and `.github/copilot-instructions.md`