# Ignidash — Structured Improvement Plan

> **Engineering Improvement Plan · June 2026**
> Six-sprint implementation roadmap grounded in the codebase architecture

| | |
|---|---|
| **Repo** | `schelskedevco/ignidash` |
| **Stack** | Next.js 16 · Convex · Zustand · Vitest · Playwright |
| **Engine** | `src/lib/calc/` · Web Workers · Comlink |
| **AI** | Azure OpenAI · `convex/utils/sys_prompt_utils.ts` |

---

## Sprint Summary

| Sprint | Focus | Weeks | Duration | Tasks | Primary Files Changed |
|--------|-------|-------|----------|-------|-----------------------|
| **1A** | Federal Tax Stack | 1–3 | 3 weeks | 5 | `taxes.ts`, `SimulationDataPoint` |
| **1B** | State Taxes + Test Suite | 4–6 | 3 weeks | 3 | `state-taxes.ts`, `tests/` |
| **2** | Roth Conversion + Withdrawal Strategies | 7–10 | 4 weeks | 6 | `account.ts`, `taxes.ts`, Convex schema |
| **3** | AI Advisor Upgrade | 11–14 | 4 weeks | 4 | `sys_prompt_utils.ts`, `chat/` UI |
| **4** | Couple Planning | 15–20 | 6 weeks | 6 | Convex schema, `simulation-engine.ts`, all calc modules, UI |
| **5** | OWL Optimization Engine Integration | 21–26 | 6 weeks | 5 | `api/owl/`, `translate.py`, `optimize/` UI |
| | **Total** | **1–26** | **26 weeks** | **29 tasks** | |

---

## Architecture Baseline

Before designing improvements, the existing architecture constrains where each change lands. Every new feature must slot into one of three existing layers:

```
Convex backend  →  Next.js / React  →  simulation-engine.ts  →  Web Workers (Comlink)  →  Recharts / UI
plans.ts · income.ts · expense.ts · debt.ts  →  taxes.ts · portfolio.ts · account.ts
                                               →  sys_prompt_utils.ts → Azure OpenAI

SimulatorInputs (Zod)  →  convex-to-zod-transformers.ts  →  useSimulatorStore (Zustand)  →  data-extractors/
```

- New tax logic belongs in `src/lib/calc/taxes.ts`
- New account-level rules belong in `src/lib/calc/account.ts`
- New data points surface automatically through `SimulationDataPoint` type extension and the `data-extractor` pipeline
- New Convex schema fields follow the existing CRUD pattern in `convex/`
- The AI gains new knowledge via `sys_prompt_utils.ts` — no architecture change needed, only prompt additions

---

## Sequencing Principle

Each sprint is a prerequisite for the next:

```
Tax Accuracy (1A/1B) → Roth Optimization (2) → AI Advisor (3) → Couple Planning (4) → OWL Integration (5)
```

Tax accuracy must precede Roth optimization, which must precede the AI advisor. Couple planning (Sprint 4) is structurally independent but depends on correct tax math. The OWL integration (Sprint 5) depends on the full plan data model being stable after Sprint 4.

---

## Convex Migration / Rollback Checklist

> **Referenced by:** Sprint 2, Sprint 4, Sprint 5 — apply this checklist to every PR that touches the Convex schema.

| # | Rule | Rationale |
|---|------|-----------|
| 1 | New fields default to `null` or are marked `v.optional()` | Existing documents remain valid without backfill |
| 2 | Old clients ignore new fields | No breaking changes for users on cached bundles |
| 3 | Migration scripts are **idempotent** | Safe to re-run on partial failures |
| 4 | A **rollback script** exists for each schema change | Undo path documented before merge |
| 5 | Migration tested against a **snapshot of production data** | Catches edge cases from real user plans |
| 6 | Schema version field incremented in `convex/schema.ts` | Enables runtime version detection |

---

## Performance Budget

> **Target:** 1,000-run Monte Carlo simulation completes in **< 5 seconds** on a modern browser (M1 MacBook Air baseline).

| Sprint | Performance Gate | Measurement Method |
|--------|------------------|--------------------|
| **1A/1B** | Tax calc adds < 200µs per simulated year | Vitest benchmark: `bench('taxCalc', ...)` |
| **2** | Roth + withdrawal strategy adds < 500µs per simulated year | Vitest benchmark on `account.ts` |
| **3** | AI prompt assembly < 50ms (non-blocking) | `performance.now()` wrapper in `sys_prompt_utils.ts` |
| **4** | 2-person simulation adds ≤ 40% overhead vs single-person | Playwright perf test: 1000-run timer assertion |
| **5** | OWL API round-trip < 10s (async, non-blocking UI) | Playwright E2E with mock OWL server |
| **Overall** | `npm run bench` CI gate: 1000 runs < 5,000ms | GitHub Actions step with `--reporter=verbose` |

**Implementation:** Add a `src/lib/calc/__benchmarks__/simulation.bench.ts` file that runs the full Monte Carlo pipeline against a canonical plan and asserts wall-clock time. Wire into CI as a soft gate (warning) in Sprint 1B, hard gate (failure) from Sprint 2 onward.

---

## Sprint 1A — Federal Tax Stack

**Weeks 1–3 · Foundation for every subsequent sprint**

The existing `src/lib/calc/taxes.ts` handles federal income tax brackets. It does not yet model IRMAA, ACA, state taxes, LTCG stacking, or NIIT. Every improvement downstream — Roth optimization, AI advisor, withdrawal strategies — produces wrong answers until this layer is correct. Ship this first, ship it completely, verify it with exhaustive unit tests.

---

### Task 1A.1 — IRMAA Part B & D surcharges with 2-year lookback

Add IRMAA tier tables (2026 brackets: $212k/$267k/$334k/$750k MFJ) to `taxes.ts`. The 2-year lookback means the IRMAA surcharge in year N is calculated from the MAGI stored in year N−2 of the simulation. Extend `SimulationDataPoint` with `irmaaPartB: number` and `irmaaPartD: number`. The simulation engine must carry a 2-year MAGI history buffer. Surface IRMAA cost on the tax analytics tab and pass it to the AI system prompt.

**Tags:** `calc` · `unit tests required` · `ai prompt update`

<details>
<summary>Code snippet — <code>src/lib/calc/taxes.ts</code></summary>

```typescript
// 2026 IRMAA brackets (MFJ; single = half these thresholds)
const IRMAA_BRACKETS_2026 = [
  { magiThreshold: 212_000, partBSurcharge:   0,   partDSurcharge:  0   },
  { magiThreshold: 267_000, partBSurcharge:  74.0, partDSurcharge: 12.9 },
  { magiThreshold: 334_000, partBSurcharge: 185.0, partDSurcharge: 33.3 },
  { magiThreshold: 750_000, partBSurcharge: 296.0, partDSurcharge: 53.8 },
  { magiThreshold: Infinity,partBSurcharge: 370.0, partDSurcharge: 81.0 },
] as const;

export function calcIrmaaSurcharge(
  magiTwoYearsAgo: number,
  filingStatus: 'single' | 'married',
  numOnMedicare: number,           // 1 or 2 for couple
): { annualPartB: number; annualPartD: number } {
  const threshold = filingStatus === 'single' ? 0.5 : 1.0;
  const tier = IRMAA_BRACKETS_2026.find(
    b => magiTwoYearsAgo < b.magiThreshold * threshold
  ) ?? IRMAA_BRACKETS_2026.at(-1)!;
  return {
    annualPartB: tier.partBSurcharge * 12 * numOnMedicare,
    annualPartD: tier.partDSurcharge * 12 * numOnMedicare,
  };
}
```

