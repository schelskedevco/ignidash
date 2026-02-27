import { describe, it, expect } from 'vitest';

import { MultiSimulationAnalyzer } from './multi-simulation-analyzer';
import type { SimulationResult, SimulationDataPoint, MultiSimulationResult } from '../simulation-engine';
import type { ReturnsData } from '../returns';

// Helper to create minimal ReturnsData with specified returns
const createReturnsData = (returns: { stocks: number; bonds: number; cash: number }): ReturnsData => ({
  annualReturnRates: { stocks: returns.stocks, bonds: returns.bonds, cash: returns.cash },
  annualYieldRates: { stocks: 0, bonds: 0, cash: 0 },
  annualInflationRate: 0.03,
  returnAmounts: { stocks: 0, bonds: 0, cash: 0 },
  returnRates: { stocks: 0, bonds: 0, cash: 0 },
  cumulativeReturnAmounts: { stocks: 0, bonds: 0, cash: 0 },
  yieldAmounts: {
    taxable: { stocks: 0, bonds: 0, cash: 0 },
    taxDeferred: { stocks: 0, bonds: 0, cash: 0 },
    taxFree: { stocks: 0, bonds: 0, cash: 0 },
    cashSavings: { stocks: 0, bonds: 0, cash: 0 },
  },
  yieldRates: { stocks: 0, bonds: 0, cash: 0 },
  cumulativeYieldAmounts: {
    taxable: { stocks: 0, bonds: 0, cash: 0 },
    taxDeferred: { stocks: 0, bonds: 0, cash: 0 },
    taxFree: { stocks: 0, bonds: 0, cash: 0 },
    cashSavings: { stocks: 0, bonds: 0, cash: 0 },
  },
  inflationRate: 0,
  perAccountData: {},
});

// Helper to create a simulation data point
const createDataPoint = (options: {
  age: number;
  phase: 'accumulation' | 'retirement';
  totalValue: number;
  stockReturn?: number;
}): SimulationDataPoint => ({
  date: '2024-01-01',
  age: options.age,
  portfolio: {
    totalValue: options.totalValue,
    assetAllocation: { stocks: 0.6, bonds: 0.3, cash: 0.1 },
    contributions: { stocks: 0, bonds: 0, cash: 0 },
    withdrawals: { stocks: 0, bonds: 0, cash: 0 },
    cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
    cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
    employerMatch: 0,
    cumulativeEmployerMatch: 0,
    realizedGains: 0,
    cumulativeRealizedGains: 0,
    rmds: 0,
    cumulativeRmds: 0,
    earningsWithdrawn: 0,
    cumulativeEarningsWithdrawn: 0,
    shortfall: 0,
    shortfallRepaid: 0,
    outstandingShortfall: 0,
    perAccountData: {},
  },
  incomes: {
    totalIncome: 100000,
    totalAmountWithheld: 20000,
    totalFicaTax: 7650,
    totalIncomeAfterPayrollDeductions: 72350,
    totalSocialSecurityIncome: 0,
    totalTaxFreeIncome: 0,
    perIncomeData: {},
  },
  expenses: {
    totalExpenses: 50000,
    perExpenseData: {},
  },
  debts: null,
  physicalAssets: null,
  taxes: {
    incomeTaxes: {
      taxableIncomeTaxedAsOrdinary: 65400,
      incomeTaxBrackets: [],
      incomeTaxAmount: 10000,
      effectiveIncomeTaxRate: 0.125,
      topMarginalIncomeTaxRate: 0.22,
    },
    capitalGainsTaxes: {
      taxableIncomeTaxedAsCapGains: 0,
      capitalGainsTaxBrackets: [],
      capitalGainsTaxAmount: 0,
      effectiveCapitalGainsTaxRate: 0,
      topMarginalCapitalGainsTaxRate: 0,
    },
    niit: {
      netInvestmentIncome: 0,
      incomeSubjectToNiit: 0,
      niitAmount: 0,
      threshold: 200000,
    },
    socialSecurityTaxes: {
      taxableSocialSecurityIncome: 0,
      maxTaxablePercentage: 0.85,
      actualTaxablePercentage: 0,
      provisionalIncome: 0,
    },
    earlyWithdrawalPenalties: {
      taxDeferredPenaltyAmount: 0,
      taxFreePenaltyAmount: 0,
      totalPenaltyAmount: 0,
    },
    totalTaxesDue: 17650,
    totalTaxesRefund: 0,
    totalTaxableIncome: 65400,
    adjustments: {},
    deductions: {},
    incomeSources: {
      realizedGains: 0,
      capitalLossDeduction: 0,
      section121Exclusion: 0,
      taxDeferredWithdrawals: 0,
      taxableRetirementDistributions: 0,
      taxableDividendIncome: 0,
      taxableInterestIncome: 0,
      earnedIncome: 80000,
      socialSecurityIncome: 0,
      taxableSocialSecurityIncome: 0,
      maxTaxableSocialSecurityPercentage: 0.85,
      provisionalIncome: 0,
      taxFreeIncome: 0,
      grossIncome: 80000,
      incomeTaxedAsOrdinary: 80000,
      incomeTaxedAsLtcg: 0,
      taxDeductibleContributions: 0,
      adjustedGrossIncome: 80000,
      adjustedIncomeTaxedAsOrdinary: 80000,
      adjustedIncomeTaxedAsCapGains: 0,
      totalIncome: 80000,
      earlyWithdrawals: { rothEarnings: 0, '401kAndIra': 0, hsa: 0 },
    },
  },
  returns: options.stockReturn !== undefined ? createReturnsData({ stocks: options.stockReturn, bonds: 0.04, cash: 0.02 }) : null,
  phase: { name: options.phase },
});

