# Tax Support Roadmap

The tax engine (`TaxProcessor` in `taxes.ts`) currently models federal income tax brackets (2026 OBBBA), long-term capital gains with bracket stacking, NIIT (3.8%), Social Security taxation (provisional income method), FICA (7.65% on wages — see gaps below), standard deduction, capital loss deductions with $3k cap and unlimited carryover, tax-deferred contribution deductions, early withdrawal penalties, and Section 121 exclusions.

**Known gaps in current implementation:**

- FICA does not cap the 6.2% Social Security portion at the wage base (~$176k)
- FICA does not include the 0.9% Additional Medicare Tax on wages above $200k/$250k
- All dividends are taxed at LTCG rates (no qualified vs non-qualified distinction)

---

## Planned

Items ordered by priority (impact on FIRE planning accuracy) then ascending difficulty.

**Pensions (Phase 1 — unlock)** — Priority: High | Difficulty: 1

`pension` already exists as `IncomeType` but blocked by a validation refine in `income-form-schema.ts`. Remove the refine, enable the disabled `<option>` in `income-dialog.tsx`, and add a `case 'pension':` in `incomes.ts` that applies withholding but no FICA. Flip `supportsWithholding('pension')` to `true` in the schema helpers. No schema extension needed — pension income flows through the existing tax engine as ordinary income, which is correct. The `default` case already handles it almost right; an explicit case just adds withholding support.

**Pensions (Phase 2 — Simplified Method basis recovery)** — Priority: Medium | Difficulty: 3

Tax-free return-of-basis for pensions with after-tax employee contributions (common in government CSRS/FERS plans). Add two optional fields to `incomeTaxSchema` conditional on `incomeType === 'pension'`: `afterTaxBasis` (total after-tax contributions) and `basisStartAge` (age when payments began). The IRS Simplified Method divides the basis by an age-based divisor (360/310/260/210/160) to get a fixed monthly tax-free amount. Requires stateful tracking in the `Income` class to accumulate recovered basis across simulation years and stop the exclusion once fully recovered. The tax-free portion flows through the existing `taxFreeIncome` field in `IncomeData`. Mirror the new optional fields in `convex/validators/incomes_validator.ts`.

**Property tax** — Priority: High | Difficulty: 2

Annual tax on physical assets (primarily real estate). `PhysicalAsset` already tracks market value and appreciation — property tax is a percentage of assessed value applied annually. Add a `propertyTaxRate` field to `PhysicalAssetInputs`, compute in `PhysicalAssetsProcessor`, and include in tax output. Feeds into itemized deductions (SALT) once that feature lands.

**FICA accuracy (SS wage base cap + Additional Medicare Tax)** — Priority: High | Difficulty: 2

Two fixes to the existing FICA calculation in `incomes.ts`:

1. Cap the 6.2% Social Security portion at the annual wage base (~$176,100 for 2025). Requires tracking cumulative wages across all income sources within a year.
2. Add the 0.9% Additional Medicare Tax on wages exceeding $200k (single/HOH) / $250k (MFJ). Requires filing status awareness in `IncomesProcessor`, which currently doesn't have it.

**Medicare IRMAA surcharges** — Priority: High | Difficulty: 3

Bracket-based Medicare premium surcharge on Parts B and D based on MAGI from 2 years prior. Annual `resultData` already stores historical data so the 2-year lookback is available. Contained calculation — new step after `TaxProcessor.process()`. Five IRMAA brackets per filing status. Important for retirees doing Roth conversions (conversions spike MAGI, triggering surcharges two years later).

**Self-employment income & SE tax** — Priority: High | Difficulty: 4

`selfEmployment` already exists as `IncomeType` but blocked by a validation refine in `income-form-schema.ts`. SE tax: 12.4% Social Security + 2.9% Medicare on 92.35% of net SE income. SS portion subject to wage base cap (combined with any W-2 wages). 0.9% Additional Medicare Tax applies above $200k/$250k. Half of SE tax is an above-the-line AGI deduction — add to `TaxProcessor` adjustments. Depends on FICA accuracy fixes above.