</details>

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Below first tier (MFJ) | MAGI = $200,000, MFJ, 1 person | PartB = $0, PartD = $0 | CMS IRMAA Fact Sheet 2026 |
| Tier 2 (MFJ) | MAGI = $250,000, MFJ, 1 person | PartB = $888/yr, PartD = $154.80/yr | CMS IRMAA Fact Sheet 2026 |
| Tier 4 (MFJ) | MAGI = $600,000, MFJ, 2 persons | PartB = $7,104/yr, PartD = $1,291.20/yr | CMS IRMAA Fact Sheet 2026 |
| Single filer, top tier | MAGI = $500,000, Single, 1 person | PartB = $4,440/yr, PartD = $972/yr | CMS IRMAA Fact Sheet 2026 |
| 2-year lookback | Sim year 2030, MAGI 2028 = $300k | Uses 2028 MAGI for 2030 surcharge | CMS lookback rule |

---

### Task 1A.2 — ACA premium tax credit with 400% FPL cliff

Model ACA marketplace premiums for users who retire before 65. When the user's plan includes years where age < 65 and they have no employer coverage, calculate the benchmark Silver plan premium, apply the income-based Premium Tax Credit formula, and surface the net annual healthcare cost. The 400% FPL cliff eliminates all subsidies above 400% FPL — but **only if enhanced ACA provisions have expired**.

Add a configurable `acaEnhancedSubsidies: boolean` parameter (default: `true` under current law through 2025 ARP/IRA extensions). When `true`, the smooth sliding-scale formula applies with no cliff. When `false`, the 400% FPL hard cliff activates. This makes the model forward-compatible with legislative changes.

Extend `SimulationDataPoint` with `acaSubsidy: number` and `acaNetPremium: number`.

**Tags:** `calc` · `unit tests required` · `convex schema` · `ai prompt update`

<details>
<summary>Code snippet — <code>src/lib/calc/taxes.ts</code></summary>

```typescript
const FPL_2026 = { base: 15_650, perPerson: 5_480 }; // HHS poverty guidelines

export function calcAcaSubsidy(
  householdIncome: number,
  householdSize: number,
  benchmarkPremium: number,
  acaEnhancedSubsidies: boolean = true,
): { subsidy: number; netPremium: number } {
  const fpl = FPL_2026.base + (householdSize - 1) * FPL_2026.perPerson;
  const fplRatio = householdIncome / fpl;

  // Under enhanced provisions (ARP/IRA): no cliff, smooth sliding scale
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

</details>

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Below 150% FPL, enhanced | Income=$20k, size=1, benchmark=$8,400, enhanced=true | subsidy=$8,400, net=$0 | KFF ACA Calculator |
| 250% FPL, enhanced | Income=$39,125, size=1, benchmark=$8,400, enhanced=true | subsidy ≈ $6,052, net ≈ $2,348 | KFF ACA Calculator |
| 300% FPL, no enhanced | Income=$46,950, size=1, benchmark=$8,400, enhanced=false | subsidy ≈ $4,409, net ≈ $3,991 | Healthcare.gov formula |
| Above 400% FPL, no enhanced | Income=$62,600, size=1, benchmark=$8,400, enhanced=false | subsidy=$0, net=$8,400 (cliff) | Healthcare.gov 400% FPL cliff |
| Above 400% FPL, enhanced | Income=$62,600, size=1, benchmark=$8,400, enhanced=true | subsidy ≈ $3,079, net ≈ $5,321 (no cliff) | ARP §9661 sliding scale |

---

### Task 1A.3 — LTCG stacking on ordinary income + NIIT

Long-term capital gains tax rate depends on total taxable income (ordinary + LTCG). Current `taxes.ts` applies a flat 15% — wrong for high-income retirees and wrong for low-income retirees (0% bracket). Implement proper LTCG bracket stacking: 0%/15%/20% based on taxable income thresholds. Add the 3.8% Net Investment Income Tax (NIIT) for MAGI above $200k single / $250k MFJ.

Extend `SimulationDataPoint` with `ltcgTax: number` and `niit: number`.

**Tags:** `calc` · `unit tests required`

<details>
<summary>Code snippet — <code>src/lib/calc/taxes.ts</code></summary>

```typescript
const LTCG_BRACKETS_2026 = {
  single:  [{ limit:  47_025, rate: 0.00 }, { limit: 518_900, rate: 0.15 }, { limit: Infinity, rate: 0.20 }],
  married: [{ limit:  94_050, rate: 0.00 }, { limit: 583_750, rate: 0.15 }, { limit: Infinity, rate: 0.20 }],
} as const;

export function calcLtcgTax(
  ordinaryTaxableIncome: number,
  ltcgIncome: number,
  filingStatus: 'single' | 'married',
): number {
  const brackets = LTCG_BRACKETS_2026[filingStatus];
  let remaining = ltcgIncome;
  let taxableBase = ordinaryTaxableIncome;
  let tax = 0;

  for (const { limit, rate } of brackets) {
    if (taxableBase >= limit) { taxableBase = taxableBase; continue; }
    const room = limit - taxableBase;
    const taxed = Math.min(remaining, room);
    tax += taxed * rate;
    remaining -= taxed;
    taxableBase += taxed;
    if (remaining <= 0) break;
  }
  return tax;
}

