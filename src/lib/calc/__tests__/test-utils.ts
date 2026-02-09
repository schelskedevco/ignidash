/**
 * Shared Test Utilities for Financial Simulation Tests
 *
 * Consolidates common test fixtures and factory functions used across
 * simulation-engine, account, taxes, portfolio-processor, and other test files.
 */

import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import type { IncomeInputs } from '@/lib/schemas/inputs/income-form-schema';
import type { ExpenseInputs } from '@/lib/schemas/inputs/expense-form-schema';
import type { ContributionInputs } from '@/lib/schemas/inputs/contribution-form-schema';
import type { TimelineInputs } from '@/lib/schemas/inputs/timeline-form-schema';
import type { MarketAssumptionsInputs } from '@/lib/schemas/inputs/market-assumptions-form-schema';
import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';
import type { PhysicalAssetInputs } from '@/lib/schemas/inputs/physical-asset-form-schema';
import type { DebtInputs } from '@/lib/schemas/inputs/debt-form-schema';

import type { SimulationState, SimulationContext } from '../simulation-engine';
import type { PortfolioData } from '../portfolio';
import type { IncomesData } from '../incomes';
import type { ExpensesData } from '../expenses';
import type { ReturnsData } from '../returns';
import type { PhysicalAssetsData } from '../physical-assets';
import type { DebtsData } from '../debts';
import type { TaxCategory } from '../asset';
import { Portfolio } from '../portfolio';

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_ALLOCATION = { stocks: 0.6, bonds: 0.4, cash: 0 };

// ============================================================================
// Account Factories
// ============================================================================

export const createSavingsAccount = (overrides?: Partial<AccountInputs & { type: 'savings' }>): AccountInputs & { type: 'savings' } => ({
  type: 'savings',
  id: overrides?.id ?? 'savings-1',
  name: overrides?.name ?? 'Savings Account',
  balance: overrides?.balance ?? 10000,
});

export const create401kAccount = (overrides?: Partial<AccountInputs & { type: '401k' }>): AccountInputs & { type: '401k' } => ({
  type: '401k',
  id: overrides?.id ?? '401k-1',
  name: overrides?.name ?? '401k Account',
  balance: overrides?.balance ?? 100000,
  percentBonds: overrides?.percentBonds ?? 20,
});

export const createIraAccount = (overrides?: Partial<AccountInputs & { type: 'ira' }>): AccountInputs & { type: 'ira' } => ({
  type: 'ira',
  id: overrides?.id ?? 'ira-1',
  name: overrides?.name ?? 'IRA Account',
  balance: overrides?.balance ?? 50000,
  percentBonds: overrides?.percentBonds ?? 30,
});

export const createRothIraAccount = (overrides?: Partial<AccountInputs & { type: 'rothIra' }>): AccountInputs & { type: 'rothIra' } => ({
  type: 'rothIra',
  id: overrides?.id ?? 'roth-1',
  name: overrides?.name ?? 'Roth IRA',
  balance: overrides?.balance ?? 50000,
  percentBonds: overrides?.percentBonds ?? 10,
  contributionBasis: overrides?.contributionBasis ?? 40000,
});

export const createTaxableBrokerageAccount = (
  overrides?: Partial<AccountInputs & { type: 'taxableBrokerage' }>
): AccountInputs & { type: 'taxableBrokerage' } => ({
  type: 'taxableBrokerage',
  id: overrides?.id ?? 'taxable-1',
  name: overrides?.name ?? 'Taxable Brokerage',
  balance: overrides?.balance ?? 75000,
  percentBonds: overrides?.percentBonds ?? 15,
  costBasis: overrides?.costBasis ?? 50000,
});

export const createHsaAccount = (overrides?: Partial<AccountInputs & { type: 'hsa' }>): AccountInputs & { type: 'hsa' } => ({
  type: 'hsa',
  id: overrides?.id ?? 'hsa-1',
  name: overrides?.name ?? 'HSA',
  balance: overrides?.balance ?? 20000,
  percentBonds: overrides?.percentBonds ?? 20,
});

// ============================================================================
// Income Factories
// ============================================================================

