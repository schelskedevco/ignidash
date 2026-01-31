import { describe, it, expect } from 'vitest';

import { ChartDataExtractor } from './chart-data-extractor';
import type { SimulationResult, SimulationDataPoint } from '../simulation-engine';
import type { PortfolioData } from '../portfolio';
import type { PhysicalAssetsData } from '../physical-assets';
import type { DebtsData } from '../debts';
import type { ReturnsData } from '../returns';

/**
 * Tests for ChartDataExtractor.extractSingleSimulationNetWorthData - netWorthChange Invariant
 *
 * The key invariant being verified:
 *   netWorthChange[i] = netWorth[i] - netWorth[i-1]
 *
 * Where:
 *   netWorth = portfolioValue + marketValue - debt
 *   netWorthChange = netPortfolioChange + appreciation + debtPaydown + assetsPurchased - assetsSold - unsecuredDebtIncurred
 *
 * This tests that the component-based calculation (netWorthChange) equals the
 * direct difference calculation (current netWorth - previous netWorth).
 */

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a SimulationDataPoint with controlled net worth components for testing.
 */
function createNetWorthTestDataPoint(options: {
  age: number;
  portfolioValue: number;
  contributions?: { stocks: number; bonds: number; cash: number };
  withdrawals?: { stocks: number; bonds: number; cash: number };
  returns?: { stocks: number; bonds: number; cash: number };
  marketValue?: number;
  loanBalance?: number;
  appreciation?: number;
  purchaseExpense?: number;
  saleProceeds?: number;
  loanPayment?: number;
  loanInterest?: number;
  debtBalance?: number;
  debtPayment?: number;
  debtInterest?: number;
  unsecuredDebtIncurred?: number;
}): SimulationDataPoint {
  const contributions = options.contributions ?? { stocks: 0, bonds: 0, cash: 0 };
  const withdrawals = options.withdrawals ?? { stocks: 0, bonds: 0, cash: 0 };
  const returns = options.returns ?? { stocks: 0, bonds: 0, cash: 0 };

  const portfolioData: PortfolioData = {
    totalValue: options.portfolioValue,
    assetAllocation: { stocks: 0.6, bonds: 0.3, cash: 0.1 },
    contributionsForPeriod: contributions,
    withdrawalsForPeriod: withdrawals,
    cumulativeContributions: contributions,
    cumulativeWithdrawals: withdrawals,
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
  };

  const returnsData: ReturnsData = {
    annualReturnRates: { stocks: 0, bonds: 0, cash: 0 },
    annualYieldRates: { stocks: 0, bonds: 0, cash: 0 },
    annualInflationRate: 0,
    returnAmountsForPeriod: returns,
    returnRatesForPeriod: { stocks: 0, bonds: 0, cash: 0 },
    cumulativeReturnAmounts: returns,
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
  };

  const physicalAssetsData: PhysicalAssetsData | null =
    options.marketValue !== undefined
      ? {
          totalMarketValue: options.marketValue,
          totalLoanBalance: options.loanBalance ?? 0,
          totalEquity: (options.marketValue ?? 0) - (options.loanBalance ?? 0),
          totalAppreciation: options.appreciation ?? 0,
          totalLoanPayment: options.loanPayment ?? 0,
          totalInterest: options.loanInterest ?? 0,
          totalPrincipalPaid: (options.loanPayment ?? 0) - (options.loanInterest ?? 0),
          totalUnpaidInterest: 0,
          totalPurchaseExpense: options.purchaseExpense ?? 0,
          totalSaleProceeds: options.saleProceeds ?? 0,
          totalCapitalGain: 0,
          perAssetData: {},
        }
      : null;

  const debtsData: DebtsData | null =
    options.debtBalance !== undefined
      ? {
          totalDebtBalance: options.debtBalance,
          totalPayment: options.debtPayment ?? 0,
          totalInterest: options.debtInterest ?? 0,
          totalPrincipalPaid: (options.debtPayment ?? 0) - (options.debtInterest ?? 0),
          totalUnpaidInterest: 0,
          totalUnsecuredDebtIncurred: options.unsecuredDebtIncurred ?? 0,
          perDebtData: {},
        }
      : null;

  return {
    date: '2024-01-01',
    age: options.age,
    portfolio: portfolioData,
    incomes: null,
    expenses: null,
    debts: debtsData,
    physicalAssets: physicalAssetsData,
    taxes: null,
    returns: returnsData,
    phase: { name: 'accumulation' },
  };
}

/**
 * Wraps data points into a SimulationResult.
 */