export function calcNiit(
  magi: number,
  netInvestmentIncome: number,
  filingStatus: 'single' | 'married',
): number {
  const threshold = filingStatus === 'single' ? 200_000 : 250_000;
  if (magi <= threshold) return 0;
  const excess = magi - threshold;
  return Math.min(excess, netInvestmentIncome) * 0.038;
}
```

</details>

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| 0% LTCG bracket (single) | Ordinary=$30k, LTCG=$15k, single | LTCG tax = $0 | IRS Pub 550, 2026 brackets |
| Straddles 0%/15% (single) | Ordinary=$40k, LTCG=$20k, single | $0 on first $7,025 + 15% on $12,975 = $1,946.25 | IRS Pub 550 |
| 20% bracket (MFJ) | Ordinary=$500k, LTCG=$100k, MFJ | 15% on $83,750 + 20% on $16,250 = $15,812.50 | IRS Pub 550 |
| NIIT triggers (single) | MAGI=$300k, NII=$80k, single | NIIT = $3,800 (min($100k,$80k)×3.8%) | IRC §1411 |
| NIIT below threshold | MAGI=$180k, NII=$50k, single | NIIT = $0 | IRC §1411 |

---

### Task 1A.4 — Standard deduction + OBBBA senior bump

Model the correct standard deduction by filing status, including the additional amount for age ≥ 65. Account for the OBBBA-enacted temporary increase in the senior additional deduction (effective 2025–2028, reverting to prior amounts after expiration). Add `obbbaExpirationYear: number` as a configurable parameter.

**Tags:** `calc` · `unit tests required`

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Single, under 65, 2026 | Filing=single, age=55, year=2026 | Deduction = $15,000 (est. indexed) | IRS Rev. Proc. 2025-XX |
| MFJ, both 65+, 2026 OBBBA active | Filing=MFJ, ages=67&66, year=2026, obbba=true | Deduction = $32,300 + 2×$2,000 (OBBBA bump) | OBBBA §101 |
| MFJ, both 65+, 2029 OBBBA expired | Filing=MFJ, ages=70&69, year=2029, obbbaExpires=2028 | Deduction = standard + 2×$1,550 (pre-OBBBA) | IRS Rev. Proc. |

---

### Task 1A.5 — Integrate federal tax modules into simulation engine

Wire `calcIrmaaSurcharge`, `calcAcaSubsidy`, `calcLtcgTax`, `calcNiit`, and updated standard deduction into the main simulation loop in `simulation-engine.ts`. Ensure the 2-year MAGI history buffer is initialized and carried forward. Add `irmaaPartB`, `irmaaPartD`, `acaSubsidy`, `acaNetPremium`, `ltcgTax`, `niit` to `SimulationDataPoint`. Update `data-extractors/` to surface these on the analytics UI. Update `sys_prompt_utils.ts` to include IRMAA and ACA costs in the AI system prompt.

**Tags:** `engine` · `integration` · `ai prompt update`

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Full pipeline — high earner | $400k income, MFJ, age 67, $100k LTCG | All of: IRMAA Tier 3, NIIT active, LTCG 15%+20% stacking, correct deduction | Cross-validated against IRS pubs |
| Full pipeline — early retiree | $40k income, single, age 58, no employer coverage | ACA subsidy active, IRMAA/NIIT = $0, 0% LTCG bracket | Cross-validated against KFF calculator |
| AI prompt includes new fields | Any plan with Medicare years | System prompt contains IRMAA and ACA cost strings | Manual inspection |

---

## Sprint 1B — State Taxes + Test Suite

**Weeks 4–6 · Completes the tax foundation**

State income tax is the remaining gap in the tax layer. This sprint also ships the golden-file regression test suite and the annual tax-data-refresh CI script that ensures bracket data is updated every January.

---

### Task 1B.1 — State income tax engine

Create `src/lib/calc/state-taxes.ts`. Implement graduated-bracket engines for the six highest-impact states (CA, NY, NJ, MN, OR, HI) and a flat-rate engine for states like IL (4.95%), PA (3.07%), and IN (3.05%). Add a `noIncomeTax` list for TX, FL, NV, WA, WY, SD, AK, TN, NH. Model state-specific standard deductions and personal exemptions where applicable. Wire the selected state into `simulation-engine.ts` via the plan's `stateOfResidence` field.

**Tags:** `calc` · `unit tests required` · `convex schema`

<details>
<summary>Code snippet — <code>src/lib/calc/state-taxes.ts</code></summary>

```typescript
export type StateCode = 'CA' | 'NY' | 'NJ' | 'MN' | 'OR' | 'HI' | 'IL' | 'PA' | 'IN'
  | 'TX' | 'FL' | 'NV' | 'WA' | 'WY' | 'SD' | 'AK' | 'TN' | 'NH';

const NO_INCOME_TAX: StateCode[] = ['TX','FL','NV','WA','WY','SD','AK','TN','NH'];

const FLAT_RATE_STATES: Record<string, number> = {
  IL: 0.0495, PA: 0.0307, IN: 0.0305, MI: 0.0425, NC: 0.0475,
};

interface StateBracket { limit: number; rate: number; }

const CA_BRACKETS_2026_SINGLE: StateBracket[] = [
  { limit:  10_756, rate: 0.01 },
  { limit:  25_499, rate: 0.02 },
  { limit:  40_245, rate: 0.04 },
  { limit:  55_866, rate: 0.06 },
  { limit:  70_606, rate: 0.08 },
  { limit: 360_659, rate: 0.093 },
  { limit: 432_787, rate: 0.103 },
  { limit: 721_314, rate: 0.113 },
  { limit: Infinity, rate: 0.123 },
];

export function calcStateTax(
  taxableIncome: number,
  stateCode: StateCode,
  filingStatus: 'single' | 'married',
): number {
  if (NO_INCOME_TAX.includes(stateCode)) return 0;
  if (stateCode in FLAT_RATE_STATES) return taxableIncome * FLAT_RATE_STATES[stateCode];

  // Graduated bracket lookup (CA shown; extend for NY, NJ, MN, OR, HI)
  const brackets = getBracketsForState(stateCode, filingStatus);
  let tax = 0;
  let prev = 0;
  for (const { limit, rate } of brackets) {
    if (taxableIncome <= prev) break;
    const taxable = Math.min(taxableIncome, limit) - prev;
    tax += taxable * rate;
    prev = limit;
  }
  return tax;
}

