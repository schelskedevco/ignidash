import { describe, it, expect } from 'vitest';

import { KeyMetricsExtractor } from './key-metrics-extractor';
import type { SimulationResult, SimulationDataPoint, MultiSimulationResult } from '../simulation-engine';
import type { ReturnsData } from '../returns';

// Helper to create minimal ReturnsData
const createReturnsData = (): ReturnsData => ({
  annualReturnRates: { stocks: 0.07, bonds: 0.04, cash: 0.02 },
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

// Helper to create minimal SimulationDataPoint
const createDataPoint = (options: {
  age: number;
  phase: 'accumulation' | 'retirement';
  totalValue: number;
  shortfall?: number;
  incomeTax?: number;
  ficaTax?: number;
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
    shortfall: options.shortfall ?? 0,
    shortfallRepaid: 0,
    outstandingShortfall: 0,
    perAccountData: {},
  },
  incomes: {
    totalIncome: 100000,
    totalAmountWithheld: 20000,
    totalFicaTax: options.ficaTax ?? 7650,
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
      incomeTaxAmount: options.incomeTax ?? 10000,
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
    totalTaxesDue: (options.incomeTax ?? 10000) + (options.ficaTax ?? 7650),
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
  returns: createReturnsData(),
  phase: { name: options.phase },
});

// Helper to create a simulation result
const createSimulationResult = (options: {
  startAge: number;
  years: number;
  retirementAge?: number;
  retirementStrategy?: { type: 'fixedAge'; retirementAge: number } | { type: 'swrTarget'; safeWithdrawalRate: number };
  bankruptcyYear?: number;
  shortfallYear?: number;
  finalPortfolioValue?: number;
}): SimulationResult => {
  const { startAge, years, retirementAge = 65, bankruptcyYear, shortfallYear, finalPortfolioValue = 1000000 } = options;

  // If retirementStrategy is provided, use it; otherwise create fixedAge with given retirementAge
  const retirementStrategy = options.retirementStrategy ?? { type: 'fixedAge' as const, retirementAge };

  const data: SimulationDataPoint[] = [];

  for (let i = 0; i <= years; i++) {
    const age = startAge + i;
    const isRetired = retirementAge !== null && age >= retirementAge;
    const phase: 'accumulation' | 'retirement' = isRetired ? 'retirement' : 'accumulation';

    // Calculate portfolio value - decrease if approaching bankruptcy
    let totalValue: number;
    if (bankruptcyYear !== undefined && i >= bankruptcyYear) {
      totalValue = 0; // Bankrupt
    } else if (bankruptcyYear !== undefined && i > bankruptcyYear - 5) {
      // Declining toward bankruptcy
      totalValue = Math.max(0, (bankruptcyYear - i) * 50000);
    } else if (i === years) {
      totalValue = finalPortfolioValue;
    } else {
      // Growing portfolio
      totalValue = 500000 + i * 50000;
    }

    const shortfall = shortfallYear !== undefined && i === shortfallYear ? 10000 : 0;

    data.push(
      createDataPoint({
        age,
        phase,
        totalValue,
        shortfall,
        incomeTax: 10000 + i * 100,
        ficaTax: 7650,
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
      retirementStrategy,
      rmdAge: 73,
    },
  };
};

// Helper to create multi-simulation result
const createMultiSimulationResult = (simulations: Array<[number, SimulationResult]>): MultiSimulationResult => ({
  simulations,
});

describe('KeyMetricsExtractor', () => {
  describe('extractSingleSimulationMetrics', () => {
    describe('success determination', () => {
      it('marks success when retirement reached, positive portfolio, and no shortfall', () => {
        const simulation = createSimulationResult({
          startAge: 30,
          years: 50,
          retirementAge: 65,
          finalPortfolioValue: 2000000,
        });

        const metrics = KeyMetricsExtractor.extractSingleSimulationMetrics(simulation);

        expect(metrics.success).toBe(1);
        expect(metrics.retirementAge).toBe(65);
        expect(metrics.finalPortfolio).toBe(2000000);
      });

      it('marks failure when portfolio goes bankrupt (≤ 0.1)', () => {
        const simulation = createSimulationResult({
          startAge: 30,
          years: 50,
          retirementAge: 65,
          bankruptcyYear: 45,
          finalPortfolioValue: 0,
        });

        const metrics = KeyMetricsExtractor.extractSingleSimulationMetrics(simulation);

        expect(metrics.success).toBe(0);
        expect(metrics.bankruptcyAge).toBe(75);
        expect(metrics.finalPortfolio).toBe(0);
      });

      it('marks failure when shortfall occurred during simulation', () => {
        const simulation = createSimulationResult({
          startAge: 30,
          years: 50,
          retirementAge: 65,
          shortfallYear: 40,
          finalPortfolioValue: 1500000,
        });

        const metrics = KeyMetricsExtractor.extractSingleSimulationMetrics(simulation);

        expect(metrics.success).toBe(0);
      });

      it('marks failure when never reached retirement (swrTarget strategy that never triggers)', () => {
        // Create a simulation that stays in accumulation phase throughout
        const data: SimulationDataPoint[] = [];
        for (let i = 0; i <= 30; i++) {
          data.push(
            createDataPoint({
              age: 30 + i,
              phase: 'accumulation', // Never retires
              totalValue: 500000 + i * 10000,
            })
          );
        }

        const simulation: SimulationResult = {
          data,
          context: {
            startAge: 30,
            endAge: 60,
            yearsToSimulate: 30,
            startDate: '2024-01-01',
            endDate: '2054-01-01',
            retirementStrategy: { type: 'swrTarget', safeWithdrawalRate: 4 },
            rmdAge: 73,
          },
        };

        const metrics = KeyMetricsExtractor.extractSingleSimulationMetrics(simulation);

        expect(metrics.success).toBe(0);
        expect(metrics.retirementAge).toBeNull();
      });
    });

    describe('fixedAge retirement strategy', () => {
      it('correctly detects retirement age from strategy', () => {
        const simulation = createSimulationResult({
          startAge: 30,
          years: 40,
          retirementAge: 55,
          retirementStrategy: { type: 'fixedAge', retirementAge: 55 },
          finalPortfolioValue: 1500000,
        });

        const metrics = KeyMetricsExtractor.extractSingleSimulationMetrics(simulation);

        expect(metrics.retirementAge).toBe(55);
        expect(metrics.yearsToRetirement).toBe(25);
      });

      it('calculates progress to retirement correctly', () => {
        const simulation = createSimulationResult({
          startAge: 50, // Already 50 years old
          years: 30,
          retirementAge: 65,
          retirementStrategy: { type: 'fixedAge', retirementAge: 65 },
          finalPortfolioValue: 1500000,
        });

        const metrics = KeyMetricsExtractor.extractSingleSimulationMetrics(simulation);

        // Progress = initialPortfolio / portfolioAtRetirement
        // Initial portfolio = 500000 (at age 50, i=0)
        // Portfolio at retirement (age 65, i=15) = 500000 + 15*50000 = 1250000
        // Progress = 500000 / 1250000 = 0.4
        expect(metrics.progressToRetirement).toBeCloseTo(0.4, 3);
      });

      it('caps progress at 1 when already past retirement age', () => {
        const simulation = createSimulationResult({
          startAge: 70,
          years: 20,
          retirementAge: 65,
          retirementStrategy: { type: 'fixedAge', retirementAge: 65 },
          finalPortfolioValue: 1500000,
        });

        const metrics = KeyMetricsExtractor.extractSingleSimulationMetrics(simulation);

        expect(metrics.progressToRetirement).toBe(1);
      });
    });

    describe('swrTarget retirement strategy', () => {
      it('detects retirement age dynamically from phase changes', () => {
        // Create a simulation where retirement starts at age 55
        const data: SimulationDataPoint[] = [];
        for (let i = 0; i <= 40; i++) {
          const age = 30 + i;
          data.push(
            createDataPoint({
              age,
              phase: age >= 55 ? 'retirement' : 'accumulation',
              totalValue: age >= 55 ? 2000000 : 500000 + i * 40000,
            })
          );
        }

        const simulation: SimulationResult = {
          data,
          context: {
            startAge: 30,
            endAge: 70,
            yearsToSimulate: 40,
            startDate: '2024-01-01',
            endDate: '2064-01-01',
            retirementStrategy: { type: 'swrTarget', safeWithdrawalRate: 4 },
            rmdAge: 73,
          },
        };

        const metrics = KeyMetricsExtractor.extractSingleSimulationMetrics(simulation);

        expect(metrics.retirementAge).toBe(55);
        expect(metrics.yearsToRetirement).toBe(25);
      });

      it('calculates progress based on portfolio value vs retirement portfolio', () => {
        // Create a simulation where retirement starts at age 55 with $2M portfolio
        const data: SimulationDataPoint[] = [];
        for (let i = 0; i <= 40; i++) {
          const age = 30 + i;
          data.push(
            createDataPoint({
              age,
              phase: age >= 55 ? 'retirement' : 'accumulation',
              totalValue: age >= 55 ? 2000000 : 500000 + i * 40000,
            })
          );
        }

        const simulation: SimulationResult = {
          data,
          context: {
            startAge: 30,
            endAge: 70,
            yearsToSimulate: 40,
            startDate: '2024-01-01',
            endDate: '2064-01-01',
            retirementStrategy: { type: 'swrTarget', safeWithdrawalRate: 4 },
            rmdAge: 73,
          },
        };

        const metrics = KeyMetricsExtractor.extractSingleSimulationMetrics(simulation);

        // Progress = initialPortfolio / portfolioAtRetirement = 500000 / 2000000 = 0.25
        expect(metrics.progressToRetirement).toBeCloseTo(0.25, 3);
      });
    });

    describe('lifetime taxes calculation', () => {
      it('sums up all taxes and penalties over the simulation', () => {
        const simulation = createSimulationResult({
          startAge: 30,
          years: 10,
          retirementAge: 65,
          finalPortfolioValue: 1000000,
        });

        const metrics = KeyMetricsExtractor.extractSingleSimulationMetrics(simulation);

        // Each year has incomeTax (10000 + i*100) + ficaTax (7650)
        // Sum: Σ(10000 + i*100 + 7650) for i = 0 to 10
        // = 11 * 17650 + 100 * (0+1+2+...+10)
        // = 194150 + 100 * 55
        // = 199650
        expect(metrics.lifetimeTaxesAndPenalties).toBe(199650);
      });
    });
  });

  describe('extractMultiSimulationMetrics', () => {
    it('calculates correct success rate across simulations', () => {
      // 3 successful simulations, 2 failures
      const simulations: Array<[number, SimulationResult]> = [
        [1, createSimulationResult({ startAge: 30, years: 50, retirementAge: 65, finalPortfolioValue: 2000000 })],
        [2, createSimulationResult({ startAge: 30, years: 50, retirementAge: 65, finalPortfolioValue: 1500000 })],
        [3, createSimulationResult({ startAge: 30, years: 50, retirementAge: 65, bankruptcyYear: 45, finalPortfolioValue: 0 })],
        [4, createSimulationResult({ startAge: 30, years: 50, retirementAge: 65, finalPortfolioValue: 1800000 })],
        [5, createSimulationResult({ startAge: 30, years: 50, retirementAge: 65, shortfallYear: 40, finalPortfolioValue: 1000000 })],
      ];

      const multiResult = createMultiSimulationResult(simulations);
      const metrics = KeyMetricsExtractor.extractMultiSimulationMetrics(multiResult);

      // 3 successes out of 5
      expect(metrics.success).toBeCloseTo(0.6, 3);
    });

    it('calculates mean retirement age excluding nulls', () => {
      const simulations: Array<[number, SimulationResult]> = [
        [1, createSimulationResult({ startAge: 30, years: 50, retirementAge: 60 })],
        [2, createSimulationResult({ startAge: 30, years: 50, retirementAge: 65 })],
        [3, createSimulationResult({ startAge: 30, years: 50, retirementAge: 55 })],
      ];

      const multiResult = createMultiSimulationResult(simulations);
      const metrics = KeyMetricsExtractor.extractMultiSimulationMetrics(multiResult);

      // Mean of 60, 65, 55 = 60
      expect(metrics.retirementAge).toBeCloseTo(60, 3);
    });

    it('handles null values correctly when some simulations never retire', () => {
      // Two simulations retire, one never does (swrTarget that never triggers)
      const neverRetiresData: SimulationDataPoint[] = [];
      for (let i = 0; i <= 40; i++) {
        neverRetiresData.push(
          createDataPoint({
            age: 30 + i,
            phase: 'accumulation',
            totalValue: 500000 + i * 10000,
          })
        );
      }

      const neverRetiresSim: SimulationResult = {
        data: neverRetiresData,
        context: {
          startAge: 30,
          endAge: 70,
          yearsToSimulate: 40,
          startDate: '2024-01-01',
          endDate: '2064-01-01',
          retirementStrategy: { type: 'swrTarget', safeWithdrawalRate: 4 },
          rmdAge: 73,
        },
      };

      const simulations: Array<[number, SimulationResult]> = [
        [1, createSimulationResult({ startAge: 30, years: 40, retirementAge: 60 })],
        [2, createSimulationResult({ startAge: 30, years: 40, retirementAge: 65 })],
        [3, neverRetiresSim],
      ];

      const multiResult = createMultiSimulationResult(simulations);
      const metrics = KeyMetricsExtractor.extractMultiSimulationMetrics(multiResult);

      // Only 2 simulations have retirement ages, mean of 60 and 65 = 62.5
      expect(metrics.retirementAge).toBeCloseTo(62.5, 3);
    });

    it('calculates mean final portfolio across all simulations', () => {
      const simulations: Array<[number, SimulationResult]> = [
        [1, createSimulationResult({ startAge: 30, years: 50, retirementAge: 65, finalPortfolioValue: 1000000 })],
        [2, createSimulationResult({ startAge: 30, years: 50, retirementAge: 65, finalPortfolioValue: 2000000 })],
        [3, createSimulationResult({ startAge: 30, years: 50, retirementAge: 65, finalPortfolioValue: 3000000 })],
      ];

      const multiResult = createMultiSimulationResult(simulations);
      const metrics = KeyMetricsExtractor.extractMultiSimulationMetrics(multiResult);

      // Mean of 1M, 2M, 3M = 2M
      expect(metrics.finalPortfolio).toBeCloseTo(2000000, 0);
    });

    it('calculates mean lifetime taxes', () => {
      const simulations: Array<[number, SimulationResult]> = [
        [1, createSimulationResult({ startAge: 30, years: 10, retirementAge: 65, finalPortfolioValue: 1000000 })],
        [2, createSimulationResult({ startAge: 30, years: 10, retirementAge: 65, finalPortfolioValue: 1000000 })],
      ];

      const multiResult = createMultiSimulationResult(simulations);
      const metrics = KeyMetricsExtractor.extractMultiSimulationMetrics(multiResult);

      // Both simulations have same taxes: 199650
      expect(metrics.lifetimeTaxesAndPenalties).toBeCloseTo(199650, 0);
    });

    it('sets areValuesMeans to true for multi-simulation', () => {
      const simulations: Array<[number, SimulationResult]> = [
        [1, createSimulationResult({ startAge: 30, years: 50, retirementAge: 65, finalPortfolioValue: 2000000 })],
      ];

      const multiResult = createMultiSimulationResult(simulations);
      const metrics = KeyMetricsExtractor.extractMultiSimulationMetrics(multiResult);

      expect(metrics.areValuesMeans).toBe(true);
    });
  });
});