function createNetWorthTestSimulation(dataPoints: SimulationDataPoint[]): SimulationResult {
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

/**
 * Verifies the netWorthChange invariant for all consecutive data points.
 * Returns the extracted chart data for additional assertions.
 */
function verifyNetWorthChangeInvariant(simulation: SimulationResult) {
  const result = ChartDataExtractor.extractSingleSimulationNetWorthData(simulation);

  for (let i = 1; i < result.length; i++) {
    const expectedChange = result[i].netWorth - result[i - 1].netWorth;
    expect(result[i].netWorthChange).toBeCloseTo(expectedChange, 2);
  }

  return result;
}

// ============================================================================
// Test Cases
// ============================================================================

describe('ChartDataExtractor - netWorthChange Invariant', () => {
  it('verifies invariant with portfolio-only changes', () => {
    /**
     * Test Case 1: Portfolio-only changes
     * - Starting portfolio: $100,000
     * - Year 1: +$8,000 returns, +$5,000 contributions, -$3,000 withdrawals
     * - Expected netWorthChange = 8000 + 5000 - 3000 = $10,000
     * - Ending portfolio: $110,000
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 100000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 110000,
        contributions: { stocks: 3000, bonds: 1500, cash: 500 }, // 5000 total
        withdrawals: { stocks: 1800, bonds: 900, cash: 300 }, // 3000 total
        returns: { stocks: 4800, bonds: 2400, cash: 800 }, // 8000 total
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    // Verify specific values
    expect(result[0].netWorth).toBe(100000);
    expect(result[1].netWorth).toBe(110000);
    expect(result[1].netWorthChange).toBeCloseTo(10000, 2);
    expect(result[1].netPortfolioChange).toBeCloseTo(10000, 2);
  });

  it('verifies invariant when incurring unsecured debt', () => {
    /**
     * Test Case 2: Incurring unsecured debt
     * - Starting portfolio: $100,000, no debt
     * - Year 1: Incur $20,000 credit card debt
     * - Expected netWorthChange = -$20,000 (debt reduces net worth)
     * - Net worth goes from $100,000 to $80,000
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 100000,
        debtBalance: 0,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 100000,
        debtBalance: 20000,
        unsecuredDebtIncurred: 20000,
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(100000);
    expect(result[1].netWorth).toBe(80000);
    expect(result[1].netWorthChange).toBeCloseTo(-20000, 2);
    expect(result[1].annualUnsecuredDebtIncurred).toBe(20000);
  });

  it('verifies invariant when purchasing a financed asset (net change = 0)', () => {
    /**
     * Test Case 3: Purchase financed asset
     * - Starting: $200,000 portfolio, no assets
     * - Purchase $400,000 house with $80,000 down payment, $320,000 loan
     * - Portfolio decreases by $80,000 (down payment)
     * - Asset worth $400,000 added, loan of $320,000 added
     * - Net change = -80,000 (portfolio) + 80,000 (asset purchase) + 400,000 (asset) - 320,000 (loan) = 0
     * - But assetsPurchased captures down payment, and marketValue/loanBalance capture rest
     *
     * netWorthChange = netPortfolioChange + appreciation + debtPaydown + assetsPurchased - assetsSold - unsecuredDebtIncurred
     * = (-80000) + 0 + 0 + 80000 - 0 - 0 = 0
     *
     * netWorth[0] = 200000 + 0 - 0 = 200000
     * netWorth[1] = 120000 + 400000 - 320000 = 200000
     * netWorthChange = 200000 - 200000 = 0
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 200000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 120000, // 200000 - 80000 down payment
        withdrawals: { stocks: 48000, bonds: 24000, cash: 8000 }, // 80000 total
        marketValue: 400000,
        loanBalance: 320000,
        purchaseExpense: 80000, // down payment
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(200000);
    expect(result[1].netWorth).toBe(200000); // 120000 + 400000 - 320000
    expect(result[1].netWorthChange).toBeCloseTo(0, 2);
  });

  it('verifies invariant with asset appreciation and loan paydown', () => {
    /**
     * Test Case 4: Appreciation and loan paydown
     * - Starting: $100,000 portfolio, $400,000 house, $300,000 loan
     * - Year 1: $12,000 appreciation, $24,000 payment with $4,000 interest
     * - Loan paydown = 24000 - 4000 = $20,000
     * - Expected netWorthChange = appreciation + debtPaydown = 12000 + 20000 = $32,000
     *
     * netWorth[0] = 100000 + 400000 - 300000 = 200000
     * netWorth[1] = 100000 + 412000 - 280000 = 232000
     * netWorthChange = 232000 - 200000 = 32000
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 100000,
        marketValue: 400000,
        loanBalance: 300000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 100000,
        marketValue: 412000, // 400000 + 12000 appreciation
        loanBalance: 280000, // 300000 - 20000 principal paid
        appreciation: 12000,
        loanPayment: 24000,
        loanInterest: 4000,
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(200000);
    expect(result[1].netWorth).toBe(232000);
    expect(result[1].netWorthChange).toBeCloseTo(32000, 2);
    expect(result[1].annualAssetAppreciation).toBe(12000);
    expect(result[1].annualDebtPaydown).toBe(20000);
  });

  it('verifies invariant when selling a cash-purchased asset (no loan)', () => {
    /**
     * Test Case 5: Sell asset that was purchased with cash (no loan)
     *
     * This is a simpler case where there's no loan to complicate things.
     * The formula handles this correctly because:
     * - assetsSold = saleProceeds = marketValue (since no loan)
     * - The asset value disappearing (-marketValue) is captured by -assetsSold
     * - The portfolio increasing (+marketValue) is captured separately
     *
     * netWorth[0] = 100000 + 200000 - 0 = 300000
     * netWorth[1] = 300000 + 0 - 0 = 300000
     * netWorthChange = 0
     *
     * Formula components:
     * - netPortfolioChange = 0 (sale proceeds don't go through contrib/returns)
     * - appreciation = 0
     * - debtPaydown = 0
     * - assetsPurchased = 0
     * - assetsSold = 200000 (full proceeds, no loan to pay off)
     *
     * But wait - if saleProceeds = marketValue and goes into portfolio,
     * then portfolio increases. If that's tracked as contributions:
     * - netPortfolioChange = 200000
     * - assetsSold = 200000
     * Formula = 200000 + 0 + 0 + 0 - 200000 - 0 = 0 ✓
     *
     * If proceeds are NOT in netPortfolioChange:
     * Formula = 0 + 0 + 0 + 0 - 200000 - 0 = -200000 ≠ 0
     *
     * The test needs to match actual simulation behavior.
     * Since sale proceeds typically go into portfolio as cash that can be invested,
     * let's track it through contributions.
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 100000,
        marketValue: 200000,
        loanBalance: 0,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 300000,
        contributions: { stocks: 120000, bonds: 60000, cash: 20000 }, // 200000 from sale
        marketValue: 0,
        loanBalance: 0,
        saleProceeds: 200000,
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(300000);
    expect(result[1].netWorth).toBe(300000);
    expect(result[1].netWorthChange).toBeCloseTo(0, 2);
  });

  it('verifies invariant when selling asset with appreciation (no loan)', () => {
    /**
     * Test Case 6: Sell appreciated asset (no loan)
     *
     * Asset was bought for $150k, now worth $200k (appreciation of $50k over time).
     * When sold, the full $200k goes to portfolio.
     *
     * netWorth[0] = 100000 + 200000 - 0 = 300000
     * netWorth[1] = 300000 + 0 - 0 = 300000
     * netWorthChange = 0 (just converting asset form to cash)
     *
     * Formula:
     * - netPortfolioChange = 200000 (sale proceeds as contributions)
     * - appreciation = 0 (no appreciation in sale period)
     * - debtPaydown = 0
     * - assetsSold = 200000
     *
     * Formula = 200000 + 0 + 0 + 0 - 200000 - 0 = 0 ✓
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 100000,
        marketValue: 200000, // Appreciated from 150k purchase price
        loanBalance: 0,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 300000,
        contributions: { stocks: 120000, bonds: 60000, cash: 20000 }, // 200000 from sale
        marketValue: 0,
        loanBalance: 0,
        saleProceeds: 200000,
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(300000);
    expect(result[1].netWorth).toBe(300000);
    expect(result[1].netWorthChange).toBeCloseTo(0, 2);
  });

  it('verifies invariant with multiple components changing simultaneously', () => {
    /**
     * Test Case 7: Combined scenario
     * - Starting: $200,000 portfolio, $300,000 house, $200,000 loan, $10,000 credit card
     * - Year 1 changes:
     *   - Portfolio: +$10,000 returns, +$20,000 contributions, -$5,000 withdrawals = +25,000
     *   - House: +$9,000 appreciation
     *   - Mortgage: $24,000 payment with $12,000 interest = $12,000 paydown
     *   - Credit card: $5,000 payment with $1,000 interest = $4,000 paydown
     *   - New debt incurred: $8,000
     *
     * netWorth[0] = 200000 + 300000 - 200000 - 10000 = 290000
     *
     * After changes:
     * - Portfolio: 200000 + 25000 = 225000
     * - House: 300000 + 9000 = 309000
     * - Mortgage: 200000 - 12000 = 188000
     * - Credit card: 10000 - 4000 + 8000 = 14000
     *
     * netWorth[1] = 225000 + 309000 - 188000 - 14000 = 332000
     * netWorthChange = 332000 - 290000 = 42000
     *
     * Component calculation:
     * - netPortfolioChange = 10000 + 20000 - 5000 = 25000
     * - appreciation = 9000
     * - debtPaydown (loan) = 24000 - 12000 = 12000
     * - debtPaydown (cc) = 5000 - 1000 = 4000
     * - total debtPaydown = 16000
     * - unsecuredDebtIncurred = 8000
     *
     * netWorthChange = 25000 + 9000 + 16000 + 0 - 0 - 8000 = 42000 ✓
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 200000,
        marketValue: 300000,
        loanBalance: 200000,
        debtBalance: 10000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 225000,
        contributions: { stocks: 12000, bonds: 6000, cash: 2000 }, // 20000 total
        withdrawals: { stocks: 3000, bonds: 1500, cash: 500 }, // 5000 total
        returns: { stocks: 6000, bonds: 3000, cash: 1000 }, // 10000 total
        marketValue: 309000,
        loanBalance: 188000,
        appreciation: 9000,
        loanPayment: 24000,
        loanInterest: 12000,
        debtBalance: 14000,
        debtPayment: 5000,
        debtInterest: 1000,
        unsecuredDebtIncurred: 8000,
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(290000);
    expect(result[1].netWorth).toBe(332000);
    expect(result[1].netWorthChange).toBeCloseTo(42000, 2);
  });

  it('verifies invariant with negative interest (high inflation scenario)', () => {
    /**
     * Test Case 8: Negative interest (inflation > APR)
     * - When inflation exceeds the nominal interest rate, real interest is negative
     * - This means debt erodes in real terms
     * - Starting: $100,000 portfolio, $50,000 debt
     * - Year 1: $0 payment, -$1,000 interest (debt erodes by $1,000)
     * - debtPaydown = payment - interest = 0 - (-1000) = +$1,000
     *
     * netWorth[0] = 100000 - 50000 = 50000
     * netWorth[1] = 100000 - 49000 = 51000
     * netWorthChange = 51000 - 50000 = 1000
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 100000,
        debtBalance: 50000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 100000,
        debtBalance: 49000, // Debt reduced by $1,000 due to inflation erosion
        debtPayment: 0,
        debtInterest: -1000, // Negative interest (inflation > APR)
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(50000);
    expect(result[1].netWorth).toBe(51000);
    expect(result[1].netWorthChange).toBeCloseTo(1000, 2);
    expect(result[1].annualDebtPaydown).toBe(1000);
  });

  it('verifies invariant across multiple years', () => {
    /**
     * Test multi-year simulation to ensure invariant holds throughout.
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 100000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 107000,
        returns: { stocks: 4200, bonds: 2100, cash: 700 }, // 7000 total
      }),
      createNetWorthTestDataPoint({
        age: 32,
        portfolioValue: 114490,
        returns: { stocks: 4494, bonds: 2247, cash: 749 }, // 7490 total
      }),
      createNetWorthTestDataPoint({
        age: 33,
        portfolioValue: 122704,
        returns: { stocks: 4929, bonds: 2464, cash: 821 }, // 8214 total
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    // Verify each year's change
    expect(result[1].netWorthChange).toBeCloseTo(7000, 2);
    expect(result[2].netWorthChange).toBeCloseTo(7490, 2);
    expect(result[3].netWorthChange).toBeCloseTo(8214, 2);
  });

  it('verifies invariant with zero net worth change', () => {
    /**
     * Test where nothing changes - net worth should remain constant.
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 100000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 100000,
        // All zeros (defaults)
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(100000);
    expect(result[1].netWorth).toBe(100000);
    expect(result[1].netWorthChange).toBeCloseTo(0, 2);
  });

  it('verifies invariant with negative portfolio returns', () => {
    /**
     * Test with market downturn - negative returns.
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 100000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 85000,
        returns: { stocks: -9000, bonds: -4500, cash: -1500 }, // -15000 total
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(100000);
    expect(result[1].netWorth).toBe(85000);
    expect(result[1].netWorthChange).toBeCloseTo(-15000, 2);
  });

  it('verifies invariant for financed asset purchase', () => {
    /**
     * Financed asset purchase scenario:
     * - Portfolio has $200k
     * - Buy $400k house with $80k down payment, $320k loan
     * - Portfolio decreases by $80k (down payment from withdrawals)
     * - Asset increases by $400k
     * - Loan increases by $320k
     *
     * netWorth[0] = 200000 + 0 - 0 = 200000
     * netWorth[1] = 120000 + 400000 - 320000 = 200000
     * netWorthChange = 0
     *
     * Formula:
     * - netPortfolioChange = -80000 (withdrawals for down payment)
     * - appreciation = 0
     * - debtPaydown = 0
     * - assetsPurchased = 80000 (down payment)
     * - assetsSold = 0
     *
     * Formula = -80000 + 0 + 0 + 80000 - 0 - 0 = 0 ✓
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 200000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 120000,
        withdrawals: { stocks: 48000, bonds: 24000, cash: 8000 }, // 80000 for down payment
        marketValue: 400000,
        loanBalance: 320000,
        purchaseExpense: 80000,
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(200000);
    expect(result[1].netWorth).toBe(200000);
    expect(result[1].netWorthChange).toBeCloseTo(0, 2);
    expect(result[1].annualAssetsPurchased).toBe(80000);
  });

  it('verifies invariant for financed asset with ongoing appreciation and payments', () => {
    /**
     * Year 2 of financed asset ownership:
     * - Asset appreciates by $12k
     * - Make $24k in mortgage payments with $12k interest
     * - Loan paydown = $24k - $12k = $12k
     *
     * netWorth[0] = 100000 + 400000 - 300000 = 200000
     * netWorth[1] = 100000 + 412000 - 288000 = 224000
     * netWorthChange = 24000
     *
     * Formula:
     * - netPortfolioChange = 0 (no returns, no contributions)
     * - appreciation = 12000
     * - debtPaydown = 12000 (24000 payment - 12000 interest)
     *
     * Formula = 0 + 12000 + 12000 + 0 - 0 - 0 = 24000 ✓
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 100000,
        marketValue: 400000,
        loanBalance: 300000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 100000,
        marketValue: 412000,
        loanBalance: 288000,
        appreciation: 12000,
        loanPayment: 24000,
        loanInterest: 12000,
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(200000);
    expect(result[1].netWorth).toBe(224000);
    expect(result[1].netWorthChange).toBeCloseTo(24000, 2);
    expect(result[1].annualAssetAppreciation).toBe(12000);
    expect(result[1].annualDebtPaydown).toBe(12000);
  });

  it('verifies invariant when paying off debt with negative interest (high inflation)', () => {
    /**
     * High inflation scenario where real interest is negative:
     * - 3% nominal APR with 5% inflation = -2% real interest
     * - Debt erodes even without payments
     *
     * - Debt: $100k balance
     * - Payment: $500/month = $6k/year
     * - Interest: -$2k (negative due to high inflation)
     * - Debt paydown = $6k - (-$2k) = $8k
     *
     * netWorth[0] = 100000 - 100000 = 0
     * netWorth[1] = 100000 - 92000 = 8000
     * netWorthChange = 8000
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 100000,
        debtBalance: 100000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 100000,
        debtBalance: 92000, // Reduced by 8k (6k payment + 2k inflation erosion)
        debtPayment: 6000,
        debtInterest: -2000, // Negative interest
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(0);
    expect(result[1].netWorth).toBe(8000);
    expect(result[1].netWorthChange).toBeCloseTo(8000, 2);
    expect(result[1].annualDebtPaydown).toBe(8000); // 6000 - (-2000) = 8000
  });

  it('verifies invariant with combined secured and unsecured debt', () => {
    /**
     * Combined scenario with both mortgage (secured) and credit card (unsecured):
     * - Mortgage: $200k balance, $20k payment, $10k interest
     * - Credit card: $10k balance, $3k payment, $1k interest, $5k new charges
     *
     * Mortgage paydown = $20k - $10k = $10k
     * Credit card paydown = $3k - $1k = $2k
     * Total debt paydown = $12k
     * New unsecured debt = $5k
     *
     * netWorth change = debtPaydown - unsecuredDebtIncurred = 12k - 5k = 7k
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 100000,
        marketValue: 300000,
        loanBalance: 200000,
        debtBalance: 10000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 100000,
        marketValue: 300000,
        loanBalance: 190000, // Reduced by 10k
        loanPayment: 20000,
        loanInterest: 10000,
        debtBalance: 13000, // 10k - 2k paydown + 5k new = 13k
        debtPayment: 3000,
        debtInterest: 1000,
        unsecuredDebtIncurred: 5000,
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    // netWorth[0] = 100k + 300k - 200k - 10k = 190k
    // netWorth[1] = 100k + 300k - 190k - 13k = 197k
    // Change = 7k
    expect(result[0].netWorth).toBe(190000);
    expect(result[1].netWorth).toBe(197000);
    expect(result[1].netWorthChange).toBeCloseTo(7000, 2);
    expect(result[1].annualDebtPaydown).toBe(12000); // Mortgage 10k + CC 2k
    expect(result[1].annualUnsecuredDebtIncurred).toBe(5000);
  });
});

// ============================================================================
// CRITICAL: Selling Financed Assets with Remaining Loan Balance
// ============================================================================

describe('ChartDataExtractor - Selling Financed Assets with Remaining Loan', () => {
  it('verifies invariant when selling financed asset with remaining loan (positive equity)', () => {
    /**
     * CRITICAL EDGE CASE: Sell financed asset before loan is fully paid off
     *
     * Before sale:
     * - portfolio: $100,000
     * - marketValue: $200,000
     * - loanBalance: $150,000
     * - netWorth = $100,000 + $200,000 - $150,000 = $150,000
     *
     * After sale:
     * - portfolio: $150,000 (received $50,000 net proceeds)
     * - marketValue: $0
     * - loanBalance: $0
     * - netWorth = $150,000 + $0 - $0 = $150,000
     *
     * Expected: netWorthChange = $150,000 - $150,000 = $0
     *
     * Formula components:
     * - netPortfolioChange = +$50,000 (sale proceeds into portfolio as contributions)
     * - appreciation = $0
     * - debtPaydown = $0 (loan payoff is handled via saleProceeds, not debtPaydown)
     * - assetsPurchased = $0
     * - assetsSold = $50,000 (NET proceeds = marketValue - loanBalance)
     * - unsecuredDebtIncurred = $0
     *
     * Formula: $50,000 + 0 + 0 + 0 - $50,000 - 0 = $0 ✓
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 100000,
        marketValue: 200000,
        loanBalance: 150000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 150000, // 100000 + 50000 net proceeds
        contributions: { stocks: 30000, bonds: 15000, cash: 5000 }, // 50000 from net sale proceeds
        marketValue: 0,
        loanBalance: 0,
        saleProceeds: 50000, // NET proceeds = 200000 - 150000
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(150000); // 100k + 200k - 150k
    expect(result[1].netWorth).toBe(150000); // 150k + 0 - 0
    expect(result[1].netWorthChange).toBeCloseTo(0, 2);
    expect(result[1].annualAssetsSold).toBe(50000); // Net proceeds
    expect(result[1].netPortfolioChange).toBeCloseTo(50000, 2);
  });

  it('verifies invariant when selling financed asset with zero equity', () => {
    /**
     * Edge case: Sell asset where marketValue = loanBalance (zero equity)
     *
     * Before sale:
     * - portfolio: $100,000
     * - marketValue: $200,000
     * - loanBalance: $200,000
     * - netWorth = $100,000 + $200,000 - $200,000 = $100,000
     *
     * After sale:
     * - portfolio: $100,000 (received $0 net proceeds)
     * - marketValue: $0
     * - loanBalance: $0
     * - netWorth = $100,000 + $0 - $0 = $100,000
     *
     * Expected: netWorthChange = $100,000 - $100,000 = $0
     *
     * Formula components:
     * - netPortfolioChange = $0 (no proceeds to add)
     * - assetsSold = $0 (net proceeds = 200k - 200k)
     *
     * Formula: $0 + 0 + 0 + 0 - $0 - 0 = $0 ✓
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 100000,
        marketValue: 200000,
        loanBalance: 200000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 100000, // No change - $0 net proceeds
        marketValue: 0,
        loanBalance: 0,
        saleProceeds: 0, // NET proceeds = 200000 - 200000
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(100000); // 100k + 200k - 200k
    expect(result[1].netWorth).toBe(100000); // 100k + 0 - 0
    expect(result[1].netWorthChange).toBeCloseTo(0, 2);
    expect(result[1].annualAssetsSold).toBe(0);
    expect(result[1].netPortfolioChange).toBeCloseTo(0, 2);
  });

  it('verifies invariant when selling underwater financed asset (negative equity)', () => {
    /**
     * Edge case: Sell asset where marketValue < loanBalance (underwater)
     *
     * Before sale:
     * - portfolio: $100,000
     * - marketValue: $150,000
     * - loanBalance: $180,000
     * - netWorth = $100,000 + $150,000 - $180,000 = $70,000
     *
     * After sale (must pay $30k to close):
     * - portfolio: $70,000 (paid $30,000 to cover shortfall)
     * - marketValue: $0
     * - loanBalance: $0
     * - netWorth = $70,000 + $0 - $0 = $70,000
     *
     * Expected: netWorthChange = $70,000 - $70,000 = $0
     *
     * saleProceeds = $150,000 - $180,000 = -$30,000 (negative!)
     *
     * Formula components:
     * - netPortfolioChange = -$30,000 (withdrawal to cover shortfall)
     * - assetsSold = -$30,000 (negative proceeds)
     *
     * Formula: -$30,000 + 0 + 0 + 0 - (-$30,000) - 0 = $0 ✓
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 100000,
        marketValue: 150000,
        loanBalance: 180000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 70000, // 100000 - 30000 to cover shortfall
        withdrawals: { stocks: 18000, bonds: 9000, cash: 3000 }, // 30000 to cover shortfall
        marketValue: 0,
        loanBalance: 0,
        saleProceeds: -30000, // NET proceeds = 150000 - 180000 (negative!)
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(70000); // 100k + 150k - 180k
    expect(result[1].netWorth).toBe(70000); // 70k + 0 - 0
    expect(result[1].netWorthChange).toBeCloseTo(0, 2);
    expect(result[1].annualAssetsSold).toBe(-30000); // Negative proceeds
    expect(result[1].netPortfolioChange).toBeCloseTo(-30000, 2);
  });

  it('verifies invariant across full lifecycle: purchase, hold, sell financed asset', () => {
    /**
     * Complete lifecycle test:
     * Year 0: Starting state - $200k portfolio, no assets
     * Year 1: Purchase $400k house with $80k down, $320k loan
     * Year 2: Asset appreciates $12k, pay down $10k principal
     * Year 3: Sell asset with $310k remaining loan for $412k
     *
     * Verify netWorthChange = netWorth[i] - netWorth[i-1] for EVERY year
     */
    const dataPoints = [
      // Year 0: Starting state
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 200000,
      }),
      // Year 1: Purchase house
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 120000, // 200000 - 80000 down payment
        withdrawals: { stocks: 48000, bonds: 24000, cash: 8000 }, // 80000 for down payment
        marketValue: 400000,
        loanBalance: 320000,
        purchaseExpense: 80000,
      }),
      // Year 2: Appreciation and loan paydown
      createNetWorthTestDataPoint({
        age: 32,
        portfolioValue: 120000,
        marketValue: 412000, // 400000 + 12000 appreciation
        loanBalance: 310000, // 320000 - 10000 principal
        appreciation: 12000,
        loanPayment: 20000, // Total payment
        loanInterest: 10000, // Interest portion
      }),
      // Year 3: Sell asset
      createNetWorthTestDataPoint({
        age: 33,
        portfolioValue: 222000, // 120000 + 102000 net proceeds
        contributions: { stocks: 61200, bonds: 30600, cash: 10200 }, // 102000 from sale
        marketValue: 0,
        loanBalance: 0,
        saleProceeds: 102000, // NET proceeds = 412000 - 310000
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    // Year 0: netWorth = 200k + 0 - 0 = 200k
    expect(result[0].netWorth).toBe(200000);

    // Year 1: netWorth = 120k + 400k - 320k = 200k (purchase is neutral)
    expect(result[1].netWorth).toBe(200000);
    expect(result[1].netWorthChange).toBeCloseTo(0, 2);
    expect(result[1].annualAssetsPurchased).toBe(80000);

    // Year 2: netWorth = 120k + 412k - 310k = 222k
    // Change = 22k (12k appreciation + 10k loan paydown)
    expect(result[2].netWorth).toBe(222000);
    expect(result[2].netWorthChange).toBeCloseTo(22000, 2);
    expect(result[2].annualAssetAppreciation).toBe(12000);
    expect(result[2].annualDebtPaydown).toBe(10000);

    // Year 3: netWorth = 222k + 0 - 0 = 222k (sale is neutral)
    expect(result[3].netWorth).toBe(222000);
    expect(result[3].netWorthChange).toBeCloseTo(0, 2);
    expect(result[3].annualAssetsSold).toBe(102000);
    expect(result[3].netPortfolioChange).toBeCloseTo(102000, 2);
  });

  it('verifies invariant when selling partially paid off financed asset', () => {
    /**
     * Sell asset after making some payments but still with significant loan balance
     *
     * Before sale:
     * - portfolio: $50,000
     * - marketValue: $450,000 (appreciated from $400k purchase)
     * - loanBalance: $250,000 (paid down from $320k)
     * - netWorth = $50,000 + $450,000 - $250,000 = $250,000
     *
     * After sale:
     * - portfolio: $250,000 (received $200,000 net proceeds)
     * - marketValue: $0
     * - loanBalance: $0
     * - netWorth = $250,000 + $0 - $0 = $250,000
     *
     * Expected: netWorthChange = $0
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 45,
        portfolioValue: 50000,
        marketValue: 450000,
        loanBalance: 250000,
      }),
      createNetWorthTestDataPoint({
        age: 46,
        portfolioValue: 250000, // 50000 + 200000 net proceeds
        contributions: { stocks: 120000, bonds: 60000, cash: 20000 }, // 200000 from sale
        marketValue: 0,
        loanBalance: 0,
        saleProceeds: 200000, // NET proceeds = 450000 - 250000
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(250000); // 50k + 450k - 250k
    expect(result[1].netWorth).toBe(250000); // 250k + 0 - 0
    expect(result[1].netWorthChange).toBeCloseTo(0, 2);
    expect(result[1].annualAssetsSold).toBe(200000);
  });

  it('verifies invariant when selling financed asset with appreciation in same year', () => {
    /**
     * Asset appreciates and is sold in the same year
     *
     * Before appreciation and sale:
     * - portfolio: $100,000
     * - marketValue: $300,000
     * - loanBalance: $200,000
     * - netWorth = $100,000 + $300,000 - $200,000 = $200,000
     *
     * After appreciation ($15k) and sale:
     * - portfolio: $215,000 (received $115,000 net proceeds from $315k sale)
     * - marketValue: $0
     * - loanBalance: $0
     * - netWorth = $215,000 + $0 - $0 = $215,000
     *
     * Expected: netWorthChange = $215,000 - $200,000 = $15,000 (only appreciation)
     *
     * Formula:
     * - netPortfolioChange = $115,000 (sale proceeds)
     * - appreciation = $15,000
     * - assetsSold = $115,000 (315k - 200k)
     *
     * Formula: $115,000 + $15,000 + 0 + 0 - $115,000 - 0 = $15,000 ✓
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 40,
        portfolioValue: 100000,
        marketValue: 300000,
        loanBalance: 200000,
      }),
      createNetWorthTestDataPoint({
        age: 41,
        portfolioValue: 215000, // 100000 + 115000 net proceeds
        contributions: { stocks: 69000, bonds: 34500, cash: 11500 }, // 115000 from sale
        marketValue: 0, // Sold
        loanBalance: 0, // Loan paid off with sale
        appreciation: 15000, // 300k -> 315k before sale
        saleProceeds: 115000, // NET proceeds = 315000 - 200000
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(200000); // 100k + 300k - 200k
    expect(result[1].netWorth).toBe(215000); // 215k + 0 - 0
    expect(result[1].netWorthChange).toBeCloseTo(15000, 2);
    expect(result[1].annualAssetAppreciation).toBe(15000);
    expect(result[1].annualAssetsSold).toBe(115000);
  });
});

// ============================================================================
// CRITICAL: Mid-Simulation Events (Events Occurring After Year 0)
// ============================================================================

describe('ChartDataExtractor - Mid-Simulation Events', () => {
  it('verifies invariant when incurring unsecured debt in a future year', () => {
    /**
     * EDGE CASE: Incur debt after several years of normal activity
     *
     * Year 0: $100,000 portfolio, no debt
     * Year 1: $107,000 portfolio (7% returns), no debt
     * Year 2: $114,490 portfolio (7% returns), incur $15,000 credit card debt
     *
     * This tests that unsecuredDebtIncurred works correctly when:
     * - Transitioning from debtBalance: undefined → debtBalance: 15000
     * - This happens in Year 2, not Year 1
     *
     * netWorth[1] = $107,000
     * netWorth[2] = $114,490 - $15,000 = $99,490
     * netWorthChange[2] = $99,490 - $107,000 = -$7,510
     *
     * Formula: netPortfolioChange + ... - unsecuredDebtIncurred
     *        = $7,490 + 0 + 0 + 0 - 0 - $15,000 = -$7,510 ✓
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 100000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 107000,
        returns: { stocks: 4200, bonds: 2100, cash: 700 }, // 7000 total
      }),
      createNetWorthTestDataPoint({
        age: 32,
        portfolioValue: 114490,
        returns: { stocks: 4494, bonds: 2247, cash: 749 }, // 7490 total
        debtBalance: 15000,
        unsecuredDebtIncurred: 15000,
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    // Year 0
    expect(result[0].netWorth).toBe(100000);

    // Year 1: Normal growth
    expect(result[1].netWorth).toBe(107000);
    expect(result[1].netWorthChange).toBeCloseTo(7000, 2);

    // Year 2: Growth offset by new debt incurred mid-simulation
    expect(result[2].netWorth).toBe(99490); // 114490 - 15000
    expect(result[2].netWorthChange).toBeCloseTo(-7510, 2); // 7490 returns - 15000 debt
    expect(result[2].annualUnsecuredDebtIncurred).toBe(15000);
  });

  it('verifies invariant when purchasing financed asset in a future year', () => {
    /**
     * EDGE CASE: Purchase financed asset after several years of normal activity
     *
     * Year 0: $200,000 portfolio, no physical assets
     * Year 1: $214,000 portfolio (7% returns), no physical assets
     * Year 2: $148,980 portfolio (7% returns then $80k down payment),
     *         $400k house, $320k loan
     *
     * This tests that assetsPurchased works correctly when:
     * - Transitioning from marketValue: undefined → marketValue: 400000
     * - This happens in Year 2, not Year 1
     *
     * netWorth[1] = $214,000
     * netWorth[2] = $148,980 + $400,000 - $320,000 = $228,980
     * netWorthChange[2] = $228,980 - $214,000 = $14,980
     *
     * Formula: netPortfolioChange + ... + assetsPurchased - ...
     *        = -$65,020 + 0 + 0 + $80,000 - 0 - 0 = $14,980 ✓
     *
     * Where netPortfolioChange = $14,980 returns - $80,000 down payment = -$65,020
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 200000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 214000,
        returns: { stocks: 8400, bonds: 4200, cash: 1400 }, // 14000 total
      }),
      createNetWorthTestDataPoint({
        age: 32,
        portfolioValue: 148980, // 214000 * 1.07 = 228980 - 80000 = 148980
        returns: { stocks: 8988, bonds: 4494, cash: 1498 }, // 14980 total
        withdrawals: { stocks: 48000, bonds: 24000, cash: 8000 }, // 80000 for down payment
        marketValue: 400000,
        loanBalance: 320000,
        purchaseExpense: 80000, // down payment
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    // Year 0
    expect(result[0].netWorth).toBe(200000);

    // Year 1: Normal growth
    expect(result[1].netWorth).toBe(214000);
    expect(result[1].netWorthChange).toBeCloseTo(14000, 2);

    // Year 2: Purchase financed asset mid-simulation
    // netWorth = portfolio + marketValue - loanBalance = 148980 + 400000 - 320000 = 228980
    expect(result[2].netWorth).toBe(228980);
    // Change = 228980 - 214000 = 14980 (the year's returns)
    expect(result[2].netWorthChange).toBeCloseTo(14980, 2);
    expect(result[2].annualAssetsPurchased).toBe(80000);
  });

  it('verifies invariant with multiple mid-simulation events across years', () => {
    /**
     * Comprehensive multi-year test with events in different years:
     *
     * Year 0: $300,000 portfolio only
     * Year 1: Portfolio grows to $321,000 (7% returns)
     * Year 2: Incur $20,000 unsecured debt (credit card)
     * Year 3: Purchase $400k house with $80k down, $320k loan
     * Year 4: Asset appreciates $12k, pay down $10k principal, pay down $5k credit card debt
     *
     * Verify invariant holds for EVERY year transition
     */
    const dataPoints = [
      // Year 0: Starting state
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 300000,
      }),
      // Year 1: Normal growth
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 321000,
        returns: { stocks: 12600, bonds: 6300, cash: 2100 }, // 21000 total (7%)
      }),
      // Year 2: Incur unsecured debt
      createNetWorthTestDataPoint({
        age: 32,
        portfolioValue: 343470, // 321000 * 1.07 = 343470
        returns: { stocks: 13482, bonds: 6741, cash: 2247 }, // 22470 total (7%)
        debtBalance: 20000,
        unsecuredDebtIncurred: 20000,
      }),
      // Year 3: Purchase financed asset
      // Portfolio: 343470 + returns - down payment = 343470 + 24043 - 80000 = 287513
      createNetWorthTestDataPoint({
        age: 33,
        portfolioValue: 287513,
        returns: { stocks: 14425, bonds: 7213, cash: 2405 }, // 24043 total (7% of 343470)
        withdrawals: { stocks: 48000, bonds: 24000, cash: 8000 }, // 80000 for down payment
        debtBalance: 20000, // Unchanged
        marketValue: 400000,
        loanBalance: 320000,
        purchaseExpense: 80000,
      }),
      // Year 4: Asset appreciates, loan paydown, credit card paydown
      createNetWorthTestDataPoint({
        age: 34,
        portfolioValue: 307639, // 287513 * 1.07 = 307639
        returns: { stocks: 12076, bonds: 6038, cash: 2012 }, // 20126 total (7%)
        debtBalance: 15000, // 20000 - 5000 paydown
        debtPayment: 7000, // Payment
        debtInterest: 2000, // Interest
        marketValue: 412000, // 400000 + 12000 appreciation
        loanBalance: 310000, // 320000 - 10000 principal
        appreciation: 12000,
        loanPayment: 20000, // Total mortgage payment
        loanInterest: 10000, // Interest portion
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    // Year 0: netWorth = 300k
    expect(result[0].netWorth).toBe(300000);

    // Year 1: netWorth = 321k, change = 21k
    expect(result[1].netWorth).toBe(321000);
    expect(result[1].netWorthChange).toBeCloseTo(21000, 2);

    // Year 2: netWorth = 343470 - 20000 = 323470
    // change = 323470 - 321000 = 2470 (22470 returns - 20000 debt)
    expect(result[2].netWorth).toBe(323470);
    expect(result[2].netWorthChange).toBeCloseTo(2470, 2);
    expect(result[2].annualUnsecuredDebtIncurred).toBe(20000);

    // Year 3: netWorth = 287513 + 400000 - 320000 - 20000 = 347513
    // change = 347513 - 323470 = 24043 (returns for the year)
    expect(result[3].netWorth).toBe(347513);
    expect(result[3].netWorthChange).toBeCloseTo(24043, 2);
    expect(result[3].annualAssetsPurchased).toBe(80000);

    // Year 4: netWorth = 307639 + 412000 - 310000 - 15000 = 394639
    // change = 394639 - 347513 = 47126
    // Components: 20126 returns + 12000 appreciation + 10000 loan paydown + 5000 credit card paydown = 47126
    expect(result[4].netWorth).toBe(394639);
    expect(result[4].netWorthChange).toBeCloseTo(47126, 2);
    expect(result[4].annualAssetAppreciation).toBe(12000);
    expect(result[4].annualDebtPaydown).toBe(15000); // 10000 loan + 5000 credit card
  });
});