function getBracketsForState(state: StateCode, filing: 'single' | 'married'): StateBracket[] {
  // TODO: Implement bracket tables for NY, NJ, MN, OR, HI
  // For now, CA single is shown as reference
  return CA_BRACKETS_2026_SINGLE;
}
```

</details>

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| California, single, middle income | Income=$80k, CA, single | State tax ≈ $3,580 | CA FTB 2026 rate schedule |
| Texas — no tax | Income=$200k, TX, single | State tax = $0 | TX Constitution Art. 8 §24-a |
| Illinois — flat rate | Income=$100k, IL, single | State tax = $4,950 | 35 ILCS 5/201(b)(5.4) |
| New York, MFJ, high income | Income=$500k, NY, MFJ | State tax ≈ $35,500 | NY DTF 2026 rate tables |
| Pennsylvania — flat rate | Income=$75k, PA, single | State tax = $2,302.50 | 72 P.S. §7302 |

---

### Task 1B.2 — Golden-file regression test suite

Create 8 canonical full-plan integration tests that run the complete simulation and assert on key outputs: total federal tax liability, IRMAA cost, ACA net premium, state tax, NIIT, LTCG tax, and final net worth at the 50th percentile. Each test uses fixed inputs producing verified outputs. The verification source is the relevant IRS publication for that year.

**Tags:** `tests` · `CI gate`

**Test Personas:**

1. **Early retiree, single, age 45, $1.5M NW, CA** — ACA subsidy, 0% LTCG bracket, no IRMAA
2. **Early retiree, MFJ, age 55, $3M NW, TX** — No state tax, approaching IRMAA threshold
3. **Traditional retiree, single, age 67, $800k NW, NY** — IRMAA Tier 1, NY state tax, Social Security taxation
4. **High earner, MFJ, age 70, $5M NW, CA** — IRMAA Tier 3+, NIIT, 20% LTCG, CA top bracket
5. **Low income, single, age 60, $200k NW, FL** — Full ACA subsidy, 0% LTCG, no state tax
6. **RMD-heavy, single, age 75, $2M trad IRA, MN** — Large RMDs push into IRMAA, MN state tax
7. **Coast FIRE, MFJ, age 40, $500k NW, WA** — Long horizon, no state tax, ACA years
8. **Barista FIRE, single, age 50, $1M NW, OR** — Part-time income, ACA subsidy, OR state tax

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| All 8 personas | Fixed seed, fixed market returns (deterministic mode) | Exact match on tax, IRMAA, ACA, state tax, final NW | Cross-validated against IRS pubs, CMS, KFF |
| Regression gate | Any code change to `calc/` | All 8 golden tests pass on CI push | CI hard gate — no merge on failure |

---

### Task 1B.3 — Annual tax data refresh script + CI gate

Create `scripts/update-tax-data.ts` that validates the tax bracket data in the codebase against a known-good source each year. The script should fail CI in January if the previous year's data hasn't been updated. Validates: federal brackets, LTCG thresholds, IRMAA tiers, FPL guidelines, standard deduction amounts, state brackets.

**Tags:** `devops` · `CI`

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Data is current | Run in June 2026, 2026 data present | Script passes, exit code 0 | IRS Rev. Proc. 2025-XX |
| Data is stale | Run in Jan 2027, only 2026 data present | Script fails, exit code 1, message: "2027 brackets not found" | CI log output |
| Partial update | 2027 federal updated, state brackets still 2026 | Script fails, lists stale state files | CI log output |

---

## Sprint 2 — Roth Conversion + Withdrawal Strategies

**Weeks 7–10 · The most-requested FIRE features**

Roth conversion and configurable drawdown order are the most-requested features across the FIRE community. They must be built on accurate tax math — shipping them before Sprint 1 completes would produce systematically wrong recommendations. The design goal is a multi-year schedule, not a single-year toggle.

> **⚠ Convex Migration:** This sprint adds new schema fields. Apply the [Convex Migration / Rollback Checklist](#convex-migration--rollback-checklist) to every PR.

---

### Task 2.1 — Roth conversion data model + Convex schema

Add a `rothConversionStrategy` field to the plan schema in Convex. Support three modes: `'none'`, `'fixed'` (user specifies annual amount per year range), and `'fillBracket'` (auto-convert up to a target tax bracket ceiling). Add the Zod transformer to pipe this into `SimulatorInputs`.

**Tags:** `convex schema` · `zod` · `migration checklist`

<details>
<summary>Code snippet — <code>convex/schema.ts</code> addition</summary>

```typescript
rothConversionStrategy: v.optional(v.object({
  mode: v.union(v.literal('none'), v.literal('fixed'), v.literal('fillBracket')),
  fixedSchedule: v.optional(v.array(v.object({
    startYear: v.number(),
    endYear: v.number(),
    annualAmount: v.number(),
  }))),
  targetBracket: v.optional(v.number()), // e.g., 0.22 for 22% bracket ceiling
  startAge: v.optional(v.number()),
  endAge: v.optional(v.number()),       // typically 72 (before RMDs)
})),
```

</details>

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| No strategy set | Existing plan without field | `rothConversionStrategy` defaults to `undefined`, engine skips | Backward compat test |
| Fixed schedule | $50k/yr from age 55 to 72 | Zod transformer produces valid `SimulatorInputs` | TypeScript compile + unit test |
| Fill bracket mode | Target 22% bracket | Zod transformer produces valid `SimulatorInputs` | TypeScript compile + unit test |

---

### Task 2.2 — Roth conversion engine logic

Implement the multi-year Roth conversion optimizer in `src/lib/calc/account.ts`. In each simulated year, when the strategy is `fillBracket`, compute the gap between current ordinary income and the top of the target bracket, then convert that amount from Traditional IRA to Roth IRA. Track cost basis separately for the 5-year Roth seasoning rule. Add `rothConversion: number` and `rothTaxCost: number` to `SimulationDataPoint`.

**Tags:** `calc` · `unit tests required`

<details>
<summary>Code snippet — <code>src/lib/calc/account.ts</code></summary>

```typescript
export function calcRothConversion(
  traditionalBalance: number,
  ordinaryIncome: number,
  targetBracketCeiling: number,
  brackets: TaxBracket[],
  filingStatus: 'single' | 'married',
  standardDeduction: number,
): { conversionAmount: number; taxCost: number } {
  const taxableIncome = Math.max(0, ordinaryIncome - standardDeduction);
  const ceilingIncome = getBracketCeiling(targetBracketCeiling, brackets, filingStatus);
  const room = Math.max(0, ceilingIncome - taxableIncome);
  const conversionAmount = Math.min(room, traditionalBalance);
  const taxCost = calcMarginalTax(taxableIncome, conversionAmount, brackets);
  return { conversionAmount, taxCost };
}
```

</details>

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Fill 22% bracket, MFJ | Ordinary=$60k, deduction=$30k, trad=$500k, target=0.22 | Convert ≈ $64,150 (top of 22% = $94,300 taxable), tax ≈ $14,113 | IRS 2026 brackets |
| Fill 12% bracket, single | Ordinary=$20k, deduction=$15k, trad=$200k, target=0.12 | Convert ≈ $41,775 (top of 12% = $46,775 taxable), tax ≈ $5,013 | IRS 2026 brackets |
| Traditional balance exhausted | Ordinary=$50k, trad=$10k, target=0.22 | Convert $10k (balance-limited), tax computed on $10k marginal | Unit test |
| Fixed schedule | $50k/yr, age 58, year 3 of schedule | Convert exactly $50k, compute marginal tax | Unit test |
| 5-year seasoning tracking | Conversions in years 1–3 | Year-1 conversion not accessible penalty-free until year 6 | IRS Pub 590-B ordering rules |

---

### Task 2.3 — Configurable withdrawal strategy engine

Implement withdrawal ordering in `src/lib/calc/account.ts`. Support at minimum: (1) **Conventional** (taxable → tax-deferred → Roth), (2) **Tax-optimized** (fill low brackets from tax-deferred, then taxable, then Roth), (3) **Pro-rata** (proportional from all account types), (4) **Custom** (user-defined priority list). Each year, the engine determines spending need, then draws from accounts in the selected order.

**Tags:** `calc` · `unit tests required`

<details>
<summary>Code snippet — <code>src/lib/calc/account.ts</code></summary>

```typescript
export type WithdrawalStrategy = 'conventional' | 'taxOptimized' | 'proRata' | 'custom';

export interface AccountPool {
  taxable: number;
  taxDeferred: number;
  roth: number;
}

