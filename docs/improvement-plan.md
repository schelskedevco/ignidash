# Ignidash Ordered Improvement Plan

A prioritized, sequenced roadmap for closing feature gaps across all competitive dimensions. Ordered for maximum user impact with minimum engineering risk.

---

## Pre-Flight: Immediate Quick Wins (1-3 Days Each)

> These are blocked features already wired in the schema and code. They require minimal work — no new engine code, just wiring up what's already there. Do these **before** Tier 1.

### P-1: Unlock Pension Income

**What:** Remove the validation refine blocking the `pension` income type. Add a `case 'pension':` handler in the `IncomesProcessor`.

**Open source to use:** None needed — the plumbing exists. The `default` case in `IncomesProcessor.process()` already handles pension income correctly for taxation (ordinary income). Only needs:

- Remove the `refine` blocking pension in `income-form-schema.ts`
- Add `case 'pension':` with withholding support in `src/lib/calc/incomes.ts`
- Enable the disabled `<option>` in `income-dialog.tsx`

**Effort:** 1 day.  
**Impact:** Unlocks users with government (CSRS/FERS), military, and corporate pensions.  
**Dependencies:** None.

### P-2: Unlock Self-Employment Income

**What:** Remove the validation refine blocking the `selfEmployment` income type. Add SE tax calculation in `IncomesProcessor`.

**Open source to use:** None needed — `IncomeType.selfEmployment` already exists.

**Effort:** 1-2 days.  
**Impact:** Unlocks freelancers, contractors, and small business owners.  
**Dependencies:** FICA accuracy fixes (P-3) should be done first for correct SE tax.

### P-3: FICA Accuracy Fixes

**What:** Add Social Security wage base cap (~$176k for 2026) and Additional Medicare Tax (0.9% on wages above $200k/$250k).

**Open source to use:** None needed — IRS wage bases are published annually. Reference data structure:

```typescript
// Add to src/lib/calc/tax-data/
export const SS_WAGE_BASE = { 2026: 176100 };
export const ADDITIONAL_MEDICARE_THRESHOLDS = {
  single: 200000,
  mfj: 250000,
  hoh: 200000,
};
```

**Effort:** 2-3 days.  
**Impact:** More accurate tax estimates for all users. Critical prerequisite for self-employment income (P-2).  
**Dependencies:** None.

### P-4: Property Tax on Physical Assets

**What:** Add `propertyTaxRate` field to `PhysicalAssetInputs`. Compute annual property tax on assessed value.

**Open source to use:** None needed — user-supplied rate. Reference average rates from Tax Foundation data: `https://taxfoundation.org/data/all/state/property-taxes-by-state/`.

**Effort:** 2-3 days.  
**Impact:** Critical for homeowners (majority of users). Feeds itemized deductions.  
**Dependencies:** None.

### P-5: HSA Family Plan Limits

**What:** Support family HSA coverage ($8,750 for 2026) in addition to individual ($4,400).

**Open source to use:** None — IRS Notice 2025-67 publishes limits annually.

**Effort:** 1-2 days.  
**Impact:** Unlocks HSA modeling for families. User-reported issue from Discord.  
**Dependencies:** None.

---

## Tier 1: Must-Have for Competitive Parity

> These features close the most impactful gaps between Ignidash and all competitors. Ordered by dependency chain and user impact.

### 1-1: Roth Conversions

**What:** Full Roth conversion modeling in the simulation engine. Allow funds to move from tax-deferred to tax-free accounts, taxed as ordinary income in the year of conversion.

**Why first:** Roth conversions are the #1 retirement tax strategy. Every competitor supports them. Without them, Ignidash cannot model the most common FIRE path (Roth conversion ladder). This is also the top prerequisite for future MILP optimization.

**Open source to use:**

- **OWL (`github.com/mdlacasse/Owl`)** for reference. OWL's `modeling-capabilities.md` documents their approach:
  - Conversions amounts optimized or user-specified
  - Taxed as ordinary income in conversion year
  - Five-year maturation rule enforced
  - 59½ age threshold
  - Pro-rata rule not modeled (too complex for a first pass)
- Study OWL's `src/owlplanner/` for the self-consistent loop approach to Roth conversion taxation.

**Implementation approach:**

1. Add conversion fields to simulation schema and UI
2. New `processRothConversion()` step in `PortfolioProcessor`
3. Conversion amount flows into `getTaxableIncomeData()` as ordinary income
4. Track conversion basis separately from contribution basis in `TaxFreeAccount`
5. Five-year holding period tracking (converted amount vs. earnings)