**Itemized deductions** — Priority: High | Difficulty: 5

`getStandardDeduction()` currently returns a fixed amount — need `max(standard, itemized)` computed year-by-year. Mortgage interest already implicitly tracked via `PhysicalAsset` loan payments (need to separate interest from principal). SALT deduction ($10k cap) ties into state tax and property tax features. Medical expense deduction (AGI floor). `TaxesData.deductions` already exists as `Record<string, number>` and can hold the breakdown.

**State/local income taxes** — Priority: High | Difficulty: 5

New `StateTaxProcessor` parallel to `TaxProcessor`. All necessary income data (AGI, taxable income, retirement distributions, SS) already exists in `TaxProcessor` output. The work is: state selection input, state-specific data files (50 states with progressive/flat/none bracket structures, retirement income exemptions, deduction rules). The convergence loop needs meaningful revision — SALT deduction affects federal taxable income, and federal AGI affects state taxable income, creating a circular dependency that must converge together.

**Roth conversions** — Priority: High | Difficulty: 7

New simulation step moving funds from `TaxDeferredAccount` → `TaxFreeAccount`. Conversion amount treated as ordinary income in `getTaxableIncomeData()`. Requires: (1) user-specified conversion strategy (fixed amount, bracket-filling, or manual schedule), (2) 5-year holding period tracking on converted amounts (separate from contribution basis in `TaxFreeAccount`), (3) pro-rata rule enforcement when traditional IRAs contain both pre-tax and after-tax funds. Touches simulation-engine, portfolio, account, taxes, plus schema/validator/UI. Critical FIRE strategy — enables tax-efficient Roth conversion ladders during low-income early retirement years.

**Tax credits** — Priority: Medium | Difficulty: 4

Dollar-for-dollar tax liability reduction after bracket computation. Refundable vs non-refundable handling, each with AGI phase-out rules. New credit step in `TaxProcessor` after `processIncomeTaxes()`. Key credits: Child Tax Credit, Saver's Credit (retirement contribution credit), education credits (AOTC, LLC). Architecturally simple — all needed inputs (AGI, tax liability) already computed.

**72(t) / SEPP distributions** — Priority: Medium | Difficulty: 4

Penalty-free early IRA withdrawals via substantially equal periodic payments. Three IRS calculation methods (fixed amortization, fixed annuitization, RMD). Must maintain for 5 years or until 59.5 (whichever is longer). New withdrawal path in `PortfolioProcessor` that bypasses early withdrawal penalties in `TaxProcessor`. Important for early retirees accessing tax-deferred funds before 59.5.

**Rental/passive income** — Priority: Medium | Difficulty: 5

New income type with depreciation deductions and passive activity loss rules ($25k active participation exception). Simplified version (income taxed as ordinary) is a 3; depreciation schedules and passive loss carryover push to 5. QBI deduction (Section 199A, 20% of qualified business income) adds further complexity but could be deferred. Income data flow already exists.

**529/ABLE accounts** — Priority: Medium | Difficulty: 4

New account types — 529 has tax-free growth and tax-free withdrawals for qualified education expenses; ABLE is similar for disability expenses. Needs expense categorization (education/disability tags on `ExpenseData`) and withdrawal routing in `PortfolioProcessor`. State tax deduction for 529 contributions ties into state tax feature. Could start with 529 only.

**Qualified vs non-qualified dividends** — Priority: Medium | Difficulty: 3

Currently all dividends (`taxableDividendIncome`) are taxed at LTCG rates. In reality, non-qualified dividends (REITs, short-held stocks, foreign dividends) should be taxed as ordinary income. Add a `qualifiedDividendRatio` to market assumptions (e.g., 80% qualified). Split `taxableDividendIncome` accordingly in `getTaxableIncomeData()` — qualified portion stays in `incomeTaxedAsLtcg`, non-qualified moves to `incomeTaxedAsOrdinary`.

**ACA premium subsidies** — Priority: Medium | Difficulty: 5