export function executeWithdrawal(
  need: number,
  pool: AccountPool,
  strategy: WithdrawalStrategy,
  customOrder?: ('taxable' | 'taxDeferred' | 'roth')[],
): { withdrawals: Record<string, number>; remainingPool: AccountPool } {
  const order: ('taxable' | 'taxDeferred' | 'roth')[] =
    strategy === 'conventional'   ? ['taxable', 'taxDeferred', 'roth'] :
    strategy === 'taxOptimized'   ? ['taxDeferred', 'taxable', 'roth'] :
    strategy === 'custom'         ? (customOrder ?? ['taxable', 'taxDeferred', 'roth']) :
    ['taxable', 'taxDeferred', 'roth']; // pro-rata handled separately

  if (strategy === 'proRata') {
    return executeProRataWithdrawal(need, pool);
  }

  let remaining = need;
  const withdrawals: Record<string, number> = { taxable: 0, taxDeferred: 0, roth: 0 };
  const newPool = { ...pool };

  for (const acct of order) {
    const draw = Math.min(remaining, newPool[acct]);
    withdrawals[acct] = draw;
    newPool[acct] -= draw;
    remaining -= draw;
    if (remaining <= 0) break;
  }

  return { withdrawals, remainingPool: newPool };
}
```

</details>

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Conventional order | Need=$80k, taxable=$100k, trad=$500k, roth=$200k | Draw $80k from taxable | Bogleheads withdrawal order wiki |
| Conventional — taxable exhausted | Need=$80k, taxable=$30k, trad=$500k, roth=$200k | Draw $30k taxable + $50k trad | Bogleheads wiki |
| Tax-optimized | Need=$50k, taxable=$200k, trad=$500k, roth=$200k | Draw $50k from trad (fill low bracket) | Tax-optimized strategy logic |
| Pro-rata | Need=$60k, taxable=$100k, trad=$200k, roth=$100k | Draw $15k/$30k/$15k (proportional) | Pro-rata definition |
| Custom order | Need=$40k, order=[roth, taxable, trad] | Draw $40k from Roth first | User-defined |

---

### Task 2.4 — Withdrawal strategy Convex schema + UI

Add `withdrawalStrategy` field to the plan schema in Convex. Build a settings panel in the plan editor UI where users select their strategy and (for custom mode) drag-and-drop reorder account types. Wire through Zod transformers to `SimulatorInputs`.

**Tags:** `convex schema` · `UI` · `migration checklist`

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Default — no selection | Existing plan | Defaults to `'conventional'` | Backward compat test |
| UI — strategy picker | User selects "Tax-optimized" | Plan saves, simulation re-runs with new strategy | Playwright E2E |
| UI — custom drag-drop | User reorders to Roth→Taxable→Trad | `customOrder` array saved correctly | Playwright E2E |

---

### Task 2.5 — RMD enforcement in withdrawal engine

Required Minimum Distributions (RMDs) must be enforced before any voluntary withdrawal strategy executes. Starting at age 73 (SECURE 2.0), compute the RMD from each Traditional IRA / 401(k) using the Uniform Lifetime Table divisors. The RMD is added to ordinary income for tax purposes. If the RMD exceeds the spending need, the excess goes to the taxable account.

**Tags:** `calc` · `unit tests required`

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Age 73, first RMD | Trad balance=$1M, age=73, divisor=26.5 | RMD = $37,736 | IRS Pub 590-B Table III |
| Age 80 | Trad balance=$800k, age=80, divisor=20.2 | RMD = $39,604 | IRS Pub 590-B Table III |
| RMD exceeds spending need | RMD=$40k, spending need=$30k | $30k covers spending, $10k to taxable reinvestment | Engine logic |
| Pre-RMD age | Trad balance=$500k, age=65 | RMD = $0 | SECURE 2.0 age 73 start |

---

### Task 2.6 — Roth + withdrawal strategy comparison chart

Add a comparison view to the simulation results UI that shows the impact of different Roth conversion and withdrawal strategy combinations. Display a table/chart comparing: total lifetime taxes paid, final net worth at 50th percentile, and IRMAA years triggered for at least 3 strategy combinations (no conversion + conventional, fill-22% + conventional, fill-22% + tax-optimized).

**Tags:** `UI` · `Recharts`

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Comparison renders | Plan with trad IRA + taxable | Chart shows 3+ strategy columns with $ values | Visual + Playwright snapshot |
| Correct delta | Strategy A vs B | Lifetime tax difference matches manual calc within 1% | Golden-file persona #4 |

---

## Sprint 3 — AI Advisor Upgrade

**Weeks 11–14 · From "knows your plan" to "advises on your plan"**

The existing AI chat in `convex/utils/sys_prompt_utils.ts` knows the plan inputs and simulation results. After Sprint 1 and 2, the simulation produces IRMAA costs, ACA subsidy amounts, Roth conversion schedules, and withdrawal strategy outcomes — all of which the AI can now reason about specifically. Sprint 3 upgrades the AI from "knows your plan" to "advises on your plan."

---

### Task 3.1 — Enriched system prompt with tax + strategy context

Update `sys_prompt_utils.ts` to inject Sprint 1–2 data into the AI system prompt: IRMAA surcharge amounts and trigger years, ACA subsidy amounts and FPL ratio, Roth conversion schedule and cumulative tax cost, withdrawal strategy name and lifetime tax comparison, RMD schedule, state tax burden. Structure the prompt with labeled sections so the AI can reference specific data points.

**Tags:** `ai` · `prompt engineering`

<details>
<summary>Code snippet — <code>convex/utils/sys_prompt_utils.ts</code> addition</summary>

```typescript
function buildTaxContext(simResults: SimulationResults): string {
  const irmaaYears = simResults.dataPoints
    .filter(dp => dp.irmaaPartB > 0)
    .map(dp => `${dp.year}: $${dp.irmaaPartB + dp.irmaaPartD}/yr`);

  const acaYears = simResults.dataPoints
    .filter(dp => dp.acaSubsidy > 0)
    .map(dp => `${dp.year}: subsidy $${dp.acaSubsidy}, net premium $${dp.acaNetPremium}`);

  const rothYears = simResults.dataPoints
    .filter(dp => dp.rothConversion > 0)
    .map(dp => `${dp.year}: convert $${dp.rothConversion}, tax cost $${dp.rothTaxCost}`);

  return `
## Tax Analysis
- Filing status: ${simResults.filingStatus}
- State: ${simResults.stateOfResidence}
- Withdrawal strategy: ${simResults.withdrawalStrategy}

### IRMAA Surcharges
${irmaaYears.length > 0 ? irmaaYears.join('\n') : 'No IRMAA surcharges projected.'}

### ACA Subsidies (pre-Medicare years)
${acaYears.length > 0 ? acaYears.join('\n') : 'No ACA subsidy years (employer coverage or Medicare throughout).'}

### Roth Conversion Schedule
${rothYears.length > 0 ? rothYears.join('\n') : 'No Roth conversions scheduled.'}
  `.trim();
}
```

</details>

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Prompt includes IRMAA | Plan with Medicare years + IRMAA | System prompt contains "IRMAA Surcharges" section with $ amounts | Manual inspection + unit test |
| Prompt includes ACA | Plan with early retirement + ACA | System prompt contains "ACA Subsidies" section | Manual inspection + unit test |
| Prompt includes Roth | Plan with fill-bracket Roth strategy | System prompt contains "Roth Conversion Schedule" section | Manual inspection + unit test |
| No tax events | Young accumulator, no ACA/IRMAA/Roth | Sections show "No ... projected" messages | Unit test |

---

### Task 3.2 — Proactive AI insights (push notifications)

Add a `generateInsights` function that analyzes simulation results and produces 3–5 actionable insights without the user asking. Examples: "You trigger IRMAA in 2034 — a $15k Roth conversion in 2032 would avoid $4,200 in surcharges," or "Switching from conventional to tax-optimized withdrawal saves $47k in lifetime taxes." Surface these as a card above the chat input. Insights are generated on simulation completion and cached.

**Tags:** `ai` · `UI` · `convex`

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| IRMAA avoidance insight | Plan that triggers IRMAA by $5k in one year | Insight suggests Roth conversion to avoid IRMAA | Logic validation |
| Withdrawal strategy insight | Plan with conventional order + large trad IRA | Insight shows lifetime tax savings from tax-optimized | Comparison engine output |
| ACA optimization insight | Early retiree with income near 400% FPL cliff | Insight suggests income management for subsidy | ACA formula |
| Insight card renders | Any plan | 3–5 insight cards visible above chat | Playwright E2E |

---

### Task 3.3 — Social Security optimization guidance

Add Social Security claiming age analysis. Run the simulation at 9 claiming ages (62–70) and compare lifetime benefit outcomes. The AI prompt receives the optimal claiming age and the dollar difference versus the user's current selection. Surface a chart showing cumulative SS benefit by claiming age with a breakeven point marker.

**Tags:** `calc` · `ai` · `UI`

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| 9 claiming ages computed | PIA=$2,500/mo at FRA 67 | Array of 9 cumulative lifetime benefits | SSA actuarial tables |
| Breakeven displayed | Claim at 62 vs 67 | Breakeven age ≈ 80 shown on chart | SSA breakeven calculator |
| AI prompt includes SS | Any plan with SS | Prompt says "Optimal claiming age: X, saves $Y vs current selection" | Unit test on prompt builder |
| Performance gate | 9 runs | Total < 5s (each run is subset of full sim) | Vitest benchmark |

---

### Task 3.4 — Chat UX improvements

Add conversation memory (last 10 messages persisted in Convex), suggested follow-up questions after each AI response, and a "Show me the math" button that expands the AI's reasoning with specific data points and formulas used. Improve the chat panel's mobile responsiveness.

**Tags:** `UI` · `convex` · `ai`

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Message persistence | User sends 3 messages, refreshes page | All 3 messages + responses visible | Playwright E2E |
| Suggested questions | AI responds about Roth conversions | 2–3 follow-up questions shown as chips | Playwright E2E |
| "Show me the math" | AI says "you'll save $47k" | Expandable section with formula + data points | Playwright E2E |
| Mobile layout | 375px viewport | Chat panel fills screen, input accessible | Playwright mobile preset |

---

## Sprint 4 — Couple Planning

**Weeks 15–20 · 6 weeks · Data model rewrite for multi-person support**

Adding a second person to the plan is not a simple field addition — it requires rethinking the data model, the simulation engine's person loop, the tax filing status logic, and the UI. Start with the data model, get it right, then build everything else on top. Rushing this breaks all preceding work.

> **⚠ Convex Migration:** This sprint is a significant schema change. Apply the [Convex Migration / Rollback Checklist](#convex-migration--rollback-checklist) rigorously. All new fields must be optional to maintain backward compatibility with existing single-person plans.

> **⚠ Architectural Warning:** This sprint touches every layer of the stack. Budget 6 weeks. Do NOT parallelize with other sprints.

---

### Task 4.1 — Multi-person data model + Convex schema

Refactor the Convex schema to support a `people` array (1 or 2 entries) on each plan. Each person has their own: name, date of birth, retirement age, Social Security benefit, Medicare start age, life expectancy, and account ownership. Accounts, incomes, and debts gain an `ownerId` field linking to a person. The plan gains a `filingStatus` field with transitions: `'single'`, `'marriedFilingJointly'`, `'marriedFilingSeparately'`. Write idempotent migration scripts for existing single-person plans.

**Tags:** `convex schema` · `migration checklist` · `zod`

<details>
<summary>Code snippet — <code>convex/schema.ts</code> refactor</summary>

```typescript
// Person sub-document
const personSchema = v.object({
  id: v.string(),                    // UUID
  name: v.string(),
  dateOfBirth: v.string(),           // ISO date
  retirementAge: v.number(),
  lifeExpectancy: v.number(),
  socialSecurityBenefit: v.optional(v.number()),   // monthly PIA at FRA
  socialSecurityClaimAge: v.optional(v.number()),
  medicareStartAge: v.optional(v.number()),         // default 65
});