**Effort:** 2-4 weeks.  
**Dependencies:** None (taxes.ts already handles ordinary income correctly).  
**Note:** Start with user-specified conversion amounts (annual fixed or bracket-filling). Defer optimization to the post-feature-build phase.

### 1-2: IRMAA Surcharges

**What:** Medicare Part B and Part D IRMAA surcharges based on MAGI from 2 years prior.

**Why second:** IRMAA affects every retiree doing Roth conversions or taking large distributions. It creates an effective marginal tax rate that changes strategy. Roth conversions increase MAGI, which increases IRMAA two years later — without modeling this, users get falsely optimistic conversion results.

**Open source to use:**

- **OWL** — reference their IRMAA modeling in `modeling-capabilities.md`:
  - Part B + Part D (optional disable)
  - Base premium + IRMAA surcharge
  - MAGI from 2 years prior
  - 5 brackets per filing status
  - Thresholds assumed to scale with general inflation
- **CMS official data:** IRMAA brackets at `https://www.cms.gov/newsroom/fact-sheets/2026-medicare-parts-b-premiums-and-deductibles`

**Implementation approach:**

1. New `medicare.ts` in `src/lib/calc/tax-data/` with IRMAA brackets
2. New `processIRMAA()` step in `TaxProcessor` (or new `MedicareProcessor`)
3. Use `simulationState.annualData` 2-year lookback for MAGI
4. Include in annual tax reconciliation

**Effort:** 1-2 weeks.  
**Dependencies:** None directly, but user value multiplies with Roth conversions (1-1).

### 1-3: State Income Taxes

**What:** Full 50-state income tax modeling with bracket structures, retirement income exemptions, and standard deductions.

**Why third:** State taxes are 5-13% of retirement income in high-tax states. Ignidash currently assumes 0% — this is a massive accuracy gap that ProjectionLab, Boldin, RPM, and Pralana all address.

**Open source to use:**

- **Tax Foundation state tax data:** `https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/` — publishes an annual Excel file with all 50 states' brackets, standard deductions, and personal exemptions. Download the Excel file and convert to TypeScript data tables.
- **UsTaxes (`github.com/ustaxes/UsTaxes`):** AGPL-3.0 TypeScript. Has federal filing logic. **State support is limited to Illinois only** — not reusable as a library. However, its architecture (`src/stateForms/`) is worth studying for how to structure state-specific logic.
- **Taxsim (`https://taxsim.nber.org/`):** NBER Taxsim is the academic standard for tax calculation but is a C/Fortran library, not directly reusable. However, its technical documentation describes state tax logic comprehensively: `https://taxsim.nber.org/taxsim35/`

**Implementation approach:**

1. Download Tax Foundation Excel and write a script (`scripts/extract-state-tax-data.ts`) to generate TypeScript data files
2. Build `StateTaxProcessor` parallel to `TaxProcessor`
3. Support: progressive brackets, flat taxes, no-tax states, retirement exemptions (SS, pension, IRA income)
4. State selection input + per-state data files
5. Revise tax convergence loop to handle SALT deduction → federal AGI → state taxable income circularity

**Effort:** 3-6 weeks.  
**Dependencies:** None.  
**Note:** Start with the top 5 retirement destinations (FL, TX, AZ, NC, SC — 3 are no-tax, so bracket data on 2). Then add the top 5 high-tax states (CA, NY, NJ, OR, MN). Fill in the remaining 40 incrementally.

### 1-4: Qualified vs. Non-Qualified Dividends

**What:** Split dividend income into qualified (LTCG rates) and non-qualified (ordinary income rates).

**Open source to use:** None needed. Add a `qualifiedDividendRatio` field to market assumptions (default 0.80 — 80% qualified is typical for broad market index funds).

**Effort:** 2-3 days.  
**Impact:** More accurate capital gains/ordinary income split.  
**Dependencies:** None.

### 1-5: Contribution Phase-Outs at Income Thresholds

**What:** Roth IRA contributions phase out above MAGI thresholds. Traditional IRA deductibility phases out if covered by a workplace plan.

**Open source to use:** IRS Publication 590-A publishes thresholds annually. Data to extract:

```typescript
// 2026 thresholds (inflation-adjusted from TCJA/OBBBA)
const ROTH_IRA_PHASEOUT = {
  single: { start: 150000, end: 165000 },
  mfj: { start: 236000, end: 246000 },
};
const TRADITIONAL_IRA_DEDUCTION_PHASEOUT = {
  single_covered: { start: 79000, end: 99000 },
  mfj_covered: { start: 126000, end: 146000 },
  mfj_spouse_covered: { start: 212000, end: 222000 },
};
```