export const createIncomeInput = (overrides?: Partial<IncomeInputs>): IncomeInputs => ({
  id: overrides?.id ?? 'income-1',
  name: overrides?.name ?? 'Salary',
  amount: overrides?.amount ?? 10000,
  frequency: overrides?.frequency ?? 'monthly',
  disabled: overrides?.disabled ?? false,
  timeframe: overrides?.timeframe ?? {
    start: { type: 'now' },
    end: undefined,
  },
  taxes: overrides?.taxes ?? {
    incomeType: 'wage',
    withholding: 22,
  },
  growth: overrides?.growth,
});

export const createWageIncome = (overrides?: {
  id?: string;
  name?: string;
  amount?: number;
  frequency?: IncomeInputs['frequency'];
  timeframe?: IncomeInputs['timeframe'];
  taxes?: IncomeInputs['taxes'];
  growth?: IncomeInputs['growth'];
  disabled?: boolean;
}): IncomeInputs => ({
  id: overrides?.id ?? 'income-1',
  name: overrides?.name ?? 'Salary',
  amount: overrides?.amount ?? 100000,
  frequency: overrides?.frequency ?? 'yearly',
  timeframe: overrides?.timeframe ?? {
    start: { type: 'now' },
    end: { type: 'atRetirement' },
  },
  taxes: overrides?.taxes ?? { incomeType: 'wage', withholding: 22 },
  growth: overrides?.growth,
  disabled: overrides?.disabled ?? false,
});

// ============================================================================
// Expense Factories
// ============================================================================

export const createExpenseInput = (overrides?: Partial<ExpenseInputs>): ExpenseInputs => ({
  id: overrides?.id ?? 'expense-1',
  name: overrides?.name ?? 'Living Expenses',
  amount: overrides?.amount ?? 5000,
  frequency: overrides?.frequency ?? 'monthly',
  disabled: overrides?.disabled ?? false,
  timeframe: overrides?.timeframe ?? {
    start: { type: 'now' },
    end: undefined,
  },
  growth: overrides?.growth,
});

export const createLivingExpense = (overrides?: {
  id?: string;
  name?: string;
  amount?: number;
  frequency?: ExpenseInputs['frequency'];
  timeframe?: ExpenseInputs['timeframe'];
  growth?: ExpenseInputs['growth'];
  disabled?: boolean;
}): ExpenseInputs => ({
  id: overrides?.id ?? 'expense-1',
  name: overrides?.name ?? 'Living Expenses',
  amount: overrides?.amount ?? 40000,
  frequency: overrides?.frequency ?? 'yearly',
  timeframe: overrides?.timeframe ?? {
    start: { type: 'now' },
    end: { type: 'atLifeExpectancy' },
  },
  growth: overrides?.growth,
  disabled: overrides?.disabled ?? false,
});

// ============================================================================
// Physical Asset Factories
// ============================================================================

export const createPhysicalAssetInput = (overrides?: Partial<PhysicalAssetInputs>): PhysicalAssetInputs => ({
  id: overrides?.id ?? 'asset-1',
  name: overrides?.name ?? 'Primary Residence',
  assetType: overrides?.assetType ?? 'other',
  purchaseDate: overrides?.purchaseDate ?? { type: 'now' },
  purchasePrice: overrides?.purchasePrice ?? 400000,
  marketValue: overrides?.marketValue,
  appreciationRate: overrides?.appreciationRate ?? 3,
  saleDate: overrides?.saleDate ?? { type: 'atLifeExpectancy' },
  paymentMethod: overrides?.paymentMethod ?? { type: 'cash' },
});

export const createFinancedAssetInput = (overrides?: Partial<PhysicalAssetInputs>): PhysicalAssetInputs => {
  const paymentMethodOverrides = overrides?.paymentMethod?.type === 'loan' ? overrides.paymentMethod : undefined;
  const downPayment = paymentMethodOverrides?.downPayment ?? 80000;
  const loanBalance = paymentMethodOverrides?.loanBalance ?? 320000;

  return {
    id: overrides?.id ?? 'asset-1',
    name: overrides?.name ?? 'Primary Residence',
    assetType: overrides?.assetType ?? 'other',
    purchaseDate: overrides?.purchaseDate ?? { type: 'now' },
    purchasePrice: overrides?.purchasePrice ?? 400000,
    marketValue: overrides?.marketValue,
    appreciationRate: overrides?.appreciationRate ?? 3,
    saleDate: overrides?.saleDate ?? { type: 'atLifeExpectancy' },
    paymentMethod: {
      type: 'loan',
      downPayment,
      loanBalance,
      apr: paymentMethodOverrides?.apr ?? 6,
      monthlyPayment: paymentMethodOverrides?.monthlyPayment ?? 1918.56, // Standard 30yr payment at 6% APR on $320k
    },
  };
};