// Updated plan schema
export default defineSchema({
  plans: defineTable({
    // ... existing fields ...
    people: v.optional(v.array(personSchema)),       // 1 or 2 entries
    filingStatus: v.optional(v.union(
      v.literal('single'),
      v.literal('marriedFilingJointly'),
      v.literal('marriedFilingSeparately'),
    )),
    // Accounts, incomes, debts gain ownerId
  }),
  accounts: defineTable({
    // ... existing fields ...
    ownerId: v.optional(v.string()),  // links to person.id; null = shared
  }),
});
```

</details>

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Existing single-person plan | Plan created before Sprint 4 | Migration creates `people[0]` from existing fields, `ownerId` set on all accounts | Migration script test |
| New couple plan | User adds second person | `people.length === 2`, all fields populated | Playwright E2E |
| Rollback | Run rollback script | Plan reverts to single-person fields, no data loss | Rollback script test |
| Idempotent | Run migration twice | Same result both times, no duplicates | Migration script test |

---

### Task 4.2 — Simulation engine person loop

Refactor `simulation-engine.ts` to iterate over each person in the `people` array per simulated year. Each person has independent: age progression, Social Security benefit start, Medicare enrollment, RMD calculation, and account growth. Shared computations: combined income for tax purposes (MFJ), combined spending needs, shared expense allocation.

**Tags:** `engine` · `calc`

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Single person — no regression | Existing single-person plan | Identical output to pre-Sprint-4 engine | Golden-file tests 1–8 |
| Couple — independent SS | Person A claims at 62, Person B at 70 | SS benefits start in different sim years | SSA claiming rules |
| Couple — combined RMDs | Person A age 75 ($1M trad), Person B age 73 ($500k trad) | Independent RMDs, combined for tax | IRS Pub 590-B |
| Couple — age gap | Person A age 65, Person B age 58 | Person B has ACA years while Person A is on Medicare | Engine logic |
| Performance | 2-person plan, 1000 runs | Completes in < 7s (≤ 40% overhead vs single) | Vitest benchmark |

---

### Task 4.3 — Filing status transitions on life events

Implement filing status transitions mid-simulation. On first death (based on life expectancy): MFJ → Single for the surviving spouse. In the year of death, the survivor can still file MFJ. The year after, they file Single with the surviving spouse's income only. Handle the step-up in cost basis on inherited assets. Handle survivor Social Security benefit (higher of own or deceased spouse's).

**Tags:** `calc` · `unit tests required`

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| First death — filing status | Person A dies year 15, MFJ plan | Year 15: MFJ, year 16+: Single | IRS filing status rules |
| Survivor SS benefit | Person A PIA=$3k, Person B PIA=$1.5k, A dies | Survivor gets $3k/mo (higher of two) | SSA survivor rules |
| Step-up in basis | Person A dies, taxable account $500k, basis $300k | Inherited basis = $500k FMV at death | IRC §1014 |
| Survivor expense adjustment | Couple expenses $80k/yr | After first death, reduce to ~70% ($56k) | Configurable parameter |

---

### Task 4.4 — Couple planning UI

Build the multi-person UI: person entry form (add/remove second person), per-person account assignment, combined vs individual views in the simulation results. Add a side-by-side Social Security claiming comparison for both people. Update all existing UI components to gracefully handle 1 or 2 people.

**Tags:** `UI` · `Playwright`

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Add second person | Click "Add spouse/partner" | Second person form appears, saves to Convex | Playwright E2E |
| Remove second person | Click "Remove" on person 2 | Plan reverts to single-person, accounts unlinked | Playwright E2E |
| Account ownership | Assign IRA to Person B | Account tagged with Person B's `ownerId` | Playwright E2E |
| Combined chart | Couple plan | Net worth chart shows combined + individual breakdowns | Visual + Playwright snapshot |

---

### Task 4.5 — Full regression suite post-refactor

Re-run **all** Sprint 1–3 golden-file tests and the 8 canonical integration test personas against the refactored multi-person simulation engine (with single-person plans). Verify that outputs are **byte-identical** to pre-Sprint-4 baselines. This catches any regression introduced by the data model rewrite. Add 4 new couple-specific golden-file personas:

1. **Couple, same age, both retire early, TX** — Joint ACA subsidy, no state tax
2. **Couple, 10-year age gap, CA** — Staggered Medicare, ACA/IRMAA overlap years
3. **Couple, one high earner, NY** — Asymmetric Roth conversion, survivor benefit switch
4. **Couple, both 73+, MN** — Dual RMDs, combined IRMAA, state tax

**Tags:** `tests` · `CI gate` · `regression`

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| All 8 single-person golden tests | Same inputs as Sprint 1B | **Byte-identical** outputs to pre-Sprint-4 baseline | CI hard gate |
| 4 new couple personas | Fixed seed, deterministic mode | Exact match on combined tax, IRMAA, ACA, NW | Cross-validated against IRS pubs |
| No TypeScript errors | Full codebase | `npm run typecheck` passes | CI gate |
| Performance gate | 1000 runs, single-person plan | Still < 5s | Vitest benchmark |

---

### Task 4.6 — Couple planning Playwright E2E suite

Write comprehensive Playwright end-to-end tests covering the couple planning workflow:

1. Create a new plan → add second person → fill in details → save
2. Assign accounts to each person → verify ownership persists on reload
3. Run simulation → verify combined net worth chart renders
4. Remove second person → verify graceful revert to single-person mode
5. Verify mobile responsiveness of the couple planning UI
6. Verify AI chat references both people in responses

**Tags:** `tests` · `E2E` · `Playwright`

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Full workflow | Steps 1–6 above | All 6 tests pass | Playwright test runner |
| Cross-browser | Chrome + Firefox + Safari | All tests pass on all browsers | Playwright multi-browser config |
| Mobile | 375px viewport | All UI elements accessible and functional | Playwright mobile preset |

---

## Sprint 5 — OWL Optimization Engine Integration

**Weeks 21–26 · 6 weeks · The "Optimize" button**

All preceding sprints improve Ignidash's own simulation engine. Sprint 5 adds OWL's MILP optimizer as a parallel computation path — the "Optimize" button that produces the provably-optimal multi-year strategy. This is the feature that would make the combination genuinely novel in the market. It depends on the full plan data model being stable after Sprint 4.

> **⚠ Convex Migration:** This sprint adds async job tracking tables. Apply the [Convex Migration / Rollback Checklist](#convex-migration--rollback-checklist) to every PR.

---

### Task 5.1 — OWL microservice (FastAPI sidecar)

Deploy OWL as a FastAPI sidecar service. The service exposes two endpoints: `POST /optimize` (accepts an Ignidash plan translated to OWL format, returns a job ID) and `GET /optimize/{jobId}` (returns job status and results). OWL runs as a Docker container with Gurobi/HiGHS solver. Add health check and graceful shutdown.

**Tags:** `backend` · `Python` · `Docker`

<details>
<summary>Code snippet — <code>api/owl/main.py</code></summary>

```python
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import uuid
from typing import Optional
from owl_solver import run_optimization  # OWL's entry point

