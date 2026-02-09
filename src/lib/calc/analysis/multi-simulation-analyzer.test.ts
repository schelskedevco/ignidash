import { describe, it, expect } from 'vitest';

import { MultiSimulationAnalyzer } from './multi-simulation-analyzer';
import type { SimulationResult, SimulationDataPoint, MultiSimulationResult } from '../simulation-engine';
import type { ReturnsData } from '../returns';

// Helper to create minimal ReturnsData with specified returns
const createReturnsData = (returns: { stocks: number; bonds: number; cash: number }): ReturnsData => ({
  annualReturnRates: { stocks: returns.stocks, bonds: returns.bonds, cash: returns.cash },
  annualYieldRates: { stocks: 0, bonds: 0, cash: 0 },
  annualInflationRate: 0.03,
  returnAmountsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
  returnRatesForPeriod: { stocks: 0, bonds: 0, cash: 0 },
  cumulativeReturnAmounts: { stocks: 0, bonds: 0, cash: 0 },
  yieldAmountsForPeriod: {
    taxable: { stocks: 0, bonds: 0, cash: 0 },
    taxDeferred: { stocks: 0, bonds: 0, cash: 0 },
    taxFree: { stocks: 0, bonds: 0, cash: 0 },
    cashSavings: { stocks: 0, bonds: 0, cash: 0 },
  },
  yieldRatesForPeriod: { stocks: 0, bonds: 0, cash: 0 },
  cumulativeYieldAmounts: {
    taxable: { stocks: 0, bonds: 0, cash: 0 },
    taxDeferred: { stocks: 0, bonds: 0, cash: 0 },
    taxFree: { stocks: 0, bonds: 0, cash: 0 },
    cashSavings: { stocks: 0, bonds: 0, cash: 0 },
  },
  inflationRateForPeriod: 0,
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
    contributionsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
    withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
    cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
    cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
    employerMatchForPeriod: 0,
    cumulativeEmployerMatch: 0,
    realizedGainsForPeriod: 0,
    cumulativeRealizedGains: 0,
    rmdsForPeriod: 0,
    cumulativeRmds: 0,
    earningsWithdrawnForPeriod: 0,
    cumulativeEarningsWithdrawn: 0,
    shortfallForPeriod: 0,
    shortfallRepaidForPeriod: 0,
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

      it('includes seed with each percentile result', () => {
        const simulations: Array<[number, SimulationResult]> = [
          [42, createSimulationResult({ seed: 42, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 1000000 })],
          [99, createSimulationResult({ seed: 99, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 2000000 })],
        ];

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'finalPortfolioValue');

        // Should have seeds from the original simulations
        expect([42, 99]).toContain(analysis.results.p50.seed);
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

      it('handles simulations with equal values', () => {
        // All simulations have same final portfolio value
        const simulations: Array<[number, SimulationResult]> = [
          [1, createSimulationResult({ seed: 1, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 1500000 })],
          [2, createSimulationResult({ seed: 2, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 1500000 })],
          [3, createSimulationResult({ seed: 3, startAge: 30, years: 40, retirementAge: 65, finalPortfolioValue: 1500000 })],
        ];

        const multiResult = createMultiSimulationResult(simulations);
        const analysis = MultiSimulationAnalyzer.analyze(multiResult, 'finalPortfolioValue');

        // Should not throw error
        expect(analysis.success).toBe(1);
        expect(analysis.results.p50).toBeDefined();
      });
    });
  });
});