// ============================================================================
// Debt Factories
// ============================================================================

export const createDebtInput = (overrides?: Partial<DebtInputs>): DebtInputs => ({
  id: overrides?.id ?? 'debt-1',
  name: overrides?.name ?? 'Credit Card',
  balance: overrides?.balance ?? 10000,
  apr: overrides?.apr ?? 18,
  interestType: overrides?.interestType ?? 'simple',
  compoundingFrequency: overrides?.compoundingFrequency,
  startDate: overrides?.startDate ?? { type: 'now' },
  monthlyPayment: overrides?.monthlyPayment ?? 500,
  disabled: overrides?.disabled ?? false,
});

// ============================================================================
// Contribution Rule Factory
// ============================================================================

export const createContributionRule = (
  overrides?: Partial<Omit<ContributionInputs, 'contributionType'>> & {
    contributionType?: ContributionInputs['contributionType'];
    dollarAmount?: number;
    percentRemaining?: number;
  }
): ContributionInputs => {
  const base = {
    id: overrides?.id ?? 'contribution-1',
    accountId: overrides?.accountId ?? '401k-1',
    rank: overrides?.rank ?? 1,
    disabled: overrides?.disabled ?? false,
    employerMatch: overrides?.employerMatch,
    maxBalance: overrides?.maxBalance,
    incomeIds: overrides?.incomeIds,
  };

  const contributionType = overrides?.contributionType ?? 'unlimited';

  if (contributionType === 'dollarAmount') {
    return {
      ...base,
      contributionType: 'dollarAmount',
      dollarAmount: overrides?.dollarAmount ?? 1000,
    };
  }

  if (contributionType === 'percentRemaining') {
    return {
      ...base,
      contributionType: 'percentRemaining',
      percentRemaining: overrides?.percentRemaining ?? 50,
    };
  }

  return {
    ...base,
    contributionType: 'unlimited',
  };
};

// ============================================================================
// Timeline & Market Assumptions Factories
// ============================================================================

export const createDefaultTimeline = (): TimelineInputs => ({
  lifeExpectancy: 87,
  birthMonth: 1,
  birthYear: 1990,
  retirementStrategy: { type: 'fixedAge', retirementAge: 65 },
});

export const createDefaultMarketAssumptions = (): MarketAssumptionsInputs => ({
  stockReturn: 9,
  stockYield: 2,
  bondReturn: 4,
  bondYield: 3.5,
  cashReturn: 3,
  inflationRate: 3,
});

// ============================================================================
// Simulator Inputs Factory
// ============================================================================

export const createSimulatorInputs = (overrides?: Partial<SimulatorInputs>): SimulatorInputs => ({
  timeline: overrides?.timeline !== undefined ? overrides.timeline : createDefaultTimeline(),
  incomes: overrides?.incomes ?? {},
  expenses: overrides?.expenses ?? {},
  debts: overrides?.debts ?? {},
  physicalAssets: overrides?.physicalAssets ?? {},
  accounts: overrides?.accounts ?? {},
  contributionRules: overrides?.contributionRules ?? {},
  baseContributionRule: overrides?.baseContributionRule ?? { type: 'save' },
  marketAssumptions: overrides?.marketAssumptions ?? createDefaultMarketAssumptions(),
  taxSettings: overrides?.taxSettings ?? { filingStatus: 'single' },
  privacySettings: overrides?.privacySettings ?? { isPrivate: true },
  simulationSettings: overrides?.simulationSettings ?? { simulationSeed: 12345, simulationMode: 'fixedReturns' },
  glidePath: overrides?.glidePath,
});

// ============================================================================
// Simulation State Factories
// ============================================================================

export const createSimulationState = (overrides: Partial<SimulationState> = {}): SimulationState => ({
  time: {
    age: 35,
    year: 2024,
    month: 1,
    date: new Date(2024, 0, 1),
    ...overrides.time,
  },
  phase: overrides.phase !== undefined ? overrides.phase : { name: 'accumulation' },
  portfolio: overrides.portfolio ?? ({} as SimulationState['portfolio']),
  annualData: overrides.annualData ?? { expenses: [], debts: [], physicalAssets: [] },
});

