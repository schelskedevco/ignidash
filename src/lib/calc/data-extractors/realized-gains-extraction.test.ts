import { describe, it, expect } from 'vitest';

import { TableDataExtractor } from './table-data-extractor';
import { ChartDataExtractor } from './chart-data-extractor';
import type { SimulationResult, SimulationDataPoint } from '../simulation-engine';
import type { PortfolioData } from '../portfolio';
import type { TaxesData } from '../taxes';
import type { ReturnsData } from '../returns';

// ============================================================================
// Helper Functions
// ============================================================================

const createReturnsData = (): ReturnsData => ({
  annualReturnRates: { stocks: 0, bonds: 0, cash: 0 },
  annualYieldRates: { stocks: 0, bonds: 0, cash: 0 },
  annualInflationRate: 0,
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

/**
 * Creates a full TaxesData object with all sub-interfaces zeroed out,
 * setting only incomeSources.realizedGains to the provided value.
 */
function createZeroTaxesData(realizedGains: number): TaxesData {
  return {
    federalIncomeTaxes: {
      taxableIncomeTaxedAsOrdinary: 0,
      federalIncomeTaxBrackets: [],
      federalIncomeTaxAmount: 0,
      effectiveFederalIncomeTaxRate: 0,
      topMarginalFederalIncomeTaxRate: 0,
    },
    capitalGainsTaxes: {
      taxableIncomeTaxedAsCapitalGains: 0,
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
    totalTaxesDue: 0,
    totalTaxesRefund: 0,
    totalTaxableIncome: 0,
    adjustments: {},
    deductions: {},
    incomeSources: {
      realizedGains,
      capitalLossDeduction: 0,
      section121Exclusion: 0,
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
      adjustedIncomeTaxedAsCapitalGains: 0,
      totalIncome: 0,
      earlyWithdrawals: { rothEarnings: 0, '401kAndIra': 0, hsa: 0 },
    },
  };
}

/**
 * Creates a SimulationDataPoint with configurable realized gains at both
 * portfolio level and tax level.
 */
function createRealizedGainsDataPoint(options: {
  age: number;
  portfolioRealizedGains: number;
  portfolioCumulativeRealizedGains: number;
  taxRealizedGains: number | null; // null for year-0 data points
}): SimulationDataPoint {
  const portfolio: PortfolioData = {
    totalValue: 500000,
    assetAllocation: { stocks: 0.6, bonds: 0.3, cash: 0.1 },
    contributions: { stocks: 0, bonds: 0, cash: 0 },
    withdrawals: { stocks: 0, bonds: 0, cash: 0 },
    cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
    cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
    employerMatch: 0,
    cumulativeEmployerMatch: 0,
    realizedGains: options.portfolioRealizedGains,
    cumulativeRealizedGains: options.portfolioCumulativeRealizedGains,
    rmds: 0,
    cumulativeRmds: 0,
    earningsWithdrawn: 0,
    cumulativeEarningsWithdrawn: 0,
    shortfall: 0,
    shortfallRepaid: 0,
    outstandingShortfall: 0,
    perAccountData: {},
  };

  return {
    date: '2024-01-01',
    age: options.age,
    portfolio,
    incomes: {
      totalIncome: 0,
      totalAmountWithheld: 0,
      totalFicaTax: 0,
      totalIncomeAfterPayrollDeductions: 0,
      totalSocialSecurityIncome: 0,
      totalTaxFreeIncome: 0,
      perIncomeData: {},
    },
    expenses: { totalExpenses: 0, perExpenseData: {} },
    debts: null,
    physicalAssets: null,
    taxes: options.taxRealizedGains !== null ? createZeroTaxesData(options.taxRealizedGains) : null,
    returns: createReturnsData(),
    phase: { name: 'accumulation' },
  };
}

/**
 * Wraps data points into a SimulationResult.
 */
function createTestSimulation(dataPoints: SimulationDataPoint[]): SimulationResult {
  const startAge = dataPoints[0]?.age ?? 30;
  const endAge = dataPoints[dataPoints.length - 1]?.age ?? 31;

  return {
    data: dataPoints,
    context: {
      startAge,
      endAge,
      yearsToSimulate: Math.ceil(endAge - startAge),
      startDate: '2024-01-01',
      endDate: '2054-01-01',
      retirementStrategy: { type: 'fixedAge', retirementAge: 65 },
      rmdAge: 73,
    },
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('Realized Gains Extraction', () => {
  describe('withdrawals extractors include rebalance + withdrawal gains only', () => {
    it('extracts portfolio gains from withdrawals only', () => {
      const sim = createTestSimulation([
        createRealizedGainsDataPoint({ age: 30, portfolioRealizedGains: 0, portfolioCumulativeRealizedGains: 0, taxRealizedGains: null }),
        createRealizedGainsDataPoint({
          age: 31,
          portfolioRealizedGains: 5000,
          portfolioCumulativeRealizedGains: 5000,
          taxRealizedGains: 5000,
        }),
      ]);

      const tableData = TableDataExtractor.extractSingleSimulationWithdrawalsData(sim);
      expect(tableData[1].annualRealizedGains).toBe(5000);
      expect(tableData[1].cumulativeRealizedGains).toBe(5000);

      const chartData = ChartDataExtractor.extractSingleSimulationWithdrawalsData(sim);
      expect(chartData[0].annualRealizedGains).toBe(5000);
      expect(chartData[0].cumulativeRealizedGains).toBe(5000);
    });

    it('extracts portfolio gains from rebalances only', () => {
      const sim = createTestSimulation([
        createRealizedGainsDataPoint({ age: 30, portfolioRealizedGains: 0, portfolioCumulativeRealizedGains: 0, taxRealizedGains: null }),
        createRealizedGainsDataPoint({
          age: 31,
          portfolioRealizedGains: 3000,
          portfolioCumulativeRealizedGains: 3000,
          taxRealizedGains: 3000,
        }),
      ]);

      const tableData = TableDataExtractor.extractSingleSimulationWithdrawalsData(sim);
      expect(tableData[1].annualRealizedGains).toBe(3000);
      expect(tableData[1].cumulativeRealizedGains).toBe(3000);

      const chartData = ChartDataExtractor.extractSingleSimulationWithdrawalsData(sim);
      expect(chartData[0].annualRealizedGains).toBe(3000);
      expect(chartData[0].cumulativeRealizedGains).toBe(3000);
    });

    it('returns zero when gains come only from physical asset sales', () => {
      // Portfolio has zero realized gains, but taxes include 25000 from physical asset sales
      const sim = createTestSimulation([
        createRealizedGainsDataPoint({ age: 30, portfolioRealizedGains: 0, portfolioCumulativeRealizedGains: 0, taxRealizedGains: null }),
        createRealizedGainsDataPoint({ age: 31, portfolioRealizedGains: 0, portfolioCumulativeRealizedGains: 0, taxRealizedGains: 25000 }),
      ]);

      const tableData = TableDataExtractor.extractSingleSimulationWithdrawalsData(sim);
      expect(tableData[1].annualRealizedGains).toBe(0);
      expect(tableData[1].cumulativeRealizedGains).toBe(0);

      const chartData = ChartDataExtractor.extractSingleSimulationWithdrawalsData(sim);
      expect(chartData[0].annualRealizedGains).toBe(0);
      expect(chartData[0].cumulativeRealizedGains).toBe(0);
    });

    it('extracts combined withdrawal + rebalance gains', () => {
      const sim = createTestSimulation([
        createRealizedGainsDataPoint({ age: 30, portfolioRealizedGains: 0, portfolioCumulativeRealizedGains: 0, taxRealizedGains: null }),
        createRealizedGainsDataPoint({
          age: 31,
          portfolioRealizedGains: 8000,
          portfolioCumulativeRealizedGains: 8000,
          taxRealizedGains: 8000,
        }),
      ]);

      const tableData = TableDataExtractor.extractSingleSimulationWithdrawalsData(sim);
      expect(tableData[1].annualRealizedGains).toBe(8000);
      expect(tableData[1].cumulativeRealizedGains).toBe(8000);

      const chartData = ChartDataExtractor.extractSingleSimulationWithdrawalsData(sim);
      expect(chartData[0].annualRealizedGains).toBe(8000);
      expect(chartData[0].cumulativeRealizedGains).toBe(8000);
    });

    it('returns only portfolio gains when physical asset gains also exist', () => {
      // Portfolio: 5000 from withdrawals. Taxes: 30000 (5000 portfolio + 25000 physical asset)
      const sim = createTestSimulation([
        createRealizedGainsDataPoint({ age: 30, portfolioRealizedGains: 0, portfolioCumulativeRealizedGains: 0, taxRealizedGains: null }),
        createRealizedGainsDataPoint({
          age: 31,
          portfolioRealizedGains: 5000,
          portfolioCumulativeRealizedGains: 5000,
          taxRealizedGains: 30000,
        }),
      ]);

      const tableData = TableDataExtractor.extractSingleSimulationWithdrawalsData(sim);
      expect(tableData[1].annualRealizedGains).toBe(5000);
      expect(tableData[1].cumulativeRealizedGains).toBe(5000);

      const chartData = ChartDataExtractor.extractSingleSimulationWithdrawalsData(sim);
      expect(chartData[0].annualRealizedGains).toBe(5000);
      expect(chartData[0].cumulativeRealizedGains).toBe(5000);
    });

    it('tracks cumulative gains across multiple years with all three gain types', () => {
      const sim = createTestSimulation([
        createRealizedGainsDataPoint({ age: 30, portfolioRealizedGains: 0, portfolioCumulativeRealizedGains: 0, taxRealizedGains: null }),
        createRealizedGainsDataPoint({
          age: 31,
          portfolioRealizedGains: 3000,
          portfolioCumulativeRealizedGains: 3000,
          taxRealizedGains: 3000,
        }),
        createRealizedGainsDataPoint({
          age: 32,
          portfolioRealizedGains: 7000,
          portfolioCumulativeRealizedGains: 10000,
          taxRealizedGains: 32000,
        }),
      ]);

      const tableData = TableDataExtractor.extractSingleSimulationWithdrawalsData(sim);
      expect(tableData[1].annualRealizedGains).toBe(3000);
      expect(tableData[1].cumulativeRealizedGains).toBe(3000);
      expect(tableData[2].annualRealizedGains).toBe(7000);
      expect(tableData[2].cumulativeRealizedGains).toBe(10000);

      const chartData = ChartDataExtractor.extractSingleSimulationWithdrawalsData(sim);
      expect(chartData[0].annualRealizedGains).toBe(3000);
      expect(chartData[0].cumulativeRealizedGains).toBe(3000);
      expect(chartData[1].annualRealizedGains).toBe(7000);
      expect(chartData[1].cumulativeRealizedGains).toBe(10000);
    });
  });

  describe('taxes extractors include rebalance + withdrawal + physical asset sale gains', () => {
    it('extracts tax-level gains from withdrawals only', () => {
      const sim = createTestSimulation([
        createRealizedGainsDataPoint({ age: 30, portfolioRealizedGains: 0, portfolioCumulativeRealizedGains: 0, taxRealizedGains: null }),
        createRealizedGainsDataPoint({
          age: 31,
          portfolioRealizedGains: 5000,
          portfolioCumulativeRealizedGains: 5000,
          taxRealizedGains: 5000,
        }),
      ]);

      const tableData = TableDataExtractor.extractSingleSimulationTaxesData(sim);
      expect(tableData[1].realizedGains).toBe(5000);

      const chartData = ChartDataExtractor.extractSingleSimulationTaxesData(sim);
      expect(chartData[0].realizedGains).toBe(5000);
    });

    it('extracts tax-level gains from rebalances only', () => {
      const sim = createTestSimulation([
        createRealizedGainsDataPoint({ age: 30, portfolioRealizedGains: 0, portfolioCumulativeRealizedGains: 0, taxRealizedGains: null }),
        createRealizedGainsDataPoint({
          age: 31,
          portfolioRealizedGains: 3000,
          portfolioCumulativeRealizedGains: 3000,
          taxRealizedGains: 3000,
        }),
      ]);

      const tableData = TableDataExtractor.extractSingleSimulationTaxesData(sim);
      expect(tableData[1].realizedGains).toBe(3000);

      const chartData = ChartDataExtractor.extractSingleSimulationTaxesData(sim);
      expect(chartData[0].realizedGains).toBe(3000);
    });

    it('extracts physical asset sale gains even when portfolio gains are zero', () => {
      const sim = createTestSimulation([
        createRealizedGainsDataPoint({ age: 30, portfolioRealizedGains: 0, portfolioCumulativeRealizedGains: 0, taxRealizedGains: null }),
        createRealizedGainsDataPoint({ age: 31, portfolioRealizedGains: 0, portfolioCumulativeRealizedGains: 0, taxRealizedGains: 25000 }),
      ]);

      const tableData = TableDataExtractor.extractSingleSimulationTaxesData(sim);
      expect(tableData[1].realizedGains).toBe(25000);

      const chartData = ChartDataExtractor.extractSingleSimulationTaxesData(sim);
      expect(chartData[0].realizedGains).toBe(25000);
    });

    it('extracts combined withdrawal + rebalance gains at tax level', () => {
      const sim = createTestSimulation([
        createRealizedGainsDataPoint({ age: 30, portfolioRealizedGains: 0, portfolioCumulativeRealizedGains: 0, taxRealizedGains: null }),
        createRealizedGainsDataPoint({
          age: 31,
          portfolioRealizedGains: 8000,
          portfolioCumulativeRealizedGains: 8000,
          taxRealizedGains: 8000,
        }),
      ]);

      const tableData = TableDataExtractor.extractSingleSimulationTaxesData(sim);
      expect(tableData[1].realizedGains).toBe(8000);

      const chartData = ChartDataExtractor.extractSingleSimulationTaxesData(sim);
      expect(chartData[0].realizedGains).toBe(8000);
    });

    it('extracts combined portfolio + physical asset gains', () => {
      const sim = createTestSimulation([
        createRealizedGainsDataPoint({ age: 30, portfolioRealizedGains: 0, portfolioCumulativeRealizedGains: 0, taxRealizedGains: null }),
        createRealizedGainsDataPoint({
          age: 31,
          portfolioRealizedGains: 5000,
          portfolioCumulativeRealizedGains: 5000,
          taxRealizedGains: 30000,
        }),
      ]);

      const tableData = TableDataExtractor.extractSingleSimulationTaxesData(sim);
      expect(tableData[1].realizedGains).toBe(30000);

      const chartData = ChartDataExtractor.extractSingleSimulationTaxesData(sim);
      expect(chartData[0].realizedGains).toBe(30000);
    });

    it('extracts correct tax-level gains across multiple years with all three gain types', () => {
      const sim = createTestSimulation([
        createRealizedGainsDataPoint({ age: 30, portfolioRealizedGains: 0, portfolioCumulativeRealizedGains: 0, taxRealizedGains: null }),
        createRealizedGainsDataPoint({
          age: 31,
          portfolioRealizedGains: 3000,
          portfolioCumulativeRealizedGains: 3000,
          taxRealizedGains: 3000,
        }),
        createRealizedGainsDataPoint({
          age: 32,
          portfolioRealizedGains: 7000,
          portfolioCumulativeRealizedGains: 10000,
          taxRealizedGains: 32000,
        }),
      ]);

      const tableData = TableDataExtractor.extractSingleSimulationTaxesData(sim);
      expect(tableData[1].realizedGains).toBe(3000);
      expect(tableData[2].realizedGains).toBe(32000);

      const chartData = ChartDataExtractor.extractSingleSimulationTaxesData(sim);
      expect(chartData[0].realizedGains).toBe(3000);
      expect(chartData[1].realizedGains).toBe(32000);
    });
  });

  describe('table and chart extractors are consistent', () => {
    it('table and chart withdrawals extractors return same realized gains', () => {
      const sim = createTestSimulation([
        createRealizedGainsDataPoint({ age: 30, portfolioRealizedGains: 0, portfolioCumulativeRealizedGains: 0, taxRealizedGains: null }),
        createRealizedGainsDataPoint({
          age: 31,
          portfolioRealizedGains: 5000,
          portfolioCumulativeRealizedGains: 5000,
          taxRealizedGains: 30000,
        }),
        createRealizedGainsDataPoint({
          age: 32,
          portfolioRealizedGains: 7000,
          portfolioCumulativeRealizedGains: 12000,
          taxRealizedGains: 32000,
        }),
      ]);

      const tableData = TableDataExtractor.extractSingleSimulationWithdrawalsData(sim);
      const chartData = ChartDataExtractor.extractSingleSimulationWithdrawalsData(sim);

      // Table row i (for i>0) corresponds to chart row i-1 (chart skips year 0)
      for (let i = 0; i < chartData.length; i++) {
        expect(tableData[i + 1].annualRealizedGains).toBe(chartData[i].annualRealizedGains);
        expect(tableData[i + 1].cumulativeRealizedGains).toBe(chartData[i].cumulativeRealizedGains);
      }
    });

    it('table and chart taxes extractors return same realized gains', () => {
      const sim = createTestSimulation([
        createRealizedGainsDataPoint({ age: 30, portfolioRealizedGains: 0, portfolioCumulativeRealizedGains: 0, taxRealizedGains: null }),
        createRealizedGainsDataPoint({
          age: 31,
          portfolioRealizedGains: 5000,
          portfolioCumulativeRealizedGains: 5000,
          taxRealizedGains: 30000,
        }),
        createRealizedGainsDataPoint({
          age: 32,
          portfolioRealizedGains: 7000,
          portfolioCumulativeRealizedGains: 12000,
          taxRealizedGains: 32000,
        }),
      ]);

      const tableData = TableDataExtractor.extractSingleSimulationTaxesData(sim);
      const chartData = ChartDataExtractor.extractSingleSimulationTaxesData(sim);

      // Table row i (for i>0) corresponds to chart row i-1 (chart skips year 0)
      for (let i = 0; i < chartData.length; i++) {
        expect(tableData[i + 1].realizedGains).toBe(chartData[i].realizedGains);
      }
    });

    it('table extractors return null for year 0', () => {
      const sim = createTestSimulation([
        createRealizedGainsDataPoint({ age: 30, portfolioRealizedGains: 0, portfolioCumulativeRealizedGains: 0, taxRealizedGains: null }),
        createRealizedGainsDataPoint({
          age: 31,
          portfolioRealizedGains: 5000,
          portfolioCumulativeRealizedGains: 5000,
          taxRealizedGains: 5000,
        }),
      ]);

      const withdrawalsTable = TableDataExtractor.extractSingleSimulationWithdrawalsData(sim);
      expect(withdrawalsTable[0].annualRealizedGains).toBeNull();
      expect(withdrawalsTable[0].cumulativeRealizedGains).toBeNull();

      const taxesTable = TableDataExtractor.extractSingleSimulationTaxesData(sim);
      expect(taxesTable[0].realizedGains).toBeNull();
    });
  });
});