**Effort:** 3-5 days.  
**Dependencies:** `calculateContribution()` already receives `incomesData` (can derive MAGI).  
**Impact:** Critical for high-income FIRE users. User-reported issue from Discord.

### 1-6: Itemized Deductions

**What:** Support itemized deduction option (vs. standard deduction): mortgage interest, SALT ($10k cap), medical expenses, charitable contributions.

**Open source to use:** None — straightforward tax law implementation.

**Effort:** 2-3 weeks (mortgage interest already tracked via `PhysicalAsset` loans, just needs separation of principal vs. interest).  
**Dependencies:** State taxes (1-3) and property tax (P-4) feed into SALT.

---

## Tier 2: Strategic Differentiators

> These features differentiate Ignidash from competitors — they're not required for parity but create a compelling reason to choose Ignidash.

### 2-1: SEPP 72(t) Distributions

**What:** Penalty-free early IRA withdrawals via substantially equal periodic payments. Three IRS calculation methods: fixed amortization, fixed annuitization, RMD-based.

**Why important:** Critical for FIRE users accessing tax-deferred funds before 59.5 without paying the 10% penalty. ProjectionLab supports this; Boldin does not.

**Open source to use:** None — IRS Rev. Rul. 2002-62 specifies the calculation methods. The IRS provides 120% mid-term AFR rates monthly.

**Effort:** 2-3 weeks.  
**Dependencies:** None, but most useful when combined with Roth conversions (1-1).

### 2-2: ACA Premium Subsidies

**What:** Premium Tax Credit for ACA marketplace plans. Based on MAGI relative to Federal Poverty Level. Critical for early retirees between retirement and Medicare at 65.

**Open source to use:**

- **OWL** (`github.com/mdlacasse/Owl`) — reference their ACA modeling:
  - `slcsp_annual`: benchmark Silver plan premium (user-supplied)
  - PTC computed from MAGI and FPL
  - Two modes: loop (SC convergence) and optimize (MILP)
  - Below 138% FPL: returns full SLCSP (Medicaid approximation)
  - CMS age rating curve for couples when one transitions to Medicare
- **KFF ACA subsidy calculator** data: `https://www.kff.org/interactive/subsidy-calculator/`
- **CMS SLCSP data:** `https://www.healthcare.gov/api`

**Implementation approach:**

1. User inputs: benchmark SLCSP premium, household size
2. FPL lookup table (HHS publishes annually)
3. PTC = SLCSP − (applicable percentage × MAGI)
4. Cliff vs. ramp reconciliation (2026 rules have elimination of the 400% FPL cliff)
5. Interaction with Roth conversions and IRMAA

**Effort:** 2-4 weeks.  
**Dependencies:** IRMAA (1-2) for full Medicare→ACA transitions.

### 2-3: Social Security Claiming Optimization

**What:** Calculate optimal claiming ages (with monthly granularity, ages 62-70). Evaluate breakeven ages, delayed retirement credits, spousal/survivor benefits.

**Open source to use:**

- **Open Social Security (`github.com/MikePiper/open-social-security`):** **MIT license**, TypeScript/Angular. This is the gold standard open-source SS calculator. Key assets:
  - Full present-value optimization for singles and couples
  - Spousal and survivor benefits
  - GPO, WEP, deemed filing rules, voluntary suspension
  - Family maximum and combined family maximum
  - Earnings test for pre-FRA workers
  - Probability weighting by mortality tables
  - Discount rate-based PV calculation
  - Monthly granularity (97 possible claiming ages: 62-70)
- **Extraction approach:** Study `src/` for the core calculation logic. The algorithm is:
  1. For each possible claiming age combination, calculate monthly benefit
  2. Multiply by probability of being alive (mortality table lookup)
  3. Discount back to present value using user's discount rate
  4. Recommend the combination with highest PV

  Extract the benefit calculation functions, mortality table data, and FRA-by-birth-year tables into Ignidash's simulation engine.

**Effort:** 4-6 weeks.  
**Dependencies:** Couples planning (2-7) for spousal optimization.  
**Note:** Start with single-person optimization (much simpler). Add spousal when couples planning is done.

### 2-4: Goal-Based Milestones

**What:** Named life events ("At Retirement", "Kids Leave Home", "Mortgage Paid Off") that income/expense/contribution changes can reference. Updating a milestone cascades to all linked events.

**Open source to use:** None — this is a UI/data model feature, not a calculation engine feature.

**Effort:** 3-5 weeks (mostly UI + schema work).  
**Dependencies:** None.  
**Impact:** User-reported feature request from Discord.

### 2-5: Multi-Plan Comparison