export const createMockSimulationState = (
  portfolio: Portfolio,
  age: number,
  phase: 'accumulation' | 'retirement' = 'retirement'
): SimulationState => ({
  time: { date: new Date(2025, 0, 1), age, year: 2025, month: 1 },
  portfolio,
  phase: { name: phase },
  annualData: { expenses: [], debts: [], physicalAssets: [] },
});

// ============================================================================
// Simulation Context Factory
// ============================================================================

export const createSimulationContext = (overrides?: Partial<SimulationContext>): SimulationContext => {
  const startAge = overrides?.startAge ?? 35;
  const endAge = overrides?.endAge ?? 90;
  const yearsToSimulate = overrides?.yearsToSimulate ?? Math.ceil(endAge - startAge);
  const startDate = overrides?.startDate ?? new Date(2025, 0, 1);
  const endDate = overrides?.endDate ?? new Date(startDate.getFullYear() + yearsToSimulate, startDate.getMonth(), 1);

  return {
    startAge,
    endAge,
    yearsToSimulate,
    startDate,
    endDate,
    retirementStrategy: overrides?.retirementStrategy ?? { type: 'fixedAge', retirementAge: 65 },
    rmdAge: overrides?.rmdAge ?? 75,
  };
};

// ============================================================================
// Empty Data Factories
// ============================================================================

export const createEmptyPortfolioData = (): PortfolioData => ({
  totalValue: 0,
  cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
  cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
  cumulativeEmployerMatch: 0,
  cumulativeRealizedGains: 0,
  cumulativeEarningsWithdrawn: 0,
  cumulativeRmds: 0,
  outstandingShortfall: 0,
  withdrawals: { stocks: 0, bonds: 0, cash: 0 },
  contributions: { stocks: 0, bonds: 0, cash: 0 },
  employerMatch: 0,
  realizedGains: 0,
  earningsWithdrawn: 0,
  rmds: 0,
  shortfall: 0,
  shortfallRepaid: 0,
  perAccountData: {},
  assetAllocation: null,
});

export const createEmptyIncomesData = (overrides?: Partial<IncomesData>): IncomesData => ({
  totalIncome: overrides?.totalIncome ?? 0,
  totalAmountWithheld: overrides?.totalAmountWithheld ?? 0,
  totalFicaTax: overrides?.totalFicaTax ?? 0,
  totalIncomeAfterPayrollDeductions: overrides?.totalIncomeAfterPayrollDeductions ?? 0,
  totalTaxFreeIncome: overrides?.totalTaxFreeIncome ?? 0,
  totalSocialSecurityIncome: overrides?.totalSocialSecurityIncome ?? 0,
  perIncomeData: overrides?.perIncomeData ?? {},
});

export const createEmptyExpensesData = (overrides?: Partial<ExpensesData>): ExpensesData => ({
  totalExpenses: overrides?.totalExpenses ?? 0,
  perExpenseData: overrides?.perExpenseData ?? {},
});

export const createEmptyReturnsData = (): ReturnsData => ({
  cumulativeReturnAmounts: { stocks: 0, bonds: 0, cash: 0 },
  cumulativeYieldAmounts: {
    taxable: { stocks: 0, bonds: 0, cash: 0 },
    taxDeferred: { stocks: 0, bonds: 0, cash: 0 },
    taxFree: { stocks: 0, bonds: 0, cash: 0 },
    cashSavings: { stocks: 0, bonds: 0, cash: 0 },
  },
  returnAmounts: { stocks: 0, bonds: 0, cash: 0 },
  returnRates: { stocks: 0, bonds: 0, cash: 0 },
  yieldAmounts: {
    taxable: { stocks: 0, bonds: 0, cash: 0 },
    taxDeferred: { stocks: 0, bonds: 0, cash: 0 },
    taxFree: { stocks: 0, bonds: 0, cash: 0 },
    cashSavings: { stocks: 0, bonds: 0, cash: 0 },
  },
  yieldRates: { stocks: 0, bonds: 0, cash: 0 },
  inflationRate: 0,
  annualReturnRates: { stocks: 0, bonds: 0, cash: 0 },
  annualYieldRates: { stocks: 0, bonds: 0, cash: 0 },
  annualInflationRate: 0,
  perAccountData: {},
});