// Helper to create a simulation result with specific characteristics
const createSimulationResult = (options: {
  seed: number;
  startAge: number;
  years: number;
  retirementAge: number;
  finalPortfolioValue: number;
  bankruptcyAge?: number;
  stockReturns?: number[];
}): SimulationResult => {
  const { seed: _seed, startAge, years, retirementAge, finalPortfolioValue, bankruptcyAge, stockReturns } = options;

  const data: SimulationDataPoint[] = [];

  for (let i = 0; i <= years; i++) {
    const age = startAge + i;
    const isRetired = age >= retirementAge;
    const phase: 'accumulation' | 'retirement' = isRetired ? 'retirement' : 'accumulation';

    let totalValue: number;
    if (bankruptcyAge !== undefined && age >= bankruptcyAge) {
      totalValue = 0;
    } else if (i === years) {
      totalValue = finalPortfolioValue;
    } else {
      // Linear interpolation from 500k to final value
      totalValue = 500000 + ((finalPortfolioValue - 500000) * i) / years;
    }

    const stockReturn = stockReturns?.[i] ?? 0.07;

    data.push(
      createDataPoint({
        age,
        phase,
        totalValue,
        stockReturn: i > 0 ? stockReturn : undefined, // No returns on year 0
      })
    );
  }

  return {
    data,
    context: {
      startAge,
      endAge: startAge + years,
      yearsToSimulate: years,
      startDate: '2024-01-01',
      endDate: `${2024 + years}-01-01`,
      retirementStrategy: { type: 'fixedAge', retirementAge },
      rmdAge: 73,
    },
  };
};

// Helper to create multi-simulation result
const createMultiSimulationResult = (simulations: Array<[number, SimulationResult]>): MultiSimulationResult => ({
  simulations,
});