app = FastAPI(title="Ignidash-OWL Bridge")

jobs: dict[str, dict] = {}

class OptimizeRequest(BaseModel):
    plan: dict          # Ignidash plan translated to OWL format
    horizon: int        # number of years
    objective: str      # 'maxNetWorth' | 'minTax' | 'maxSpending'

class JobStatus(BaseModel):
    job_id: str
    status: str         # 'pending' | 'running' | 'completed' | 'failed'
    result: Optional[dict] = None
    error: Optional[str] = None

@app.post("/optimize", response_model=JobStatus)
async def optimize(req: OptimizeRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "pending", "result": None, "error": None}
    background_tasks.add_task(execute_optimization, job_id, req)
    return JobStatus(job_id=job_id, status="pending")

@app.get("/optimize/{job_id}", response_model=JobStatus)
async def get_status(job_id: str):
    if job_id not in jobs:
        return JobStatus(job_id=job_id, status="failed", error="Job not found")
    j = jobs[job_id]
    return JobStatus(job_id=job_id, **j)

async def execute_optimization(job_id: str, req: OptimizeRequest):
    jobs[job_id]["status"] = "running"
    try:
        result = run_optimization(req.plan, req.horizon, req.objective)
        jobs[job_id] = {"status": "completed", "result": result, "error": None}
    except Exception as e:
        jobs[job_id] = {"status": "failed", "result": None, "error": str(e)}

@app.get("/health")
async def health():
    return {"status": "ok"}
```

</details>

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Health check | `GET /health` | `{"status": "ok"}`, 200 | Integration test |
| Submit job | Valid plan JSON | Job ID returned, status = "pending" | Integration test |
| Job completes | Simple 10-year plan | Status transitions: pending → running → completed | Integration test |
| Job fails | Invalid plan JSON | Status = "failed", error message populated | Integration test |
| Container restart | Kill container, restart | Service recovers, health check passes within 10s | Docker compose test |

---

### Task 5.2 — Ignidash-to-OWL translation layer

Build `api/owl/translate.py` — the bidirectional translation between Ignidash's plan data model and OWL's input format. This is the primary maintenance surface. The translation is **lossy** for features OWL doesn't model (e.g., Monte Carlo variance, ACA subsidies). Document every lossy mapping explicitly.

**Tags:** `Python` · `translation` · `unit tests required`

<details>
<summary>Code snippet — <code>api/owl/translate.py</code></summary>

```python
from dataclasses import dataclass
from typing import Literal

@dataclass
class OWLAccount:
    label: str
    balance: float
    account_type: Literal['taxable', 'tax_deferred', 'roth']
    owner: str                # person name
    annual_contribution: float = 0

@dataclass
class OWLPlan:
    people: list[dict]        # name, birth_year, retirement_year, life_expectancy
    accounts: list[OWLAccount]
    incomes: list[dict]       # source, amount, start_year, end_year, taxable
    expenses: list[dict]      # category, amount, start_year, end_year
    filing_status: str
    state: str
    horizon: int
    objective: str

# Translation gaps (lossy mappings):
# - Monte Carlo variance → OWL uses deterministic expected returns
# - ACA subsidies → OWL does not model; omitted from translation
# - Custom withdrawal order → OWL optimizes this; user preference ignored
# - State tax granularity → OWL uses flat effective rate approximation

def ignidash_to_owl(plan: dict) -> OWLPlan:
    """Translate an Ignidash plan to OWL format."""
    people = []
    for p in plan.get('people', [plan]):
        people.append({
            'name': p.get('name', 'Primary'),
            'birth_year': _parse_year(p['dateOfBirth']),
            'retirement_year': _parse_year(p['dateOfBirth']) + p['retirementAge'],
            'life_expectancy': p['lifeExpectancy'],
        })

    accounts = []
    for a in plan.get('accounts', []):
        accounts.append(OWLAccount(
            label=a['name'],
            balance=a['balance'],
            account_type=_map_account_type(a['type']),
            owner=_resolve_owner(a.get('ownerId'), people),
            annual_contribution=a.get('annualContribution', 0),
        ))

    # ... incomes, expenses, filing_status, state similarly mapped ...

    return OWLPlan(
        people=people,
        accounts=accounts,
        incomes=_translate_incomes(plan),
        expenses=_translate_expenses(plan),
        filing_status=plan.get('filingStatus', 'single'),
        state=plan.get('stateOfResidence', 'TX'),
        horizon=max(p['life_expectancy'] - _parse_year(p['dateOfBirth'])
                     for p in plan.get('people', [plan])),
        objective='maxNetWorth',
    )

def owl_to_ignidash(owl_result: dict) -> dict:
    """Translate OWL optimizer output back to Ignidash format for display."""
    return {
        'yearlyPlan': [
            {
                'year': yr['year'],
                'rothConversion': yr.get('roth_conversion', 0),
                'withdrawals': yr.get('withdrawals', {}),
                'taxLiability': yr.get('total_tax', 0),
                'netWorth': yr.get('net_worth', 0),
            }
            for yr in owl_result.get('yearly_plan', [])
        ],
        'totalLifetimeTax': owl_result.get('total_lifetime_tax', 0),
        'finalNetWorth': owl_result.get('final_net_worth', 0),
        'objectiveValue': owl_result.get('objective_value', 0),
    }

