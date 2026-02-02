import { describe, it, expect } from 'vitest';

import { SimulationDataExtractor } from './simulation-data-extractor';
import type { SimulationResult, SimulationDataPoint } from '../simulation-engine';
import type { ReturnsData } from '../returns';

/**
 * Tests for SimulationDataExtractor.getMeanReturnsData
 *
 * This method uses GEOMETRIC MEAN for calculating average returns, not arithmetic mean.
 *
 * Why geometric mean is correct for investment returns:
 * - Returns compound multiplicatively, not additively
 * - Geometric mean reflects the actual compounded growth rate
 *
 * Classic example: +50% then -50%
 * - Arithmetic mean: (0.50 + -0.50) / 2 = 0% (suggests no change)
 * - Geometric mean: √(1.50 × 0.50) - 1 = √0.75 - 1 ≈ -13.4%
 * - Reality: $100 → $150 → $75 (you lost 25% total, or ~13.4% annualized)
 */

// Helper to create minimal ReturnsData with specified annual returns
const createReturnsData = (returns: { stocks: number; bonds: number; cash: number; inflation: number }): ReturnsData => ({
  annualReturnRates: {
    stocks: returns.stocks,
    bonds: returns.bonds,
    cash: returns.cash,
  },
  annualYieldRates: { stocks: 0, bonds: 0, cash: 0 },
  annualInflationRate: returns.inflation,
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

// Helper to create minimal SimulationDataPoint
const createDataPoint = (age: number, returns: ReturnsData | null, phase: 'accumulation' | 'retirement'): SimulationDataPoint => ({
  date: '2024-01-01',
  age,
  portfolio: {
    totalValue: 100000,
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
  incomes: null,
  expenses: null,
  debts: null,
  physicalAssets: null,
  taxes: null,
  returns,
  phase: { name: phase },
});

// Helper to create minimal SimulationResult with specified returns
const createSimulationResult = (
  annualReturns: { stocks: number; bonds: number; cash: number; inflation: number }[],
  retirementYearIndex?: number
): SimulationResult => {
  const startAge = 30;
  const endAge = startAge + annualReturns.length;

  // First data point is year 0 (no returns)
  const data: SimulationDataPoint[] = [createDataPoint(startAge, null, 'accumulation')];

  // Add data points for each year with returns
  annualReturns.forEach((returns, index) => {
    const yearIndex = index + 1;
    const age = startAge + yearIndex;
    const isRetired = retirementYearIndex !== undefined && yearIndex >= retirementYearIndex;

    data.push(createDataPoint(age, createReturnsData(returns), isRetired ? 'retirement' : 'accumulation'));
  });

  return {
    data,
    context: {
      startAge,
      endAge,
      yearsToSimulate: annualReturns.length,
      startDate: '2024-01-01',
      endDate: '2054-01-01',
      retirementStrategy: { type: 'fixedAge', retirementAge: 65 },
      rmdAge: 73,
    },
  };
};

describe('SimulationDataExtractor.getMeanReturnsData', () => {
  it('geometric mean correctly handles the classic +50%/-50% case that arithmetic mean gets wrong', () => {
    // This is THE key test case that demonstrates why geometric mean is necessary
    // +50% then -50%: $100 → $150 → $75 (lost 25%, or ~13.4% annualized)
    const result = createSimulationResult([
      { stocks: 0.5, bonds: 0, cash: 0, inflation: 0 },
      { stocks: -0.5, bonds: 0, cash: 0, inflation: 0 },
    ]);

    const { meanStockReturn } = SimulationDataExtractor.getMeanReturnsData(result, null);

    // Geometric mean: (1.50 * 0.50)^(1/2) - 1 ≈ -0.134
    const expectedGeometricMean = Math.pow(1.5 * 0.5, 1 / 2) - 1;
    expect(meanStockReturn).toBeCloseTo(expectedGeometricMean, 6);

    // Arithmetic mean would incorrectly give 0%
    const arithmeticMean = (0.5 + -0.5) / 2;
    expect(arithmeticMean).toBe(0);
    expect(meanStockReturn).not.toBeCloseTo(arithmeticMean, 2);
  });

  it('geometric mean reflects actual compounded growth rate', () => {
    // 10% return each year for 3 years should give exactly 10% geometric mean
    const result = createSimulationResult([
      { stocks: 0.1, bonds: 0.05, cash: 0.02, inflation: 0.03 },
      { stocks: 0.1, bonds: 0.05, cash: 0.02, inflation: 0.03 },
      { stocks: 0.1, bonds: 0.05, cash: 0.02, inflation: 0.03 },
    ]);

    const stats = SimulationDataExtractor.getMeanReturnsData(result, null);

    expect(stats.meanStockReturn).toBeCloseTo(0.1, 6);
    expect(stats.meanBondReturn).toBeCloseTo(0.05, 6);
    expect(stats.meanCashReturn).toBeCloseTo(0.02, 6);
    expect(stats.meanInflationRate).toBeCloseTo(0.03, 6);
  });

  it('geometric mean is always less than arithmetic mean for varying returns', () => {
    // Mathematical property: GM ≤ AM (equality only when all values are equal)
    const returns = [0.15, 0.08, 0.12, 0.05, 0.2];
    const result = createSimulationResult(returns.map((r) => ({ stocks: r, bonds: 0, cash: 0, inflation: 0 })));

    const { meanStockReturn } = SimulationDataExtractor.getMeanReturnsData(result, null);

    const arithmeticMean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    expect(meanStockReturn).toBeLessThan(arithmeticMean);
  });

  it('higher volatility leads to lower geometric mean (volatility drag)', () => {
    // High volatility: big swings, Low volatility: smaller swings, similar arithmetic mean
    const highVolReturns = [0.3, -0.2, 0.25, -0.15, 0.2];
    const lowVolReturns = [0.1, 0.06, 0.08, 0.07, 0.09];

    const highVolResult = createSimulationResult(highVolReturns.map((r) => ({ stocks: r, bonds: 0, cash: 0, inflation: 0 })));
    const lowVolResult = createSimulationResult(lowVolReturns.map((r) => ({ stocks: r, bonds: 0, cash: 0, inflation: 0 })));

    const highVolStats = SimulationDataExtractor.getMeanReturnsData(highVolResult, null);
    const lowVolStats = SimulationDataExtractor.getMeanReturnsData(lowVolResult, null);

    expect(highVolStats.meanStockReturn).toBeLessThan(lowVolStats.meanStockReturn!);
  });

  it('geometric mean matches manual portfolio growth calculation', () => {
    // Verify geometric mean gives same result as actually compounding an investment
    const returns = [0.12, -0.08, 0.15, 0.03, 0.09];
    const result = createSimulationResult(returns.map((r) => ({ stocks: r, bonds: 0, cash: 0, inflation: 0 })));

    const { meanStockReturn } = SimulationDataExtractor.getMeanReturnsData(result, null);

    // Calculate actual ending value of $1 invested
    let value = 1;
    for (const r of returns) {
      value *= 1 + r;
    }

    // Value using geometric mean for 5 years should equal actual compounded value
    const valueUsingGeoMean = Math.pow(1 + meanStockReturn!, 5);
    expect(valueUsingGeoMean).toBeCloseTo(value, 6);
  });

  it('correctly tracks minimum and maximum stock returns', () => {
    const result = createSimulationResult([
      { stocks: 0.05, bonds: 0, cash: 0, inflation: 0 },
      { stocks: -0.2, bonds: 0, cash: 0, inflation: 0 }, // Min
      { stocks: 0.3, bonds: 0, cash: 0, inflation: 0 }, // Max
      { stocks: 0.1, bonds: 0, cash: 0, inflation: 0 },
    ]);

    const stats = SimulationDataExtractor.getMeanReturnsData(result, null);

    expect(stats.minStockReturn).toBe(-0.2);
    expect(stats.maxStockReturn).toBe(0.3);
  });

  it('calculates geometric mean for early retirement years', () => {
    const returns = [
      { stocks: 0.1, bonds: 0.05, cash: 0.02, inflation: 0.03 }, // Year 1: accumulation
      { stocks: 0.08, bonds: 0.05, cash: 0.02, inflation: 0.03 }, // Year 2: retirement starts
      { stocks: 0.15, bonds: 0.05, cash: 0.02, inflation: 0.03 }, // Year 3: early retirement
      { stocks: -0.1, bonds: 0.05, cash: 0.02, inflation: 0.03 }, // Year 4: early retirement
      { stocks: 0.2, bonds: 0.05, cash: 0.02, inflation: 0.03 }, // Year 5: early retirement
    ];

    const result = createSimulationResult(returns, 2);
    const retirementAge = 30 + 2;

    const stats = SimulationDataExtractor.getMeanReturnsData(result, retirementAge);

    // Early retirement: ages 33, 34, 35 (years where age > 32 AND age < 37)
    const earlyRetReturns = [0.15, -0.1, 0.2];
    const product = earlyRetReturns.reduce((p, r) => p * (1 + r), 1);
    const expectedGeoMean = Math.pow(product, 1 / earlyRetReturns.length) - 1;

    expect(stats.earlyRetirementStockReturn).toBeCloseTo(expectedGeoMean, 6);
  });

  it('returns null for mean values when no data points', () => {
    const result = createSimulationResult([]);

    const stats = SimulationDataExtractor.getMeanReturnsData(result, null);

    expect(stats.meanStockReturn).toBeNull();
    expect(stats.meanBondReturn).toBeNull();
    expect(stats.meanCashReturn).toBeNull();
    expect(stats.meanInflationRate).toBeNull();
  });

  it('handles zero returns correctly', () => {
    const result = createSimulationResult([
      { stocks: 0, bonds: 0, cash: 0, inflation: 0 },
      { stocks: 0, bonds: 0, cash: 0, inflation: 0 },
    ]);

    const stats = SimulationDataExtractor.getMeanReturnsData(result, null);

    expect(stats.meanStockReturn).toBe(0);
    expect(stats.meanBondReturn).toBe(0);
  });
});

/**
 * Tests for SimulationDataExtractor.getMilestonesData
 */

// Helper to create a data point with specified age, phase, and portfolio value
const createMilestoneDataPoint = (age: number, phase: 'accumulation' | 'retirement', totalValue: number): SimulationDataPoint => ({
  date: '2024-01-01',
  age,
  portfolio: {
    totalValue,
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
  incomes: null,
  expenses: null,
  debts: null,
  physicalAssets: null,
  taxes: null,
  returns: null,
  phase: { name: phase },
});

describe('SimulationDataExtractor.getMilestonesData', () => {
  it('detects retirement age correctly from first retirement phase year', () => {
    const data: SimulationDataPoint[] = [
      createMilestoneDataPoint(30, 'accumulation', 500000),
      createMilestoneDataPoint(31, 'accumulation', 550000),
      createMilestoneDataPoint(32, 'accumulation', 600000),
      createMilestoneDataPoint(33, 'retirement', 700000), // First retirement year
      createMilestoneDataPoint(34, 'retirement', 750000),
    ];

    const milestones = SimulationDataExtractor.getMilestonesData(data, 30);

    expect(milestones.retirementAge).toBe(33);
    expect(milestones.yearsToRetirement).toBe(3);
  });

  it('detects bankruptcy age when portfolio drops below 0.1', () => {
    const data: SimulationDataPoint[] = [
      createMilestoneDataPoint(30, 'accumulation', 500000),
      createMilestoneDataPoint(31, 'accumulation', 400000),
      createMilestoneDataPoint(32, 'retirement', 300000),
      createMilestoneDataPoint(33, 'retirement', 100000),
      createMilestoneDataPoint(34, 'retirement', 0.05), // Bankruptcy
      createMilestoneDataPoint(35, 'retirement', 0),
    ];

    const milestones = SimulationDataExtractor.getMilestonesData(data, 30);

    expect(milestones.bankruptcyAge).toBe(34);
    expect(milestones.yearsToBankruptcy).toBe(4);
  });

  it('returns null values when milestones are not reached', () => {
    const data: SimulationDataPoint[] = [
      createMilestoneDataPoint(30, 'accumulation', 500000),
      createMilestoneDataPoint(31, 'accumulation', 600000),
      createMilestoneDataPoint(32, 'accumulation', 700000),
    ];

    const milestones = SimulationDataExtractor.getMilestonesData(data, 30);

    expect(milestones.retirementAge).toBeNull();
    expect(milestones.yearsToRetirement).toBeNull();
    expect(milestones.bankruptcyAge).toBeNull();
    expect(milestones.yearsToBankruptcy).toBeNull();
  });

  it('calculates years-to-milestone correctly from non-integer start age', () => {
    const data: SimulationDataPoint[] = [
      createMilestoneDataPoint(30.5, 'accumulation', 500000),
      createMilestoneDataPoint(31.5, 'accumulation', 550000),
      createMilestoneDataPoint(32.5, 'retirement', 600000),
    ];

    const milestones = SimulationDataExtractor.getMilestonesData(data, 30.5);

    // retirementAge = floor(32.5) = 32
    // yearsToRetirement = 32 - floor(30.5) = 32 - 30 = 2
    expect(milestones.retirementAge).toBe(32);
    expect(milestones.yearsToRetirement).toBe(2);
  });

  it('only records the first occurrence of each milestone', () => {
    // Test that even if portfolio dips multiple times below 0.1, only first bankruptcy is recorded
    const data: SimulationDataPoint[] = [
      createMilestoneDataPoint(30, 'accumulation', 500000),
      createMilestoneDataPoint(31, 'retirement', 600000),
      createMilestoneDataPoint(32, 'retirement', 0.05), // First bankruptcy
      createMilestoneDataPoint(33, 'retirement', 50000), // Recovery (hypothetical)
      createMilestoneDataPoint(34, 'retirement', 0), // Second bankruptcy
    ];

    const milestones = SimulationDataExtractor.getMilestonesData(data, 30);

    // Should only record the first bankruptcy at age 32
    expect(milestones.bankruptcyAge).toBe(32);
    expect(milestones.yearsToRetirement).toBe(1);
    expect(milestones.retirementAge).toBe(31);
  });
});

/**
 * Tests for SimulationDataExtractor.getTaxAmountsByType
 */

// Helper to create a data point with tax data
const createTaxDataPoint = (options: {
  incomeTax?: number;
  ficaTax?: number;
  capGainsTax?: number;
  niit?: number;
  earlyWithdrawalPenalties?: number;
}): SimulationDataPoint => ({
  date: '2024-01-01',
  age: 40,
  portfolio: {
    totalValue: 1000000,
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
    totalFicaTax: options.ficaTax ?? 0,
    totalIncomeAfterPayrollDeductions: 72350,
    totalSocialSecurityIncome: 0,
    totalTaxFreeIncome: 0,
    perIncomeData: {},
  },
  expenses: null,
  debts: null,
  physicalAssets: null,
  taxes: {
    incomeTaxes: {
      taxableIncomeTaxedAsOrdinary: 65400,
      incomeTaxBrackets: [],
      incomeTaxAmount: options.incomeTax ?? 0,
      effectiveIncomeTaxRate: 0.125,
      topMarginalIncomeTaxRate: 0.22,
    },
    capitalGainsTaxes: {
      taxableIncomeTaxedAsCapGains: 0,
      capitalGainsTaxBrackets: [],
      capitalGainsTaxAmount: options.capGainsTax ?? 0,
      effectiveCapitalGainsTaxRate: 0,
      topMarginalCapitalGainsTaxRate: 0,
    },
    niit: {
      netInvestmentIncome: 0,
      incomeSubjectToNiit: 0,
      niitAmount: options.niit ?? 0,
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
      totalPenaltyAmount: options.earlyWithdrawalPenalties ?? 0,
    },
    totalTaxesDue: 0,
    totalTaxesRefund: 0,
    totalTaxableIncome: 65400,
    adjustments: {},
    deductions: {},
    incomeSources: {
      realizedGains: 0,
      capitalLossDeduction: 0,
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
  returns: null,
  phase: { name: 'accumulation' },
});

describe('SimulationDataExtractor.getTaxAmountsByType', () => {
  it('extracts all tax types correctly', () => {
    const dp = createTaxDataPoint({
      incomeTax: 15000,
      ficaTax: 7650,
      capGainsTax: 3000,
      niit: 500,
      earlyWithdrawalPenalties: 1000,
    });

    const taxes = SimulationDataExtractor.getTaxAmountsByType(dp);

    expect(taxes.incomeTax).toBe(15000);
    expect(taxes.ficaTax).toBe(7650);
    expect(taxes.capGainsTax).toBe(3000);
    expect(taxes.niit).toBe(500);
    expect(taxes.earlyWithdrawalPenalties).toBe(1000);
  });

  it('calculates totalTaxes correctly (excluding penalties)', () => {
    const dp = createTaxDataPoint({
      incomeTax: 10000,
      ficaTax: 5000,
      capGainsTax: 2000,
      niit: 500,
      earlyWithdrawalPenalties: 1000,
    });

    const taxes = SimulationDataExtractor.getTaxAmountsByType(dp);

    // totalTaxes = incomeTax + ficaTax + capGainsTax + niit
    expect(taxes.totalTaxes).toBe(17500);
  });

  it('calculates totalTaxesAndPenalties correctly', () => {
    const dp = createTaxDataPoint({
      incomeTax: 10000,
      ficaTax: 5000,
      capGainsTax: 2000,
      niit: 500,
      earlyWithdrawalPenalties: 1000,
    });

    const taxes = SimulationDataExtractor.getTaxAmountsByType(dp);

    // totalTaxesAndPenalties = totalTaxes + earlyWithdrawalPenalties
    expect(taxes.totalTaxesAndPenalties).toBe(18500);
  });

  it('handles missing tax data (nulls) by returning zeros', () => {
    const dp: SimulationDataPoint = {
      ...createTaxDataPoint({}),
      taxes: null,
      incomes: null,
      debts: null,
      physicalAssets: null,
    };

    const taxes = SimulationDataExtractor.getTaxAmountsByType(dp);

    expect(taxes.incomeTax).toBe(0);
    expect(taxes.ficaTax).toBe(0);
    expect(taxes.capGainsTax).toBe(0);
    expect(taxes.niit).toBe(0);
    expect(taxes.totalTaxes).toBe(0);
    expect(taxes.earlyWithdrawalPenalties).toBe(0);
    expect(taxes.totalTaxesAndPenalties).toBe(0);
  });
});

/**
 * Tests for SimulationDataExtractor.getCashFlowData
 */

// Helper to create a data point with income/expense/tax data for surplus/deficit testing
const createCashFlowDataPoint = (options: {
  totalIncome: number;
  socialSecurityIncome?: number;
  taxFreeIncome?: number;
  employerMatch?: number;
  totalExpenses: number;
  totalTaxesAndPenalties: number;
}): SimulationDataPoint => ({
  date: '2024-01-01',
  age: 40,
  portfolio: {
    totalValue: 1000000,
    assetAllocation: { stocks: 0.6, bonds: 0.3, cash: 0.1 },
    contributionsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
    withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
    cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
    cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
    employerMatchForPeriod: options.employerMatch ?? 0,
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
    totalIncome: options.totalIncome,
    totalAmountWithheld: 0,
    totalFicaTax: 0,
    totalIncomeAfterPayrollDeductions: options.totalIncome,
    totalSocialSecurityIncome: options.socialSecurityIncome ?? 0,
    totalTaxFreeIncome: options.taxFreeIncome ?? 0,
    perIncomeData: {},
  },
  expenses: {
    totalExpenses: options.totalExpenses,
    perExpenseData: {},
  },
  debts: null,
  physicalAssets: null,
  taxes: {
    incomeTaxes: {
      taxableIncomeTaxedAsOrdinary: options.totalIncome - 14600,
      incomeTaxBrackets: [],
      incomeTaxAmount: options.totalTaxesAndPenalties,
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
    totalTaxesDue: options.totalTaxesAndPenalties,
    totalTaxesRefund: 0,
    totalTaxableIncome: options.totalIncome - 14600,
    adjustments: {},
    deductions: {},
    incomeSources: {
      realizedGains: 0,
      capitalLossDeduction: 0,
      taxDeferredWithdrawals: 0,
      taxableRetirementDistributions: 0,
      taxableDividendIncome: 0,
      taxableInterestIncome: 0,
      earnedIncome: options.totalIncome,
      socialSecurityIncome: options.socialSecurityIncome ?? 0,
      taxableSocialSecurityIncome: 0,
      maxTaxableSocialSecurityPercentage: 0.85,
      provisionalIncome: 0,
      taxFreeIncome: options.taxFreeIncome ?? 0,
      grossIncome: options.totalIncome,
      incomeTaxedAsOrdinary: options.totalIncome,
      incomeTaxedAsLtcg: 0,
      taxDeductibleContributions: 0,
      adjustedGrossIncome: options.totalIncome,
      adjustedIncomeTaxedAsOrdinary: options.totalIncome,
      adjustedIncomeTaxedAsCapGains: 0,
      totalIncome: options.totalIncome,
      earlyWithdrawals: { rothEarnings: 0, '401kAndIra': 0, hsa: 0 },
    },
  },
  returns: null,
  phase: { name: 'accumulation' },
});

describe('SimulationDataExtractor.getCashFlowData', () => {
  it('calculates surplus/deficit correctly (income - expenses - taxes)', () => {
    const dp = createCashFlowDataPoint({
      totalIncome: 100000,
      totalExpenses: 50000,
      totalTaxesAndPenalties: 20000,
    });

    const data = SimulationDataExtractor.getCashFlowData(dp);

    // surplusDeficit = totalIncome - totalExpenses - totalTaxesAndPenalties
    // = 100000 - 50000 - 20000 = 30000
    expect(data.surplusDeficit).toBe(30000);
  });

  it('includes employer match in total income', () => {
    const dp = createCashFlowDataPoint({
      totalIncome: 100000,
      employerMatch: 5000,
      totalExpenses: 50000,
      totalTaxesAndPenalties: 20000,
    });

    const data = SimulationDataExtractor.getCashFlowData(dp);

    // totalIncome = income from incomes = 100000
    expect(data.totalIncome).toBe(100000);
    expect(data.employerMatch).toBe(5000);
    // surplusDeficit = 100000 + 5000 - 50000 - 20000 = 35000
    expect(data.surplusDeficit).toBe(35000);
  });

  it('separates Social Security income correctly', () => {
    const dp = createCashFlowDataPoint({
      totalIncome: 80000,
      socialSecurityIncome: 30000,
      totalExpenses: 40000,
      totalTaxesAndPenalties: 10000,
    });

    const data = SimulationDataExtractor.getCashFlowData(dp);

    expect(data.socialSecurityIncome).toBe(30000);
    expect(data.earnedIncome).toBe(50000); // 80000 - 30000 - 0 (taxFree)
  });

  it('separates tax-free income correctly', () => {
    const dp = createCashFlowDataPoint({
      totalIncome: 100000,
      taxFreeIncome: 10000,
      totalExpenses: 50000,
      totalTaxesAndPenalties: 15000,
    });

    const data = SimulationDataExtractor.getCashFlowData(dp);

    expect(data.taxFreeIncome).toBe(10000);
    expect(data.earnedIncome).toBe(90000); // 100000 - 0 (SS) - 10000 (taxFree)
  });

  it('handles null income data by returning zeros', () => {
    const dp: SimulationDataPoint = {
      ...createCashFlowDataPoint({
        totalIncome: 0,
        totalExpenses: 0,
        totalTaxesAndPenalties: 0,
      }),
      incomes: null,
      debts: null,
      physicalAssets: null,
    };

    const data = SimulationDataExtractor.getCashFlowData(dp);

    expect(data.totalIncome).toBe(0);
    expect(data.earnedIncome).toBe(0);
    expect(data.socialSecurityIncome).toBe(0);
    expect(data.taxFreeIncome).toBe(0);
  });

  it('handles null expense data by returning zero expenses', () => {
    const dp: SimulationDataPoint = {
      ...createCashFlowDataPoint({
        totalIncome: 100000,
        totalExpenses: 0,
        totalTaxesAndPenalties: 15000,
      }),
      expenses: null,
    };

    const data = SimulationDataExtractor.getCashFlowData(dp);

    expect(data.totalExpenses).toBe(0);
  });

  it('caps totalDebtPayments at 0 for cash flow display (negative interest scenario)', () => {
    // When inflation > APR, raw interest can be negative
    // Cash flow display should cap at 0 (can't receive money from debt)
    const dp: SimulationDataPoint = {
      ...createCashFlowDataPoint({
        totalIncome: 100000,
        totalExpenses: 50000,
        totalTaxesAndPenalties: 15000,
      }),
      debts: {
        totalDebtBalance: 10000,
        totalPayment: 500,
        totalInterest: -100, // Negative raw interest
        totalPrincipalPaid: 600, // payment - interest = 500 - (-100) = 600 (capped)
        totalUnpaidInterest: 0,
        totalDebtPaydown: 600, // raw: 500 - (-100) = 600
        totalUnsecuredDebtIncurred: 0,
        perDebtData: {},
      },
      physicalAssets: null,
    };

    const data = SimulationDataExtractor.getCashFlowData(dp);

    // totalDebtPayments should be capped at 0 minimum, though in this case it's 500
    expect(data.totalDebtPayments).toBeGreaterThanOrEqual(0);
    expect(data.totalDebtPayments).toBe(500);
  });

  it('caps totalInterestPayments at 0 for cash flow display (negative interest scenario)', () => {
    // When inflation > APR, raw interest can be negative
    // Cash flow display should cap at 0
    const dp: SimulationDataPoint = {
      ...createCashFlowDataPoint({
        totalIncome: 100000,
        totalExpenses: 50000,
        totalTaxesAndPenalties: 15000,
      }),
      debts: {
        totalDebtBalance: 10000,
        totalPayment: 500,
        totalInterest: -100, // Negative raw interest (inflation > APR)
        totalPrincipalPaid: 600,
        totalUnpaidInterest: 0,
        totalDebtPaydown: 600,
        totalUnsecuredDebtIncurred: 0,
        perDebtData: {},
      },
      physicalAssets: null,
    };

    const data = SimulationDataExtractor.getCashFlowData(dp);

    // totalInterestPayments should be capped at 0, not negative
    expect(data.totalInterestPayments).toBeGreaterThanOrEqual(0);
    expect(data.totalInterestPayments).toBe(0);
  });

  it('does not affect surplusDeficit calculation when interest is negative', () => {
    // surplusDeficit uses capped totalInterestPayments (0 when negative)
    const dp: SimulationDataPoint = {
      ...createCashFlowDataPoint({
        totalIncome: 100000,
        totalExpenses: 50000,
        totalTaxesAndPenalties: 15000,
      }),
      debts: {
        totalDebtBalance: 10000,
        totalPayment: 0,
        totalInterest: -100, // Negative raw interest
        totalPrincipalPaid: 100, // capped: max(0, 0 - (-100)) = 100
        totalUnpaidInterest: 0,
        totalDebtPaydown: 100, // raw: 0 - (-100) = 100
        totalUnsecuredDebtIncurred: 0,
        perDebtData: {},
      },
      physicalAssets: null,
    };

    const data = SimulationDataExtractor.getCashFlowData(dp);

    // surplusDeficit = 100000 + 0 (employerMatch) - 50000 - 15000 - 0 (capped interest) = 35000
    expect(data.surplusDeficit).toBe(35000);
  });
});

/**
 * Tests for SimulationDataExtractor.getCashFlowData - netCashFlow calculation
 *
 * The netCashFlow formula:
 *   netCashFlow = totalIncome + amountLiquidated + assetSaleProceeds
 *               - totalExpenses - totalTaxesAndPenalties - totalDebtPayments
 *               - amountInvested - assetPurchaseOutlay
 *
 * Key insight: Asset sales with loans are handled correctly because:
 * - assetSaleProceeds = NET proceeds (market value - loan payoff at sale)
 * - totalDebtPayments = only MONTHLY loan payments, NOT loan payoff at sale
 * This prevents double-counting the loan payoff.
 */

// Helper to create a comprehensive data point for netCashFlow testing
const createNetCashFlowDataPoint = (options: {
  // Income
  totalIncome?: number;
  // Expenses
  totalExpenses?: number;
  // Taxes (simplified - all goes to income tax)
  totalTaxes?: number;
  // Portfolio contributions (stocks, bonds, cash separately)
  contributions?: { stocks: number; bonds: number; cash: number };
  employerMatch?: number;
  // Portfolio withdrawals (stocks, bonds, cash separately)
  withdrawals?: { stocks: number; bonds: number; cash: number };
  // Physical assets
  assetSaleProceeds?: number;
  assetPurchaseOutlay?: number;
  loanPayment?: number;
  loanInterest?: number;
  // Unsecured debts
  debtPayment?: number;
  debtInterest?: number;
}): SimulationDataPoint => ({
  date: '2024-01-01',
  age: 40,
  portfolio: {
    totalValue: 1000000,
    assetAllocation: { stocks: 0.6, bonds: 0.3, cash: 0.1 },
    contributionsForPeriod: options.contributions ?? { stocks: 0, bonds: 0, cash: 0 },
    withdrawalsForPeriod: options.withdrawals ?? { stocks: 0, bonds: 0, cash: 0 },
    cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
    cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
    employerMatchForPeriod: options.employerMatch ?? 0,
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
    totalIncome: options.totalIncome ?? 0,
    totalAmountWithheld: 0,
    totalFicaTax: 0,
    totalIncomeAfterPayrollDeductions: options.totalIncome ?? 0,
    totalSocialSecurityIncome: 0,
    totalTaxFreeIncome: 0,
    perIncomeData: {},
  },
  expenses: {
    totalExpenses: options.totalExpenses ?? 0,
    perExpenseData: {},
  },
  debts:
    options.debtPayment !== undefined || options.debtInterest !== undefined
      ? {
          totalDebtBalance: 10000,
          totalPayment: options.debtPayment ?? 0,
          totalInterest: options.debtInterest ?? 0,
          totalPrincipalPaid: Math.max(0, (options.debtPayment ?? 0) - (options.debtInterest ?? 0)),
          totalUnpaidInterest: 0,
          totalDebtPaydown: (options.debtPayment ?? 0) - (options.debtInterest ?? 0),
          totalUnsecuredDebtIncurred: 0,
          perDebtData: {},
        }
      : null,
  physicalAssets:
    options.assetSaleProceeds !== undefined || options.assetPurchaseOutlay !== undefined || options.loanPayment !== undefined
      ? {
          totalMarketValue: 500000,
          totalLoanBalance: 200000,
          totalEquity: 300000,
          totalAppreciation: 0,
          totalLoanPayment: options.loanPayment ?? 0,
          totalInterest: options.loanInterest ?? 0,
          totalPrincipalPaid: Math.max(0, (options.loanPayment ?? 0) - (options.loanInterest ?? 0)),
          totalUnpaidInterest: 0,
          totalDebtPaydown: (options.loanPayment ?? 0) - (options.loanInterest ?? 0),
          totalPurchaseOutlay: options.assetPurchaseOutlay ?? 0,
          totalPurchaseMarketValue: 0,
          totalSaleProceeds: options.assetSaleProceeds ?? 0,
          totalSaleMarketValue: 0,
          totalCapitalGain: 0,
          totalSecuredDebtIncurred: 0,
          totalSecuredDebtPaidAtSale: 0,
          perAssetData: {},
        }
      : null,
  taxes: {
    incomeTaxes: {
      taxableIncomeTaxedAsOrdinary: 0,
      incomeTaxBrackets: [],
      incomeTaxAmount: options.totalTaxes ?? 0,
      effectiveIncomeTaxRate: 0,
      topMarginalIncomeTaxRate: 0,
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
    totalTaxesDue: options.totalTaxes ?? 0,
    totalTaxesRefund: 0,
    totalTaxableIncome: 0,
    adjustments: {},
    deductions: {},
    incomeSources: {
      realizedGains: 0,
      capitalLossDeduction: 0,
      taxDeferredWithdrawals: 0,
      taxableRetirementDistributions: 0,
      taxableDividendIncome: 0,
      taxableInterestIncome: 0,
      earnedIncome: 0,
      socialSecurityIncome: 0,
      taxableSocialSecurityIncome: 0,
      maxTaxableSocialSecurityPercentage: 0.85,
      provisionalIncome: 0,
      taxFreeIncome: 0,
      grossIncome: 0,
      incomeTaxedAsOrdinary: 0,
      incomeTaxedAsLtcg: 0,
      taxDeductibleContributions: 0,
      adjustedGrossIncome: 0,
      adjustedIncomeTaxedAsOrdinary: 0,
      adjustedIncomeTaxedAsCapGains: 0,
      totalIncome: 0,
      earlyWithdrawals: { rothEarnings: 0, '401kAndIra': 0, hsa: 0 },
    },
  },
  returns: null,
  phase: { name: 'accumulation' },
});

describe('SimulationDataExtractor.getCashFlowData - netCashFlow', () => {
  it('basic accumulation: income flows to investments, netCashFlow is zero', () => {
    // Scenario: Working year, income covers expenses + taxes + investments
    // Income: $100K, Expenses: $50K, Taxes: $20K, Invest: $30K
    // netCashFlow = 100K - 50K - 20K - 30K = 0
    const dp = createNetCashFlowDataPoint({
      totalIncome: 100000,
      totalExpenses: 50000,
      totalTaxes: 20000,
      contributions: { stocks: 20000, bonds: 10000, cash: 0 },
    });

    const data = SimulationDataExtractor.getCashFlowData(dp);

    expect(data.totalIncome).toBe(100000);
    expect(data.totalExpenses).toBe(50000);
    expect(data.totalTaxesAndPenalties).toBe(20000);
    expect(data.amountInvested).toBe(30000); // stocks + bonds only
    expect(data.netCashFlow).toBe(0);
  });

  it('basic liquidation: retirement withdrawal covers expenses', () => {
    // Scenario: Retired, no income, liquidate portfolio for expenses
    // Liquidate: $60K, Expenses: $40K, Taxes: $10K
    // netCashFlow = 60K - 40K - 10K = $10K (excess to cash)
    const dp = createNetCashFlowDataPoint({
      totalIncome: 0,
      totalExpenses: 40000,
      totalTaxes: 10000,
      withdrawals: { stocks: 40000, bonds: 20000, cash: 0 },
    });

    const data = SimulationDataExtractor.getCashFlowData(dp);

    expect(data.amountLiquidated).toBe(60000); // stocks + bonds only
    expect(data.netCashFlow).toBe(10000);
  });

  it('asset sale WITH loan: net proceeds correctly reflect loan payoff (critical test)', () => {
    // This is THE critical test case for the netCashFlow formula.
    //
    // Scenario: Sell $500K house with $200K loan
    // - assetSaleProceeds = $300K (NET: $500K market value - $200K loan payoff)
    // - totalDebtPayments = $0 (loan payoff is NOT in monthly payments)
    // - netCashFlow = $300K (all flows to cash)
    //
    // The formula works because assetSaleProceeds is NET proceeds, not gross.
    // The loan payoff is "embedded" in the calculation: buyer pays $500K,
    // you pay $200K to lender at closing, net cash received = $300K.
    const dp = createNetCashFlowDataPoint({
      assetSaleProceeds: 300000, // NET proceeds after loan payoff
      loanPayment: 0, // No monthly payments (sold at start of year)
    });

    const data = SimulationDataExtractor.getCashFlowData(dp);

    expect(data.assetSaleProceeds).toBe(300000);
    expect(data.totalDebtPayments).toBe(0); // No double-counting of loan payoff
    expect(data.netCashFlow).toBe(300000);
  });

  it('underwater asset sale: negative proceeds when loan exceeds value', () => {
    // Scenario: Sell $250K house with $400K loan (underwater)
    // - assetSaleProceeds = -$150K (user owes money at closing)
    // - netCashFlow = -$150K (cash deficit - user needs to bring money to closing)
    const dp = createNetCashFlowDataPoint({
      assetSaleProceeds: -150000, // Negative NET proceeds
    });

    const data = SimulationDataExtractor.getCashFlowData(dp);

    expect(data.assetSaleProceeds).toBe(-150000);
    expect(data.netCashFlow).toBe(-150000);
  });

  it('asset purchase: down payment is cash outflow', () => {
    // Scenario: Buy $400K house with $80K down payment
    // - assetPurchaseOutlay = $80K (down payment is cash outflow)
    // - netCashFlow = -$80K
    const dp = createNetCashFlowDataPoint({
      assetPurchaseOutlay: 80000,
    });

    const data = SimulationDataExtractor.getCashFlowData(dp);

    expect(data.assetPurchaseOutlay).toBe(80000);
    expect(data.netCashFlow).toBe(-80000);
  });

  it('combined scenario: all cash flow components in one year', () => {
    // Scenario: Complex year with all flows
    // Income: $100K
    // Liquidation: $20K (stocks: 15K, bonds: 5K)
    // Asset sale proceeds: $50K (net)
    // Expenses: $60K
    // Taxes: $25K
    // Debt payments: $12K (loan: $10K, unsecured: $2K)
    // Investments: $30K (stocks: 20K, bonds: 10K)
    // Asset purchase outlay: $15K
    //
    // netCashFlow = (100K + 20K + 50K) - (60K + 25K + 12K + 30K + 15K)
    //             = 170K - 142K = 28K
    const dp = createNetCashFlowDataPoint({
      totalIncome: 100000,
      withdrawals: { stocks: 15000, bonds: 5000, cash: 0 },
      assetSaleProceeds: 50000,
      totalExpenses: 60000,
      totalTaxes: 25000,
      loanPayment: 10000,
      loanInterest: 5000,
      debtPayment: 2000,
      debtInterest: 500,
      contributions: { stocks: 20000, bonds: 10000, cash: 0 },
      assetPurchaseOutlay: 15000,
    });

    const data = SimulationDataExtractor.getCashFlowData(dp);

    expect(data.totalIncome).toBe(100000);
    expect(data.amountLiquidated).toBe(20000);
    expect(data.assetSaleProceeds).toBe(50000);
    expect(data.totalExpenses).toBe(60000);
    expect(data.totalTaxesAndPenalties).toBe(25000);
    expect(data.totalDebtPayments).toBe(12000); // loan + unsecured
    expect(data.amountInvested).toBe(30000);
    expect(data.assetPurchaseOutlay).toBe(15000);
    expect(data.netCashFlow).toBe(28000);
  });

  it('cash contributions are excluded from amountInvested', () => {
    // The sumInvestments function only sums stocks + bonds, not cash.
    // This is intentional because cash stays liquid and doesn't need to be
    // "invested" in the traditional sense.
    //
    // contributions: { stocks: 10K, bonds: 10K, cash: 5K }
    // amountInvested = 20K (NOT 25K - cash excluded)
    const dp = createNetCashFlowDataPoint({
      totalIncome: 50000,
      totalExpenses: 25000,
      contributions: { stocks: 10000, bonds: 10000, cash: 5000 },
    });

    const data = SimulationDataExtractor.getCashFlowData(dp);

    // amountInvested should be stocks + bonds only
    expect(data.amountInvested).toBe(20000);
    // netCashFlow = 50K - 25K - 0 (taxes) - 20K (invested) = 5K
    // The 5K cash contribution is NOT subtracted from netCashFlow
    expect(data.netCashFlow).toBe(5000);
  });

  it('employer match is subtracted from amountInvested', () => {
    // The employer match is "free money" that doesn't come from the user's income,
    // so it should be subtracted from amountInvested to reflect actual user outflow.
    //
    // contributions: { stocks: 15K, bonds: 5K, cash: 0 } = 20K
    // employerMatch: $5K
    // amountInvested = 20K - 5K = 15K
    const dp = createNetCashFlowDataPoint({
      totalIncome: 100000,
      totalExpenses: 50000,
      totalTaxes: 20000,
      contributions: { stocks: 15000, bonds: 5000, cash: 0 },
      employerMatch: 5000,
    });

    const data = SimulationDataExtractor.getCashFlowData(dp);

    expect(data.employerMatch).toBe(5000);
    expect(data.amountInvested).toBe(15000); // 20K contributions - 5K match
    // netCashFlow = 100K - 50K - 20K - 15K = 15K
    expect(data.netCashFlow).toBe(15000);
  });

  it('monthly loan payments are included in totalDebtPayments (not sale)', () => {
    // Regular monthly mortgage payments should be included in totalDebtPayments.
    // This is different from loan payoff at sale (which is in assetSaleProceeds).
    //
    // Monthly loan payments: $1200/year
    // totalDebtPayments = 1200
    const dp = createNetCashFlowDataPoint({
      totalIncome: 100000,
      totalExpenses: 50000,
      totalTaxes: 20000,
      loanPayment: 12000,
      loanInterest: 6000,
    });

    const data = SimulationDataExtractor.getCashFlowData(dp);

    expect(data.totalDebtPayments).toBe(12000);
    // netCashFlow = 100K - 50K - 20K - 12K = 18K
    expect(data.netCashFlow).toBe(18000);
  });

  it('high inflation scenario: negative interest is capped at 0 for totalDebtPayments', () => {
    // When inflation > APR, raw interest can be negative in real terms.
    // However, totalDebtPayments is capped at 0 (can't have negative payments).
    //
    // debtPayment: 0, interest: -100 (inflation eroding debt)
    // totalDebtPayments = max(0, 0 + 0) = 0 (capped)
    //
    // Note: The loan payment + unsecured payment are both 0, and the capping
    // happens at the sum level, not the interest level.
    const dp = createNetCashFlowDataPoint({
      totalIncome: 50000,
      totalExpenses: 30000,
      debtPayment: 0,
      debtInterest: -100, // Negative interest (inflation > APR)
    });

    const data = SimulationDataExtractor.getCashFlowData(dp);

    // totalDebtPayments is capped at 0
    expect(data.totalDebtPayments).toBe(0);
    // netCashFlow = 50K - 30K - 0 = 20K
    expect(data.netCashFlow).toBe(20000);
  });

  it('zero values: all components at zero result in zero netCashFlow', () => {
    const dp = createNetCashFlowDataPoint({});

    const data = SimulationDataExtractor.getCashFlowData(dp);

    expect(data.totalIncome).toBe(0);
    expect(data.amountLiquidated).toBe(0);
    expect(data.assetSaleProceeds).toBe(0);
    expect(data.totalExpenses).toBe(0);
    expect(data.totalTaxesAndPenalties).toBe(0);
    expect(data.totalDebtPayments).toBe(0);
    expect(data.amountInvested).toBe(0);
    expect(data.assetPurchaseOutlay).toBe(0);
    expect(data.netCashFlow).toBe(0);
  });
});

/**
 * Tests for SimulationDataExtractor.getAssetsAndLiabilitiesData - Raw Values for Net Worth
 */

describe('SimulationDataExtractor.getAssetsAndLiabilitiesData - Raw Values', () => {
  // Helper to create data point with debt data
  const createAssetLiabilityDataPoint = (options: {
    portfolioValue: number;
    debtBalance?: number;
    debtPayment?: number;
    interest?: number;
    principalPaid?: number;
    unpaidInterest?: number;
    debtPaydown?: number;
  }): SimulationDataPoint => ({
    date: '2024-01-01',
    age: 40,
    portfolio: {
      totalValue: options.portfolioValue,
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
    incomes: null,
    expenses: null,
    debts:
      options.debtBalance !== undefined
        ? {
            totalDebtBalance: options.debtBalance,
            totalPayment: options.debtPayment ?? 0,
            totalInterest: options.interest ?? 0,
            totalPrincipalPaid: options.principalPaid ?? 0,
            totalUnpaidInterest: options.unpaidInterest ?? 0,
            totalDebtPaydown: options.debtPaydown ?? 0,
            totalUnsecuredDebtIncurred: 0,
            perDebtData: {},
          }
        : null,
    physicalAssets: null,
    taxes: null,
    returns: null,
    phase: { name: 'accumulation' },
  });

  it('calculates debtPaydown as payments minus interest (works with negative interest)', () => {
    // When inflation > APR:
    // - Raw interest is negative (e.g., -100)
    // - debtPaydown = payment - interest = 0 - (-100) = 100
    // - This correctly reflects debt eroding due to inflation
    const dp = createAssetLiabilityDataPoint({
      portfolioValue: 1000000,
      debtBalance: 10000,
      debtPayment: 0,
      interest: -100, // Negative raw interest (inflation > APR)
      principalPaid: 100, // capped: max(0, 0 - (-100)) = 100
      debtPaydown: 100, // raw: 0 - (-100) = 100
      unpaidInterest: 0,
    });

    const data = SimulationDataExtractor.getAssetsAndLiabilitiesData(dp);

    // debtPaydown = payments - interest = 0 - (-100) = 100
    expect(data.debtPaydown).toBe(100);
  });

  it('correctly calculates debtPaydown with positive interest (normal scenario)', () => {
    const dp = createAssetLiabilityDataPoint({
      portfolioValue: 1000000,
      debtBalance: 10000,
      debtPayment: 500,
      interest: 50, // Positive interest (normal scenario)
      principalPaid: 450, // capped: max(0, 500 - 50) = 450
      debtPaydown: 450, // raw: 500 - 50 = 450
      unpaidInterest: 0,
    });

    const data = SimulationDataExtractor.getAssetsAndLiabilitiesData(dp);

    // debtPaydown = payments - interest = 500 - 50 = 450
    expect(data.debtPaydown).toBe(450);
  });

  it('correctly calculates debtPaydown with underpayment (payment < interest) - regression test', () => {
    // REGRESSION TEST: This scenario catches the bug where debtPaydown was calculated
    // incorrectly. When payment < interest, debtPaydown should be negative.
    //
    // The debt balance only increases by 100 (the unpaid interest), not 200.
    const dp = createAssetLiabilityDataPoint({
      portfolioValue: 1000000,
      debtBalance: 10000,
      debtPayment: 100,
      interest: 200, // Large interest
      principalPaid: 0, // capped: max(0, 100 - 200) = 0
      debtPaydown: -100, // raw: 100 - 200 = -100
      unpaidInterest: 100, // max(0, 200 - 100) = 100
    });

    const data = SimulationDataExtractor.getAssetsAndLiabilitiesData(dp);

    // debtPaydown = payments - interest = 100 - 200 = -100
    // This correctly represents the debt balance increasing by 100
    expect(data.debtPaydown).toBe(-100);
  });

  it('correctly calculates debtPaydown with negative interest AND payment - regression test', () => {
    // This tests the combined scenario: inflation > APR with an active payment
    // The debt should decrease by payment + |negative interest|
    //
    // debtPaydown = payments - interest = 500 - (-100) = 600
    //
    // Having this test ensures the formula works correctly for this scenario.
    const dp = createAssetLiabilityDataPoint({
      portfolioValue: 1000000,
      debtBalance: 10000,
      debtPayment: 500,
      interest: -100, // Negative interest (inflation > APR)
      principalPaid: 600, // capped: max(0, 500 - (-100)) = 600
      debtPaydown: 600, // raw: 500 - (-100) = 600
      unpaidInterest: 0, // max(0, -100 - 500) = 0
    });

    const data = SimulationDataExtractor.getAssetsAndLiabilitiesData(dp);

    // debtPaydown = payments - interest = 500 - (-100) = 600
    // Debt decreased by 600 (500 from payment + 100 from inflation erosion)
    expect(data.debtPaydown).toBe(600);
  });
});

/**
 * Tests for SimulationDataExtractor.getPercentInPhaseForYear
 */

import type { MultiSimulationResult } from '../simulation-engine';

// Helper to create a multi-simulation result with specified phases for a given year
const createMultiSimForPhaseTest = (
  phaseConfigs: Array<{ phase: 'accumulation' | 'retirement'; totalValue: number }>
): MultiSimulationResult => {
  const simulations: Array<[number, SimulationResult]> = phaseConfigs.map((config, index) => {
    const data: SimulationDataPoint[] = [
      createMilestoneDataPoint(30, 'accumulation', 500000), // Year 0
      createMilestoneDataPoint(31, config.phase, config.totalValue), // Year 1
    ];

    return [
      index,
      {
        data,
        context: {
          startAge: 30,
          endAge: 31,
          yearsToSimulate: 1,
          startDate: '2024-01-01',
          endDate: '2025-01-01',
          retirementStrategy: { type: 'fixedAge' as const, retirementAge: 65 },
          rmdAge: 73,
        },
      },
    ];
  });

  return { simulations };
};

describe('SimulationDataExtractor.getPercentInPhaseForYear', () => {
  it('calculates correct phase distribution across simulations', () => {
    // 3 in accumulation, 2 in retirement
    const multiSim = createMultiSimForPhaseTest([
      { phase: 'accumulation', totalValue: 500000 },
      { phase: 'accumulation', totalValue: 600000 },
      { phase: 'retirement', totalValue: 700000 },
      { phase: 'accumulation', totalValue: 550000 },
      { phase: 'retirement', totalValue: 800000 },
    ]);

    const data = SimulationDataExtractor.getPercentInPhaseForYear(multiSim, 1);

    expect(data.numberAccumulation).toBe(3);
    expect(data.percentAccumulation).toBeCloseTo(0.6, 3);
    expect(data.numberRetirement).toBe(2);
    expect(data.percentRetirement).toBeCloseTo(0.4, 3);
    expect(data.numberBankrupt).toBe(0);
    expect(data.percentBankrupt).toBe(0);
  });

  it('bankruptcy overrides retirement phase', () => {
    // 1 accumulation, 2 retirement (one with bankrupt portfolio), 1 explicit bankrupt
    const multiSim = createMultiSimForPhaseTest([
      { phase: 'accumulation', totalValue: 500000 },
      { phase: 'retirement', totalValue: 0.05 }, // Bankrupt in retirement
      { phase: 'retirement', totalValue: 700000 },
      { phase: 'accumulation', totalValue: 0 }, // Bankrupt in accumulation
    ]);

    const data = SimulationDataExtractor.getPercentInPhaseForYear(multiSim, 1);

    expect(data.numberAccumulation).toBe(1);
    expect(data.percentAccumulation).toBeCloseTo(0.25, 3);
    expect(data.numberRetirement).toBe(1);
    expect(data.percentRetirement).toBeCloseTo(0.25, 3);
    expect(data.numberBankrupt).toBe(2);
    expect(data.percentBankrupt).toBeCloseTo(0.5, 3);
  });

  it('handles all simulations bankrupt', () => {
    const multiSim = createMultiSimForPhaseTest([
      { phase: 'retirement', totalValue: 0 },
      { phase: 'retirement', totalValue: 0.05 },
      { phase: 'accumulation', totalValue: 0.1 }, // Exactly 0.1 is bankrupt
    ]);

    const data = SimulationDataExtractor.getPercentInPhaseForYear(multiSim, 1);

    expect(data.numberBankrupt).toBe(3);
    expect(data.percentBankrupt).toBe(1);
    expect(data.numberAccumulation).toBe(0);
    expect(data.numberRetirement).toBe(0);
  });

  it('returns correct counts for year 0', () => {
    const multiSim = createMultiSimForPhaseTest([
      { phase: 'retirement', totalValue: 1000000 },
      { phase: 'retirement', totalValue: 1500000 },
    ]);

    // Year 0 - all should be in accumulation (initial data point)
    const data = SimulationDataExtractor.getPercentInPhaseForYear(multiSim, 0);

    expect(data.numberAccumulation).toBe(2);
    expect(data.percentAccumulation).toBe(1);
    expect(data.numberRetirement).toBe(0);
    expect(data.numberBankrupt).toBe(0);
  });
});