**What:** Create multiple plans and view key outcomes side-by-side. Already on the roadmap as "Coming Soon".

**Open source to use:** None — UI/schema feature.

**Effort:** 3-5 weeks.  
**Dependencies:** Existing multi-simulation analyzer infrastructure.

### 2-6: Sankey Cash Flow Diagrams

**What:** Visualize how income flows through taxes, expenses, contributions, and savings.

**Open source to use:**

- **d3-sankey (`github.com/d3/d3-sankey`):** **BSD-3-Clause license, 925 ⭐, 260 forks**. Production-grade by Mike Bostock (creator of D3). npm package `d3-sankey`. Already compatible with the Recharts/D3 ecosystem Ignidash uses. API is simple:

  ```javascript
  const sankey = d3
    .sankey()
    .nodeWidth(24)
    .nodePadding(8)
    .extent([
      [0, 0],
      [width, height],
    ]);
  const graph = sankey({ nodes, links });
  ```

  **Reference implementation:** `https://observablehq.com/@d3/sankey-diagram`

- **React wrapper options:**
  - `recharts` (already in Ignidash) doesn't have native Sankey
  - `@nivo/sankey` (MIT license, React-native) for a React-friendly wrapper
  - Or write a simple React wrapper around raw `d3-sankey` (~100 lines)

**Effort:** 1-2 weeks.  
**Dependencies:** None. Data already exists in simulation output.

### 2-7: Couples/Spousal Planning

**What:** Joint planning with two individuals: separate incomes, accounts, SS benefits, with MFJ tax treatment and automatic transition to single at first death.

**Open source to use:**

- **OWL** for reference architecture:
  - `status: "married"` with `names: ["Jack", "Jill"]`
  - Separate DOB, life expectancy per individual
  - Per-person HFP sheets (wages, contributions, conversions)
  - Joint asset allocation gliding
  - `beneficiary_fractions`: fraction of each account type to surviving spouse
  - `surviving_spouse_spending_percent`: 60% default
- **Open Social Security** for spousal SS optimization (see 2-3)

**Effort:** 3-6 months. Restructures the single-taxpayer assumption throughout the engine.  
**Dependencies:** None, but multiplies the value of SS optimization (2-3) and state taxes (1-3).  
**⚠️ Risk:** Largest-scope feature in this plan. Consider scoping as "parallel single plans" first, then coupling them.

---

## Tier 3: Polish & Ecosystem

> Lower-effort improvements that round out the user experience and address community requests.

### 3-1: Simulation Engine Documentation

**What:** Publish methodology docs explaining the Monte Carlo approach, historical backtesting, tax modeling, withdrawal strategies, and how Ignidash compares to ProjectionLab and others.

**Open source to use:** None — documentation task.

**Effort:** 3-5 days.  
**Impact:** User-reported request from Discord. Builds trust and transparency.

### 3-2: Direct Income-to-Account Routing

**What:** Allow income streams to deposit directly into specific accounts (e.g., employer HSA contribution → HSA, employer 401k match → 401k) without passing through general cash flow.

**Open source to use:** None.

**Effort:** 3-5 days.  
**Impact:** User-reported feature request.

### 3-3: Pre-Tax Expense Support

**What:** Model insurance premiums, FSA contributions, and other payroll deductions that reduce gross income before taxes.

**Open source to use:** None.

**Effort:** 1-2 weeks.  
**Impact:** User-reported feature request. More accurate income modeling.

### 3-4: Income/Expense Step Changes Over Time

**What:** A single income or expense that steps up/down at a future date without creating separate entries.

**Open source to use:** None.

**Effort:** 1-2 weeks (mostly UI/schema).  
**Impact:** User-reported feature request. Reduces form complexity.

### 3-5: Local LLM Support

**What:** Allow self-hosted users to use Ollama/llama.cpp instead of Azure OpenAI for AI chat/insights.

**Open source to use:**

- **Ollama** (`https://ollama.com/`) — REST API compatible with OpenAI chat completions format
- **llama.cpp** (`github.com/ggerganov/llama.cpp`) — OpenAI-compatible server mode available

**Effort:** 1-2 weeks (add alternative API endpoint configuration).  
**Impact:** Self-hosted differentiator. No competitor offers this.

### 3-6: Account Aggregation (Plaid/Yodlee/MX)

**What:** Link real brokerage and bank accounts for live balance tracking.

**Open source to use:**

- **Plaid** (`https://plaid.com/`) — de facto standard, but requires API key and data-sharing agreement
- **SimpleFIN** (`https://www.simplefin.org/`) — open-source alternative, simpler but fewer institutions
- **Plaid Link React SDK** for UI