// ============================================================================
// ADDITIONAL: Gap Coverage Tests (Missing Scenarios)
// ============================================================================

describe('ChartDataExtractor - Gap Coverage Tests', () => {
  it('verifies invariant when buying asset with full cash mid-simulation', () => {
    /**
     * GAP TEST 1: Cash purchase mid-simulation (no loan)
     *
     * Year 0: $200,000 portfolio, no assets
     * Year 1: Portfolio grows to $214,000 (7% returns)
     * Year 2: Buy $100,000 car with cash (no loan)
     *         Portfolio: $214,000 + $14,980 returns - $100,000 purchase = $128,980
     *
     * When purchasing with cash:
     * - purchaseExpense = $100,000 (full price, no loan)
     * - No loan is created
     * - Asset marketValue = $100,000
     *
     * netWorth[1] = $214,000
     * netWorth[2] = $128,980 + $100,000 - $0 = $228,980
     * netWorthChange[2] = $228,980 - $214,000 = $14,980 (just the year's returns)
     *
     * Formula components:
     * - netPortfolioChange = $14,980 returns - $100,000 withdrawal = -$85,020
     * - appreciation = $0
     * - debtPaydown = $0
     * - assetsPurchased = $100,000 (full cash payment)
     * - assetsSold = $0
     * - unsecuredDebtIncurred = $0
     *
     * Formula: -$85,020 + 0 + 0 + $100,000 - 0 - 0 = $14,980 ✓
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 200000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 214000,
        returns: { stocks: 8400, bonds: 4200, cash: 1400 }, // 14000 total (7%)
      }),
      createNetWorthTestDataPoint({
        age: 32,
        portfolioValue: 128980, // 214000 + 14980 returns - 100000 purchase
        returns: { stocks: 8988, bonds: 4494, cash: 1498 }, // 14980 total (7% of 214000)
        withdrawals: { stocks: 60000, bonds: 30000, cash: 10000 }, // 100000 for cash purchase
        marketValue: 100000,
        loanBalance: 0, // No loan - cash purchase
        purchaseExpense: 100000, // Full cash payment
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    // Year 0
    expect(result[0].netWorth).toBe(200000);

    // Year 1: Normal growth
    expect(result[1].netWorth).toBe(214000);
    expect(result[1].netWorthChange).toBeCloseTo(14000, 2);

    // Year 2: Cash purchase mid-simulation
    // netWorth = portfolio + marketValue - loanBalance = 128980 + 100000 - 0 = 228980
    expect(result[2].netWorth).toBe(228980);
    // Change = 228980 - 214000 = 14980 (only portfolio returns)
    expect(result[2].netWorthChange).toBeCloseTo(14980, 2);
    expect(result[2].annualAssetsPurchased).toBe(100000);
    // Net portfolio change = returns - withdrawal = 14980 - 100000 = -85020
    expect(result[2].netPortfolioChange).toBeCloseTo(-85020, 2);
  });

  it('verifies invariant when selling fully-owned asset mid-simulation (years after acquisition)', () => {
    /**
     * GAP TEST 2: Sell fully-owned asset (no loan) in Year 3, after years of ownership
     *
     * Year 0: $100,000 portfolio, $200,000 house (fully paid, no loan)
     * Year 1: Portfolio grows $7,000, house appreciates $6,000
     * Year 2: Portfolio grows $7,490, house appreciates $6,180
     * Year 3: Sell house for $212,180 (no loan to pay off)
     *
     * This tests selling a fully-owned asset mid-simulation, not just year 0→1
     *
     * Note: Returns are specified in the data point and must match the
     * portfolio value changes exactly for the invariant to hold.
     */
    const dataPoints = [
      // Year 0: Starting with fully-owned house
      createNetWorthTestDataPoint({
        age: 40,
        portfolioValue: 100000,
        marketValue: 200000,
        loanBalance: 0, // Fully paid off
      }),
      // Year 1: Growth and appreciation
      createNetWorthTestDataPoint({
        age: 41,
        portfolioValue: 107000,
        returns: { stocks: 4200, bonds: 2100, cash: 700 }, // 7000 total
        marketValue: 206000, // 200000 + 6000 appreciation
        loanBalance: 0,
        appreciation: 6000,
      }),
      // Year 2: More growth and appreciation
      createNetWorthTestDataPoint({
        age: 42,
        portfolioValue: 114490,
        returns: { stocks: 4494, bonds: 2247, cash: 749 }, // 7490 total
        marketValue: 212180, // 206000 + 6180 appreciation
        loanBalance: 0,
        appreciation: 6180,
      }),
      // Year 3: Sell the house
      // Portfolio change: +8000 returns + 212180 sale proceeds = 220180
      // Final portfolio: 114490 + 220180 = 334670
      createNetWorthTestDataPoint({
        age: 43,
        portfolioValue: 334670, // 114490 + 8000 returns + 212180 sale
        returns: { stocks: 4800, bonds: 2400, cash: 800 }, // 8000 total
        contributions: { stocks: 127308, bonds: 63654, cash: 21218 }, // 212180 from sale
        marketValue: 0, // Sold
        loanBalance: 0,
        saleProceeds: 212180, // Full proceeds (no loan)
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    // Year 0: netWorth = 100k + 200k - 0 = 300k
    expect(result[0].netWorth).toBe(300000);

    // Year 1: netWorth = 107k + 206k - 0 = 313k
    // Change = 313k - 300k = 13k (7k returns + 6k appreciation)
    expect(result[1].netWorth).toBe(313000);
    expect(result[1].netWorthChange).toBeCloseTo(13000, 2);
    expect(result[1].annualAssetAppreciation).toBe(6000);

    // Year 2: netWorth = 114490 + 212180 - 0 = 326670
    // Change = 326670 - 313000 = 13670 (7490 returns + 6180 appreciation)
    expect(result[2].netWorth).toBe(326670);
    expect(result[2].netWorthChange).toBeCloseTo(13670, 2);
    expect(result[2].annualAssetAppreciation).toBe(6180);

    // Year 3: netWorth = 334670 + 0 - 0 = 334670
    // Change = 334670 - 326670 = 8000 (portfolio returns only, sale is neutral)
    expect(result[3].netWorth).toBe(334670);
    expect(result[3].netWorthChange).toBeCloseTo(8000, 2);
    // Sale is net-worth neutral: +212180 to portfolio, -212180 asset sold
    expect(result[3].annualAssetsSold).toBe(212180);
  });

  it('verifies invariant when debt balance increases (payment < positive interest)', () => {
    /**
     * GAP TEST 3: Debt grows because payment is less than interest
     *
     * This is different from the negative interest test (inflation > APR).
     * Here, the interest is positive but the payment doesn't cover it.
     *
     * Year 0: $100,000 portfolio, $50,000 debt at 18% APR
     * Year 1: Make $1,000 payment, but $9,000 interest accrues
     *         Debt increases to $50,000 + $9,000 - $1,000 = $58,000
     *
     * debtPaydown = payment - interest = $1,000 - $9,000 = -$8,000 (negative!)
     *
     * netWorth[0] = 100000 - 50000 = 50000
     * netWorth[1] = 100000 - 58000 = 42000
     * netWorthChange = 42000 - 50000 = -8000
     *
     * Formula: netPortfolioChange + ... + debtPaydown - unsecuredDebtIncurred
     *        = 0 + 0 + (-8000) + 0 - 0 - 0 = -8000 ✓
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 30,
        portfolioValue: 100000,
        debtBalance: 50000,
      }),
      createNetWorthTestDataPoint({
        age: 31,
        portfolioValue: 100000,
        debtBalance: 58000, // 50000 + 9000 interest - 1000 payment
        debtPayment: 1000,
        debtInterest: 9000, // High interest, low payment
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    expect(result[0].netWorth).toBe(50000);
    expect(result[1].netWorth).toBe(42000); // 100000 - 58000
    expect(result[1].netWorthChange).toBeCloseTo(-8000, 2);
    // Debt paydown is NEGATIVE because debt grew
    expect(result[1].annualDebtPaydown).toBe(-8000); // 1000 - 9000
  });

  it('verifies invariant when purchasing one asset and selling another in same year', () => {
    /**
     * GAP TEST 4: Purchase and sell assets in the same year
     *
     * Year 0: $300,000 portfolio, $200,000 house with $100,000 loan remaining
     * Year 1: Sell house (net proceeds = 200k - 100k = 100k),
     *         Buy $150,000 car with cash
     *
     * This tests having both assetsPurchased > 0 AND assetsSold > 0 simultaneously.
     *
     * netWorth[0] = 300000 + 200000 - 100000 = 400000
     *
     * After transactions:
     * - Sell house: +$100k net proceeds to portfolio
     * - Buy car: -$150k from portfolio
     * - Portfolio: 300000 + 100000 - 150000 = 250000
     * - New asset: $150k car with no loan
     *
     * netWorth[1] = 250000 + 150000 - 0 = 400000
     * netWorthChange = 400000 - 400000 = 0
     *
     * Formula components:
     * - netPortfolioChange = +100k sale proceeds - 150k purchase = -50k
     * - appreciation = 0
     * - debtPaydown = 0
     * - assetsPurchased = 150000 (car cash purchase)
     * - assetsSold = 100000 (house net proceeds)
     * - unsecuredDebtIncurred = 0
     *
     * Formula: -50000 + 0 + 0 + 150000 - 100000 - 0 = 0 ✓
     */
    const dataPoints = [
      createNetWorthTestDataPoint({
        age: 35,
        portfolioValue: 300000,
        marketValue: 200000,
        loanBalance: 100000,
      }),
      createNetWorthTestDataPoint({
        age: 36,
        portfolioValue: 250000, // 300000 + 100000 sale - 150000 purchase
        contributions: { stocks: 60000, bonds: 30000, cash: 10000 }, // 100000 from sale
        withdrawals: { stocks: 90000, bonds: 45000, cash: 15000 }, // 150000 for purchase
        marketValue: 150000, // New car
        loanBalance: 0, // Car paid in cash
        saleProceeds: 100000, // Net proceeds from house (200k - 100k loan)
        purchaseExpense: 150000, // Car purchase (full cash)
      }),
    ];

    const simulation = createNetWorthTestSimulation(dataPoints);
    const result = verifyNetWorthChangeInvariant(simulation);

    // Year 0: netWorth = 300k + 200k - 100k = 400k
    expect(result[0].netWorth).toBe(400000);

    // Year 1: netWorth = 250k + 150k - 0 = 400k (neutral transaction)
    expect(result[1].netWorth).toBe(400000);
    expect(result[1].netWorthChange).toBeCloseTo(0, 2);

    // Both components are non-zero
    expect(result[1].annualAssetsPurchased).toBe(150000);
    expect(result[1].annualAssetsSold).toBe(100000);
    // Net portfolio change = 100k sale - 150k purchase = -50k
    expect(result[1].netPortfolioChange).toBeCloseTo(-50000, 2);
  });
});