def _parse_year(dob: str) -> int:
    return int(dob[:4])

def _map_account_type(t: str) -> str:
    mapping = {'traditional_ira': 'tax_deferred', '401k': 'tax_deferred',
               'roth_ira': 'roth', 'roth_401k': 'roth',
               'brokerage': 'taxable', 'savings': 'taxable'}
    return mapping.get(t, 'taxable')

def _resolve_owner(owner_id: str | None, people: list[dict]) -> str:
    if not owner_id or not people:
        return people[0]['name'] if people else 'Primary'
    for p in people:
        if p.get('id') == owner_id:
            return p['name']
    return people[0]['name']
```

</details>

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Single-person plan | Standard Ignidash plan | Valid `OWLPlan` object with 1 person | Unit test |
| Couple plan | 2-person Ignidash plan | Valid `OWLPlan` with 2 people, correct account ownership | Unit test |
| Round-trip | Translate → optimize → translate back | Back-translated result has all required Ignidash display fields | Unit test |
| Lossy mapping documented | ACA subsidy in source plan | Translation log notes "ACA subsidies not modeled by OWL" | Unit test on warnings |
| Account type mapping | All 6 Ignidash account types | Correctly mapped to 3 OWL types | Parameterized unit test |

---

### Task 5.3 — Convex async job tracking + polling

Add a `optimizationJobs` table to Convex for tracking OWL job state. When the user clicks "Optimize," a Convex action calls the OWL API, creates a job record, and starts polling. The UI shows a progress indicator. On completion, the optimized yearly plan is stored alongside the simulation results for comparison.

**Tags:** `convex schema` · `migration checklist` · `UI`

<details>
<summary>Code snippet — <code>convex/optimizationJobs.ts</code></summary>

```typescript
import { mutation, query, action } from './_generated/server';
import { v } from 'convex/values';

export const createJob = mutation({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    return await ctx.db.insert('optimizationJobs', {
      planId,
      status: 'pending',
      createdAt: Date.now(),
      result: undefined,
      error: undefined,
    });
  },
});

export const updateJob = mutation({
  args: {
    jobId: v.id('optimizationJobs'),
    status: v.string(),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { jobId, status, result, error }) => {
    await ctx.db.patch(jobId, { status, result, error });
  },
});

export const getJob = query({
  args: { jobId: v.id('optimizationJobs') },
  handler: async (ctx, { jobId }) => {
    return await ctx.db.get(jobId);
  },
});

export const submitOptimization = action({
  args: { planId: v.id('plans') },
  handler: async (ctx, { planId }) => {
    const plan = await ctx.runQuery('plans:get', { planId });
    const jobId = await ctx.runMutation('optimizationJobs:createJob', { planId });

    // Call OWL API (non-blocking)
    const response = await fetch(`${process.env.OWL_API_URL}/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, horizon: 40, objective: 'maxNetWorth' }),
    });
    const { job_id: owlJobId } = await response.json();

    // Start polling
    await ctx.runMutation('optimizationJobs:updateJob', {
      jobId, status: 'running',
    });

    // Polling handled by scheduled function (see pollOptimization)
    await ctx.scheduler.runAfter(2000, 'optimizationJobs:pollResult', {
      jobId, owlJobId,
    });
  },
});
```

</details>

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Job creation | Click "Optimize" | Job record in Convex with status "pending" | Convex dashboard |
| Polling cycle | Job submitted | Status transitions: pending → running → completed | Convex logs |
| Result stored | OWL returns solution | `result` field populated with yearly plan | Query test |
| Error handling | OWL returns error | `error` field populated, UI shows error message | Error injection test |
| UI progress | Job running | Spinner/progress bar visible | Playwright E2E |

---

### Task 5.4 — Optimize tab UI + comparison view

Add an "Optimize" tab to the simulation results panel. When clicked, it triggers the OWL optimization job. On completion, display the OWL-optimized strategy side-by-side with Ignidash's simulation: yearly Roth conversions, withdrawals, tax liability, and final net worth. Highlight the delta (savings) between the user's current strategy and OWL's optimal strategy.

**Tags:** `UI` · `Recharts`

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Optimize button | Plan loaded | "Optimize" tab visible in results panel | Playwright E2E |
| Side-by-side display | OWL result available | Two columns: "Your Strategy" vs "Optimized" with Roth, withdrawal, tax rows | Playwright snapshot |
| Delta highlight | Optimized saves $50k lifetime tax | Green badge: "Saves $50,000 in lifetime taxes" | Visual + Playwright |
| No OWL available | OWL service down, feature flag off | "Optimize" tab hidden or shows "Coming soon" | Feature flag test |

---

### Task 5.5 — Graceful degradation + feature flag

Add a `NEXT_PUBLIC_OWL_ENABLED` environment variable / feature flag. When disabled, the Optimize tab is hidden entirely — no errors, no broken UI. When the OWL service is enabled but returns an error, show a user-friendly message with a retry button. Log errors to the Convex audit log for debugging.

**Tags:** `devops` · `UI` · `error handling`

#### Acceptance Criteria

| Scenario | Inputs | Expected Output | Verification Source |
|----------|--------|-----------------|---------------------|
| Feature flag off | `OWL_ENABLED=false` | No Optimize tab rendered | Playwright E2E |
| Feature flag on, service healthy | `OWL_ENABLED=true`, OWL up | Optimize tab visible and functional | Playwright E2E |
| Feature flag on, service down | `OWL_ENABLED=true`, OWL unreachable | Error message + retry button, no crash | Playwright E2E |
| Timeout | OWL takes > 30s | Job marked as timed out, user notified | Polling logic test |

---

## Testing Strategy

> Cross-cutting concern applied to all sprints.

### Golden-File Tests

Every function in `taxes.ts`, `state-taxes.ts`, and `account.ts` must have golden-file tests: fixed inputs producing verified outputs. The verification source is the IRS publication for that year (Publication 590-B for IRA rules, Publication 969 for HSA, the IRMAA fact sheet from CMS). Run these on every CI push as a hard gate — no merges that break a golden test.

### Integration Tests

Eight canonical full-plan integration tests (Task 1B.2) plus four couple-specific personas (Task 4.5) that run the complete simulation and assert on key outputs. These catch regressions where a change in one module unexpectedly alters another's output.

### Performance Tests

Per the [Performance Budget](#performance-budget) section: 1,000-run Monte Carlo must complete in **< 5 seconds**. Benchmarks run on every CI push. Soft gate in Sprint 1B, hard gate from Sprint 2 onward.

### Annual Tax Data Refresh

The `scripts/update-tax-data.ts` script (Task 1B.3) validates bracket data against known-good sources. CI fails in January if prior-year data hasn't been updated.

### Definition of Done (per sprint)

A sprint is complete when:

- [ ] All tasks have passing unit tests
- [ ] Golden-file tests pass
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] No lint errors (`npm run lint`)
- [ ] Performance benchmark passes (`npm run bench` < 5,000ms)
- [ ] The simulator runs end-to-end in Playwright against the new features
- [ ] The help center documentation has been updated with the new features

---

*Generated from the Ignidash structured improvement plan · June 2026*
*Implements 5 readiness recommendations: Sprint 1 split, Sprint 4 expanded, quantitative acceptance criteria, <5s performance budget, Convex migration checklist*