export const createEmptyPhysicalAssetsData = (overrides?: Partial<PhysicalAssetsData>): PhysicalAssetsData => ({
  totalMarketValue: overrides?.totalMarketValue ?? 0,
  totalLoanBalance: overrides?.totalLoanBalance ?? 0,
  totalEquity: overrides?.totalEquity ?? 0,
  totalAppreciation: overrides?.totalAppreciation ?? 0,
  totalLoanPayment: overrides?.totalLoanPayment ?? 0,
  totalInterest: overrides?.totalInterest ?? 0,
  totalPrincipalPaid: overrides?.totalPrincipalPaid ?? 0,
  totalUnpaidInterest: overrides?.totalUnpaidInterest ?? 0,
  totalDebtPaydown: overrides?.totalDebtPaydown ?? 0,
  totalPurchaseOutlay: overrides?.totalPurchaseOutlay ?? 0,
  totalPurchaseMarketValue: overrides?.totalPurchaseMarketValue ?? 0,
  totalSaleProceeds: overrides?.totalSaleProceeds ?? 0,
  totalSaleMarketValue: overrides?.totalSaleMarketValue ?? 0,
  totalRealizedGains: overrides?.totalRealizedGains ?? 0,
  totalSecuredDebtIncurred: overrides?.totalSecuredDebtIncurred ?? 0,
  totalDebtPayoff: overrides?.totalDebtPayoff ?? 0,
  perAssetData: overrides?.perAssetData ?? {},
});

export const createEmptyDebtsData = (overrides?: Partial<DebtsData>): DebtsData => ({
  totalDebtBalance: overrides?.totalDebtBalance ?? 0,
  totalPayment: overrides?.totalPayment ?? 0,
  totalInterest: overrides?.totalInterest ?? 0,
  totalPrincipalPaid: overrides?.totalPrincipalPaid ?? 0,
  totalUnpaidInterest: overrides?.totalUnpaidInterest ?? 0,
  totalDebtPaydown: overrides?.totalDebtPaydown ?? 0,
  totalUnsecuredDebtIncurred: overrides?.totalUnsecuredDebtIncurred ?? 0,
  perDebtData: overrides?.perDebtData ?? {},
});

// ============================================================================
// Account Data Factory (for portfolio data per-account entries)
// ============================================================================

export const createAccountData = (
  overrides: {
    id: string;
    name: string;
    type: AccountInputs['type'];
    balance?: number;
    contributions?: { stocks: number; bonds: number; cash: number };
    employerMatch?: number;
    withdrawals?: { stocks: number; bonds: number; cash: number };
  } & Partial<PortfolioData['perAccountData'][string]>
): PortfolioData['perAccountData'][string] => ({
  id: overrides.id,
  name: overrides.name,
  type: overrides.type,
  balance: overrides.balance ?? 100000,
  cumulativeContributions: overrides.cumulativeContributions ?? { stocks: 0, bonds: 0, cash: 0 },
  cumulativeEmployerMatch: overrides.cumulativeEmployerMatch ?? 0,
  cumulativeWithdrawals: overrides.cumulativeWithdrawals ?? { stocks: 0, bonds: 0, cash: 0 },
  cumulativeRealizedGains: overrides.cumulativeRealizedGains ?? 0,
  cumulativeEarningsWithdrawn: overrides.cumulativeEarningsWithdrawn ?? 0,
  cumulativeRmds: overrides.cumulativeRmds ?? 0,
  assetAllocation: overrides.assetAllocation ?? { stocks: 0.8, bonds: 0.2, cash: 0 },
  contributions: overrides.contributions ?? overrides.contributions ?? { stocks: 0, bonds: 0, cash: 0 },
  employerMatch: overrides.employerMatch ?? overrides.employerMatch ?? 0,
  withdrawals: overrides.withdrawals ?? overrides.withdrawals ?? { stocks: 0, bonds: 0, cash: 0 },
  realizedGains: overrides.realizedGains ?? 0,
  earningsWithdrawn: overrides.earningsWithdrawn ?? 0,
  rmds: overrides.rmds ?? 0,
});

// ============================================================================
// Yield Amounts Factory (for tax category-based yields)
// ============================================================================

export const createEmptyYieldAmounts = (): Record<TaxCategory, { stocks: number; bonds: number; cash: number }> => ({
  taxable: { stocks: 0, bonds: 0, cash: 0 },
  taxDeferred: { stocks: 0, bonds: 0, cash: 0 },
  taxFree: { stocks: 0, bonds: 0, cash: 0 },
  cashSavings: { stocks: 0, bonds: 0, cash: 0 },
});