Premium Tax Credits for health insurance purchased through the ACA marketplace. Based on household MAGI relative to Federal Poverty Level. Critical for early retirees between retirement and Medicare eligibility (age 65). Subsidy cliffs can create effective marginal tax rates over 100%. Requires: household size input, benchmark premium data (could simplify to a single input), and MAGI-based subsidy calculation. Output as a negative expense or tax credit. Interacts with Roth conversion strategy — conversions increase MAGI, potentially reducing subsidies.

---

## Backlog

**Social Security claiming optimization** — Priority: Medium | Difficulty: 4

Currently SS is a simple income stream with a user-specified start date. Optimization would calculate breakeven ages for different claiming ages (62, FRA, 70), model the ~8%/year delayed retirement credits, and suggest optimal claiming age based on life expectancy and other income. Not a tax feature per se, but deeply affects tax planning.

**Short-term vs long-term capital gains** — Priority: Medium | Difficulty: 5

All realized gains currently use LTCG brackets. Proper STCG requires holding period tracking — `TaxableBrokerageAccount` uses pro-rata cost basis, not lot-based. Feasible approximation: assume a configurable percentage of annual gains are short-term (e.g., from rebalancing) and tax those as ordinary income.

**Charitable giving / QCDs** — Priority: Medium | Difficulty: 5

Ties into itemized deductions (charitable contribution deduction with AGI limits). QCDs (Qualified Charitable Distributions from IRAs after 70.5) reduce taxable income without requiring itemization — special handling needed in `getTaxableIncomeData()` to exclude QCD amounts from taxable IRA distributions. QCDs count toward RMD satisfaction. RightCapital supports QCDs explicitly.

**AMT (Alternative Minimum Tax)** — Priority: Low | Difficulty: 6

Parallel tax system — compute tentative minimum tax, compare to regular tax, pay the greater. Requires tracking AMT preference items (state tax deduction, ISO exercise spread, certain deductions). Exemption amount with phase-out based on AMTI. ProjectionLab and Boldin model this. Primarily affects high earners with large state tax deductions or ISO exercises. Lower priority for typical FIRE users.

**Spousal Social Security strategies** — Priority: Low | Difficulty: 5

Spousal benefits (up to 50% of higher earner's PIA), survivor benefits (100% of deceased spouse's), and claiming optimization across two benefit streams. Would need two separate SS inputs with age-dependent claiming rules and the ability to model different claiming age combinations.

**Annuities** — Priority: Low | Difficulty: 5

New income type with exclusion ratio tax treatment — part of each payment is tax-free return of principal, the rest is ordinary income. Needs annuity-specific inputs (type, payout start, guaranteed period, purchase price for exclusion ratio). Variable annuities add more complexity with surrender charges. Less common in FIRE community.

**Dependents** — Priority: Low | Difficulty: 4

Mostly a dependency on tax credits (child tax credit, dependent care credit, EITC). Without tax credits implemented, dependents don't change the simulation meaningfully. Could fold into tax credits feature.

**Step-up in basis at death** — Priority: Low | Difficulty: 3

Reset cost basis of taxable brokerage holdings to fair market value at death. Eliminates embedded capital gains for heirs. Simple to implement (modify `TaxableBrokerageAccount` at end of simulation) but only relevant for legacy/estate analysis views.

**Estate/gift tax** — Priority: Low | Difficulty: 3

Unified federal lifetime exemption (~$13.6M individual, ~$27.2M couple). Apply tax on estate value exceeding exemption at end of simulation. Very few FIRE users hit the threshold, but the 2025 TCJA sunset could halve the exemption. Simple calculation but low impact for target users.

**Married Filing Separately** — Priority: Low | Difficulty: 8

Requires modeling two separate taxpayers with their own incomes, brackets, deductions, phase-outs, and account ownership. Fundamentally restructures the single-taxpayer assumption throughout the simulation engine. MFS has worse brackets and eliminates many credits/deductions, but is sometimes advantageous for student loan IDR plans or when one spouse has high medical expenses.