describe('MultiSimulationAnalyzer', () => {
  describe('analyze', () => {
    describe('success rate calculation', () => {
      it('calculates correct success rate', () => {
        // 3 successful (retired + positive portfolio), 2 failures
        const simulations: Array<[number, SimulationResult]> = [
          [1, createSimulationResult({ seed: 1, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 2000000 })],
          [2, createSimulationResult({ seed: 2, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 1500000 })],
          [3, createSimulationResult({ seed: 3, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 0, bankruptcyAge: 75 })],
          [4, createSimulationResult({ seed: 4, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 1800000 })],
          [5, createSimulationResult({ seed: 5, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 0.05 })], // Bankrupt
        ];

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'finalPortfolioValue');

        expect(analysis.success).toBeCloseTo(0.6, 3); // 3 out of 5
      });
    });

    describe('percentile extraction', () => {
      it('extracts correct percentiles (p10, p25, p50, p75, p90)', () => {
        // Create 10 simulations with clearly different final portfolio values
        const simulations: Array<[number, SimulationResult]> = [];
        for (let i = 0; i < 10; i++) {
          simulations.push([
            i,
            createSimulationResult({
              seed: i,
              startAge: 30,
              years: 40,
              retirementAge: 65,
              finalPortfolioValue: 1000000 + i * 100000, // 1M, 1.1M, 1.2M, ... 1.9M
            }),
          ]);
        }

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'finalPortfolioValue');

        // Results should be sorted by finalPortfolioValue (ascending)
        // p10 = index 1 (10% of 10 = 1)
        // p25 = index 2 (25% of 10 = 2)
        // p50 = index 5 (50% of 10 = 5)
        // p75 = index 7 (75% of 10 = 7)
        // p90 = index 9 (90% of 10 = 9)
        expect(analysis.results.p10.result.data.at(-1)?.portfolio.totalValue).toBe(1100000);
        expect(analysis.results.p25.result.data.at(-1)?.portfolio.totalValue).toBe(1200000);
        expect(analysis.results.p50.result.data.at(-1)?.portfolio.totalValue).toBe(1500000);
        expect(analysis.results.p75.result.data.at(-1)?.portfolio.totalValue).toBe(1700000);
        expect(analysis.results.p90.result.data.at(-1)?.portfolio.totalValue).toBe(1900000);
      });

      it('includes seed with each percentile result and orders correctly', () => {
        const simulations: Array<[number, SimulationResult]> = [
          [42, createSimulationResult({ seed: 42, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 1000000 })],
          [99, createSimulationResult({ seed: 99, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 2000000 })],
        ];

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'finalPortfolioValue');

        // seed 42 ($1M) should be p10, seed 99 ($2M) should be p90
        expect(analysis.results.p10.seed).toBe(42);
        expect(analysis.results.p90.seed).toBe(99);
      });
    });

    describe('sorting by different modes', () => {
      it('sorts by finalPortfolioValue (ascending) - p10 lowest, p90 highest', () => {
        const simulations: Array<[number, SimulationResult]> = [
          [3, createSimulationResult({ seed: 3, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 3000000 })],
          [1, createSimulationResult({ seed: 1, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 1000000 })],
          [2, createSimulationResult({ seed: 2, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 2000000 })],
        ];

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'finalPortfolioValue');

        const p10Value = analysis.results.p10.result.data.at(-1)?.portfolio.totalValue;
        const p50Value = analysis.results.p50.result.data.at(-1)?.portfolio.totalValue;
        const p90Value = analysis.results.p90.result.data.at(-1)?.portfolio.totalValue;

        expect(p10Value).toBe(1000000);
        expect(p50Value).toBe(2000000);
        expect(p90Value).toBe(3000000);
      });

      it('sorts by retirementAge (inverted) - p10 latest retirement, p90 earliest', () => {
        const simulations: Array<[number, SimulationResult]> = [
          [1, createSimulationResult({ seed: 1, startAge: 30, years: 40, retirementAge: 55, finalPortfolioValue: 1500000 })],
          [2, createSimulationResult({ seed: 2, startAge: 30, years: 40, retirementAge: 60, finalPortfolioValue: 1500000 })],
          [3, createSimulationResult({ seed: 3, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 1500000 })],
        ];

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'retirementAge');

        // Inverted normalization: lower retirement age = higher score
        // Ascending sort: 65 (score 0), 60 (score 0.5), 55 (score 1)
        expect(analysis.results.p10.seed).toBe(3); // Retired at 65 (worst)
        expect(analysis.results.p50.seed).toBe(2); // Retired at 60
        expect(analysis.results.p90.seed).toBe(1); // Retired at 55 (best)
      });

      it('sorts by bankruptcyAge - p10 earliest bankruptcy, non-bankrupt ranks highest', () => {
        const simulations: Array<[number, SimulationResult]> = [
          [
            1,
            createSimulationResult({
              seed: 1,
              startAge: 30,
              years: 40,
              retirementAge: 65,
              finalPortfolioValue: 0,
              bankruptcyAge: 70,
            }),
          ],
          [
            2,
            createSimulationResult({
              seed: 2,
              startAge: 30,
              years: 40,
              retirementAge: 65,
              finalPortfolioValue: 0,
              bankruptcyAge: 75,
            }),
          ],
          [3, createSimulationResult({ seed: 3, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 2000000 })],
        ];

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'bankruptcyAge');

        // bankruptcyAge null → fallback=1 (best), bankrupt@70 → score 0 (worst)
        expect(analysis.results.p10.seed).toBe(1); // Bankrupt at 70 (worst)
        expect(analysis.results.p90.seed).not.toBe(1); // Never bankrupt or latest bankruptcy (best)
      });

      it('sorts by earlyRetirementStockReturn - p10 lowest early returns, p90 highest', () => {
        // startAge=30, years=10, retirementAge=33
        // Early retirement window: ages 34-37 → stockReturns indices 4,5,6,7
        const baseReturns = [0.07, 0.07, 0.07, 0.07];
        const tailReturns = [0.07, 0.07, 0.07];

        const simulations: Array<[number, SimulationResult]> = [
          [
            1,
            createSimulationResult({
              seed: 1,
              startAge: 30,
              years: 10,
              retirementAge: 33,
              finalPortfolioValue: 1500000,
              stockReturns: [...baseReturns, 0.1, 0.1, 0.1, 0.1, ...tailReturns], // 10% early returns (middle)
            }),
          ],
          [
            2,
            createSimulationResult({
              seed: 2,
              startAge: 30,
              years: 10,
              retirementAge: 33,
              finalPortfolioValue: 1500000,
              stockReturns: [...baseReturns, 0.03, 0.03, 0.03, 0.03, ...tailReturns], // 3% early returns (lowest)
            }),
          ],
          [
            3,
            createSimulationResult({
              seed: 3,
              startAge: 30,
              years: 10,
              retirementAge: 33,
              finalPortfolioValue: 1500000,
              stockReturns: [...baseReturns, 0.2, 0.2, 0.2, 0.2, ...tailReturns], // 20% early returns (highest)
            }),
          ],
        ];

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'earlyRetirementStockReturn');

        expect(analysis.results.p10.seed).toBe(2); // Lowest early returns
        expect(analysis.results.p50.seed).toBe(1); // Middle early returns
        expect(analysis.results.p90.seed).toBe(3); // Highest early returns
      });

      it('sorts by meanStockReturn (ascending) - p10 lowest returns, p90 highest', () => {
        const simulations: Array<[number, SimulationResult]> = [
          [
            1,
            createSimulationResult({
              seed: 1,
              startAge: 30,
              years: 5,
              retirementAge: 65,
              finalPortfolioValue: 1500000,
              stockReturns: [0.1, 0.1, 0.1, 0.1, 0.1], // 10% returns (middle)
            }),
          ],
          [
            2,
            createSimulationResult({
              seed: 2,
              startAge: 30,
              years: 5,
              retirementAge: 65,
              finalPortfolioValue: 1500000,
              stockReturns: [0.05, 0.05, 0.05, 0.05, 0.05], // 5% returns (lowest)
            }),
          ],
          [
            3,
            createSimulationResult({
              seed: 3,
              startAge: 30,
              years: 5,
              retirementAge: 65,
              finalPortfolioValue: 1500000,
              stockReturns: [0.15, 0.15, 0.15, 0.15, 0.15], // 15% returns (highest)
            }),
          ],
        ];

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'meanStockReturn');

        // Verify seeds are sorted by return: seed 2 (5%) < seed 1 (10%) < seed 3 (15%)
        expect(analysis.results.p10.seed).toBe(2); // Lowest returns
        expect(analysis.results.p50.seed).toBe(1); // Middle returns
        expect(analysis.results.p90.seed).toBe(3); // Highest returns
      });
    });

    describe('null/fallback normalization', () => {
      it('never-retired simulation counts as failure and ranks worst for retirementAge sort', () => {
        const simulations: Array<[number, SimulationResult]> = [
          [1, createSimulationResult({ seed: 1, startAge: 30, years: 40, retirementAge: 55, finalPortfolioValue: 1500000 })],
          [2, createSimulationResult({ seed: 2, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 1500000 })],
          // retirementAge=80 > startAge+years=70, so this sim never reaches retirement
          [3, createSimulationResult({ seed: 3, startAge: 30, years: 40, retirementAge: 80, finalPortfolioValue: 3000000 })],
        ];

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'retirementAge');

        // Never-retired gets null retirementAge → fallback=0 → tied with latest retirement (65)
        // Both rank below seed 1 (retired at 55, score=1)
        expect(analysis.results.p90.seed).toBe(1); // Retired earliest (55, best)
        expect([2, 3]).toContain(analysis.results.p10.seed); // Never-retired or latest retirement (worst)

        // Never-retired is a failure (phase stays 'accumulation')
        // 2 of 3 sims retired successfully → success = 2/3
        expect(analysis.success).toBeCloseTo(2 / 3, 3);
      });

      it('non-bankrupt simulations rank higher than bankrupt ones for bankruptcyAge sort', () => {
        // With a single bankrupt sim, range=0 → normalize returns 0.5
        // Non-bankrupt sims get fallback=1, so they rank strictly higher
        const simulations: Array<[number, SimulationResult]> = [
          [
            1,
            createSimulationResult({
              seed: 1,
              startAge: 30,
              years: 40,
              retirementAge: 65,
              finalPortfolioValue: 0,
              bankruptcyAge: 68,
            }),
          ],
          [2, createSimulationResult({ seed: 2, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 1000000 })],
          [3, createSimulationResult({ seed: 3, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 2000000 })],
        ];

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'bankruptcyAge');

        // Bankrupt sim (score 0.5) ranks below non-bankrupt sims (fallback=1)
        expect(analysis.results.p10.seed).toBe(1);
        expect([2, 3]).toContain(analysis.results.p90.seed);
      });
    });

    describe('success rate edge cases', () => {
      it('returns 1.0 when all simulations are successful', () => {
        const simulations: Array<[number, SimulationResult]> = [
          [1, createSimulationResult({ seed: 1, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 2000000 })],
          [2, createSimulationResult({ seed: 2, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 1500000 })],
          [3, createSimulationResult({ seed: 3, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 1000000 })],
        ];

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'finalPortfolioValue');

        expect(analysis.success).toBe(1.0);
      });

      it('returns 0.0 when all simulations fail', () => {
        const simulations: Array<[number, SimulationResult]> = [
          // Bankrupt (portfolio = 0 at end, which is <= 0.1)
          [1, createSimulationResult({ seed: 1, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 0 })],
          // Portfolio exactly 0.1 → failure (check is > 0.1)
          [2, createSimulationResult({ seed: 2, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 0.1 })],
          // Never retired (stays in accumulation) → failure despite large portfolio
          [3, createSimulationResult({ seed: 3, startAge: 30, years: 40, retirementAge: 80, finalPortfolioValue: 5000000 })],
        ];

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'finalPortfolioValue');

        expect(analysis.success).toBe(0.0);
      });

      it('treats portfolio value of 0.1 as failure and 0.11 as success', () => {
        const simulations: Array<[number, SimulationResult]> = [
          [1, createSimulationResult({ seed: 1, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 0.1 })],
          [2, createSimulationResult({ seed: 2, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 0.11 })],
        ];

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'finalPortfolioValue');

        // 0.1 fails (not > 0.1), 0.11 succeeds
        expect(analysis.success).toBe(0.5);
      });

      it('counts simulation still in accumulation phase as failure even with large portfolio', () => {
        const simulations: Array<[number, SimulationResult]> = [
          // Retired with positive portfolio → success
          [1, createSimulationResult({ seed: 1, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 1000000 })],
          // Never retires (retirementAge > endAge) but has huge portfolio → failure
          [2, createSimulationResult({ seed: 2, startAge: 30, years: 40, retirementAge: 80, finalPortfolioValue: 10000000 })],
        ];

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'finalPortfolioValue');

        expect(analysis.success).toBe(0.5);
      });
    });

    describe('edge cases', () => {
      it('handles single simulation', () => {
        const simulations: Array<[number, SimulationResult]> = [
          [1, createSimulationResult({ seed: 1, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 2000000 })],
        ];

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'finalPortfolioValue');

        // All percentiles should be the same simulation
        expect(analysis.results.p10.seed).toBe(1);
        expect(analysis.results.p50.seed).toBe(1);
        expect(analysis.results.p90.seed).toBe(1);
        expect(analysis.success).toBe(1);
      });

      it('throws error when simulations have no data points', () => {
        const simulations: Array<[number, SimulationResult]> = [
          [
            1,
            {
              data: [],
              context: {
                startAge: 30,
                endAge: 70,
                yearsToSimulate: 40,
                startDate: '2024-01-01',
                endDate: '2064-01-01',
                retirementStrategy: { type: 'fixedAge', retirementAge: 65 },
                rmdAge: 73,
              },
            },
          ],
        ];

        const multiResult = createMultiSimulationResult(simulations);

        expect(() => MultiSimulationAnalyzer.analyze(multiResult, 'finalPortfolioValue')).toThrow('No data points');
      });

      it('handles simulations with equal values (zero-range normalization)', () => {
        // All simulations have identical finalPortfolioValue → range=0 → normalize returns 0.5 for all
        const simulations: Array<[number, SimulationResult]> = [
          [1, createSimulationResult({ seed: 1, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 1500000 })],
          [2, createSimulationResult({ seed: 2, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 1500000 })],
          [3, createSimulationResult({ seed: 3, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 1500000 })],
        ];

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'finalPortfolioValue');

        // Should not throw and all percentiles should have valid seeds
        expect(analysis.success).toBe(1);
        expect(analysis.results.p10).toBeDefined();
        expect(analysis.results.p25).toBeDefined();
        expect(analysis.results.p50).toBeDefined();
        expect(analysis.results.p75).toBeDefined();
        expect(analysis.results.p90).toBeDefined();
        expect([1, 2, 3]).toContain(analysis.results.p10.seed);
        expect([1, 2, 3]).toContain(analysis.results.p50.seed);
        expect([1, 2, 3]).toContain(analysis.results.p90.seed);
      });
    });
  });
});