**Effort:** 3-5 weeks (Plaid integration + mapping to account schema).  
**⚠️ Risk:** Ongoing maintenance burden (API changes, institution support). Evaluate carefully.

### 3-7: Additional Improvements from User Feedback

| Item                                         | Effort    | Source               |
| -------------------------------------------- | --------- | -------------------- |
| HSA employer flat contribution               | 1-2 days  | Discord              |
| Income/expense chronological ordering        | 1-2 days  | Discord              |
| Sidebar relabel "Net Worth"                  | <1 day    | Discord              |
| Mortgage/debt extra payment modeling         | 3-5 days  | Discord              |
| Auto-liquidate physical assets at bankruptcy | 3-5 days  | Discord              |
| Safari loading bug (self-hosted)             | 1-3 days  | Discord              |
| Scenario stress testing ("2008 crash")       | 1-2 weeks | Competitive analysis |

---

## Implementation Sequence Diagram

```
NOW (1-3 days each)
├── P-1: Pension income unlock ────────────────────────┐
├── P-2: Self-employment unlock (after P-3) ───────────┤
├── P-3: FICA accuracy fixes ──────────────────────────┤
├── P-4: Property tax on physical assets ──────────────┤ Quick wins
├── P-5: HSA family plan limits ───────────────────────┤
└── P-6: Sidebar/UX fixes ─────────────────────────────┘

WEEKS 1-6
├── 1-1: Roth conversions ═══════════════════════════╗
├── 1-2: IRMAA surcharges (week 3+) ════════════════╣ Tier 1
├── 1-4: Qualified dividends (2-3 days) ═════════════╣ core
├── 1-5: Contribution phase-outs (1 week) ═══════════╝
└── 1-6: Itemized deductions (week 4+) ═════════════ depends on P-4

WEEKS 7-18
├── 1-3: State income taxes ═════════════════════════ Tier 1 (largest)
├── 2-1: SEPP 72(t) ═════════════════════════════════ Tier 2
├── 2-6: Sankey diagrams ════════════════════════════ Tier 2 (quick)
├── 3-1: Engine documentation ═══════════════════════ Tier 3 (quick)
├── 3-3: Pre-tax expenses
└── 3-4: Income/expense step changes

WEEKS 19-30
├── 2-2: ACA subsidies ═══════════════════════════════ Tier 2
├── 2-4: Goal-based milestones ══════════════════════ Tier 2
├── 2-5: Multi-plan comparison ══════════════════════ Tier 2
└── 2-3: SS optimization (single person) ═════════════ Tier 2

WEEKS 31+  (major architectural change)
└── 2-7: Couples/spousal planning ═══════════════════ Long pole
    └── 2-3: SS optimization (spousal) ══════════════ depends on 2-7
```

---

## Open Source Libraries Summary

| Library              | License       | Used For                        | Status                            |
| -------------------- | ------------- | ------------------------------- | --------------------------------- |
| `highs` (highs-js)   | MIT           | MILP optimization (future)      | Reserved for optimization phase   |
| `d3-sankey`          | BSD-3-Clause  | Sankey diagrams (2-6)           | Ready to integrate                |
| Open Social Security | MIT           | SS claiming optimization (2-3)  | Extract algorithm from source     |
| OWL (mdlacasse/Owl)  | GPL-3.0       | Reference architecture          | Study, don't fork                 |
| Tax Foundation Excel | Public data   | State tax bracket data (1-3)    | Download annually                 |
| IRS publications     | Public domain | Tax thresholds, RMD tables, FPL | Reference data only               |
| CMS IRMAA data       | Public domain | IRMAA brackets (1-2)            | Reference data only               |
| UsTaxes              | AGPL-3.0      | State tax reference             | Architecture study only (1 state) |

---

## Licensing Notes

- **OWL (GPL-3.0):** Study the architecture and algorithms, then **write your own implementation**. GPL-3.0 is compatible with Ignidash's AGPL-3.0, but forking OWL code directly would tie Ignidash to OWL's update cycle and Python dependency. Better to learn from it.
- **Open Social Security (MIT):** The MIT license allows direct code reuse with attribution. The core benefit calculation functions (FRA-by-birth-year, PIA calculation, spousal/survivor logic) can be extracted and adapted to TypeScript for Ignidash.
- **d3-sankey (BSD-3-Clause):** Trivially integrable. Add as an npm dependency.
- **highs-js (MIT):** Reserved for the optimization phase. When Ignidash has Roth conversions, IRMAA, and ACA subsidies built, this becomes the MILP engine.
- **Tax Foundation data:** Public data, no restrictions. The Excel download is freely available.
