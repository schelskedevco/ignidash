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
        totalPrincipalPaid: 600, // payment - interest = 500 - (-100) = 600
        totalUnpaidInterest: 0,
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
        totalPrincipalPaid: 100, // 0 - (-100) = 100
        totalUnpaidInterest: 0,
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
            totalUnsecuredDebtIncurred: 0,
            perDebtData: {},
          }
        : null,
    physicalAssets: null,
    taxes: null,
    returns: null,
    phase: { name: 'accumulation' },
  });

  it('calculates principalPaid as payments minus interest (works with negative interest)', () => {
    // When inflation > APR:
    // - Raw interest is negative (e.g., -100)
    // - principalPaid = payment - interest = 0 - (-100) = 100
    // - This correctly reflects debt eroding due to inflation
    const dp = createAssetLiabilityDataPoint({
      portfolioValue: 1000000,
      debtBalance: 10000,
      debtPayment: 0,
      interest: -100, // Negative raw interest (inflation > APR)
      principalPaid: 100, // payment (0) - interest (-100) = 100
      unpaidInterest: 0,
    });

    const data = SimulationDataExtractor.getAssetsAndLiabilitiesData(dp);

    // principalPaid = payments - interest = 0 - (-100) = 100
    expect(data.principalPaid).toBe(100);
  });

  it('correctly calculates principalPaid with positive interest (normal scenario)', () => {
    const dp = createAssetLiabilityDataPoint({
      portfolioValue: 1000000,
      debtBalance: 10000,
      debtPayment: 500,
      interest: 50, // Positive interest (normal scenario)
      principalPaid: 450, // payment (500) - interest (50) = 450
      unpaidInterest: 0,
    });

    const data = SimulationDataExtractor.getAssetsAndLiabilitiesData(dp);

    // principalPaid = payments - interest = 500 - 50 = 450
    expect(data.principalPaid).toBe(450);
  });

  it('correctly calculates principalPaid with underpayment (payment < interest) - regression test', () => {
    // REGRESSION TEST: This scenario catches the bug where principalPaid was calculated
    // incorrectly. When payment < interest, principalPaid should be negative.
    //
    // The debt balance only increases by 100 (the unpaid interest), not 200.
    const dp = createAssetLiabilityDataPoint({
      portfolioValue: 1000000,
      debtBalance: 10000,
      debtPayment: 100,
      interest: 200, // Large interest
      principalPaid: -100, // payment (100) - interest (200) = -100
      unpaidInterest: 100, // max(0, 200 - 100) = 100
    });

    const data = SimulationDataExtractor.getAssetsAndLiabilitiesData(dp);

    // principalPaid = payments - interest = 100 - 200 = -100
    // This correctly represents the debt balance increasing by 100
    expect(data.principalPaid).toBe(-100);
  });

  it('correctly calculates principalPaid with negative interest AND payment - regression test', () => {
    // This tests the combined scenario: inflation > APR with an active payment
    // The debt should decrease by payment + |negative interest|
    //
    // principalPaid = payments - interest = 500 - (-100) = 600
    //
    // Having this test ensures the formula works correctly for this scenario.
    const dp = createAssetLiabilityDataPoint({
      portfolioValue: 1000000,
      debtBalance: 10000,
      debtPayment: 500,
      interest: -100, // Negative interest (inflation > APR)
      principalPaid: 600, // payment (500) - interest (-100) = 600
      unpaidInterest: 0, // max(0, -100 - 500) = 0
    });

    const data = SimulationDataExtractor.getAssetsAndLiabilitiesData(dp);

    // principalPaid = payments - interest = 500 - (-100) = 600
    // Debt decreased by 600 (500 from payment + 100 from inflation erosion)
    expect(data.principalPaid).toBe(600);
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
