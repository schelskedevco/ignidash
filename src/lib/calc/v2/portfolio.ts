import type { AccountInputs, InvestmentAccountType } from '@/lib/schemas/account-form-schema';

import type { SimulationState } from './simulation-engine';
import type { AssetReturnRates, AssetReturnAmounts, AssetAllocation, AssetYieldRates, AssetYieldAmounts, TaxCategory } from '../asset';
import { ContributionRules } from './contribution-rules';
import type { IncomesData } from './incomes';
import type { ExpensesData } from './expenses';
import type { TaxesData } from './taxes';

type TransactionsBreakdown = { totalForPeriod: number; byAccount: Record<string, number> };

const EXTRA_SAVINGS_ACCOUNT_ID = '54593a0d-7b4f-489d-a5bd-42500afba532';

export class PortfolioProcessor {
  private extraSavingsAccount: SavingsAccount;
  private monthlyData: PortfolioData[] = [];

  constructor(
    private simulationState: SimulationState,
    private contributionRules: ContributionRules
  ) {
    this.extraSavingsAccount = new SavingsAccount({
      type: 'savings' as const,
      id: EXTRA_SAVINGS_ACCOUNT_ID,
      name: '[System] Extra Savings',
      currentValue: 0,
    });
  }

  processCashFlows(incomesData: IncomesData, expensesData: ExpensesData): { portfolioData: PortfolioData; discretionaryExpense: number } {
    const grossCashFlow = incomesData.totalIncomeAfterWithholding - expensesData.totalExpenses;

    const {
      transactionsBreakdown: { totalForPeriod: contributionsForPeriod, byAccount: contributionsByAccount },
      discretionaryExpense,
    } = this.processContributions(grossCashFlow, incomesData);

    const {
      totalForPeriod: withdrawalsForPeriod,
      byAccount: withdrawalsByAccount,
      realizedGainsForPeriod,
      realizedGainsByAccount,
      earningsWithdrawnForPeriod,
      earningsWithdrawnByAccount,
    } = this.processWithdrawals(grossCashFlow);

    const perAccountData: Record<string, AccountDataWithTransactions> = Object.fromEntries(
      this.simulationState.portfolio.getAccounts().map((account) => {
        const accountData = account.getAccountData();
        const contributionsForPeriod = contributionsByAccount[account.getAccountID()] || 0;
        const withdrawalsForPeriod = withdrawalsByAccount[account.getAccountID()] || 0;
        const realizedGainsForPeriod = realizedGainsByAccount[account.getAccountID()] || 0;
        const earningsWithdrawnForPeriod = earningsWithdrawnByAccount[account.getAccountID()] || 0;

        return [
          account.getAccountID(),
          { ...accountData, contributionsForPeriod, withdrawalsForPeriod, realizedGainsForPeriod, earningsWithdrawnForPeriod },
        ];
      })
    );

    const totalValue = this.simulationState.portfolio.getTotalValue();
    const totalWithdrawals = this.simulationState.portfolio.getTotalWithdrawals();
    const totalContributions = this.simulationState.portfolio.getTotalContributions();
    const totalRealizedGains = this.simulationState.portfolio.getTotalRealizedGains();
    const totalEarningsWithdrawn = this.simulationState.portfolio.getTotalEarningsWithdrawn();
    const assetAllocation = this.simulationState.portfolio.getWeightedAssetAllocation();

    const result = {
      totalValue,
      totalWithdrawals,
      totalContributions,
      totalRealizedGains,
      totalEarningsWithdrawn,
      withdrawalsForPeriod,
      contributionsForPeriod,
      realizedGainsForPeriod,
      earningsWithdrawnForPeriod,
      perAccountData,
      assetAllocation,
    };

    this.monthlyData.push(result);
    return { portfolioData: result, discretionaryExpense };
  }

  processTaxes(
    annualPortfolioDataBeforeTaxes: PortfolioData,
    taxesData: TaxesData
  ): { portfolioData: PortfolioData; discretionaryExpense: number } {
    const perAccountDataBeforeTaxes = annualPortfolioDataBeforeTaxes.perAccountData;

    let withdrawalsForPeriod = annualPortfolioDataBeforeTaxes.withdrawalsForPeriod;
    let contributionsForPeriod = annualPortfolioDataBeforeTaxes.contributionsForPeriod;
    let realizedGainsForPeriod = annualPortfolioDataBeforeTaxes.realizedGainsForPeriod;
    let earningsWithdrawnForPeriod = annualPortfolioDataBeforeTaxes.earningsWithdrawnForPeriod;

    let contributionsByAccount: Record<string, number> = {};
    let withdrawalsByAccount: Record<string, number> = {};
    let realizedGainsByAccount: Record<string, number> = {};
    let earningsWithdrawnByAccount: Record<string, number> = {};

    let discretionaryExpense = 0;
    if (taxesData.totalTaxesRefund > 0) {
      const { transactionsBreakdown: res, discretionaryExpense: expense } = this.processContributions(taxesData.totalTaxesRefund);
      contributionsForPeriod += res.totalForPeriod;
      contributionsByAccount = res.byAccount;
      discretionaryExpense += expense;
    }

    if (taxesData.totalTaxesDue > 0) {
      const res = this.processWithdrawals(-taxesData.totalTaxesDue);
      withdrawalsForPeriod += res.totalForPeriod;
      withdrawalsByAccount = res.byAccount;
      realizedGainsForPeriod += res.realizedGainsForPeriod;
      realizedGainsByAccount = res.realizedGainsByAccount;
      earningsWithdrawnForPeriod += res.earningsWithdrawnForPeriod;
      earningsWithdrawnByAccount = res.earningsWithdrawnByAccount;
    }

    const perAccountData: Record<string, AccountDataWithTransactions> = Object.fromEntries(
      this.simulationState.portfolio.getAccounts().map((account) => {
        const accountData = account.getAccountData();

        const contributionsForPeriodBeforeTaxes = perAccountDataBeforeTaxes[account.getAccountID()]?.contributionsForPeriod || 0;
        const contributionsForPeriod = (contributionsByAccount[account.getAccountID()] || 0) + contributionsForPeriodBeforeTaxes;

        const withdrawalsForPeriodBeforeTaxes = perAccountDataBeforeTaxes[account.getAccountID()]?.withdrawalsForPeriod || 0;
        const withdrawalsForPeriod = (withdrawalsByAccount[account.getAccountID()] || 0) + withdrawalsForPeriodBeforeTaxes;

        const realizedGainsForPeriodBeforeTaxes = perAccountDataBeforeTaxes[account.getAccountID()]?.realizedGainsForPeriod || 0;
        const realizedGainsForPeriod = (realizedGainsByAccount[account.getAccountID()] || 0) + realizedGainsForPeriodBeforeTaxes;

        const earningsWithdrawnForPeriodBeforeTaxes = perAccountDataBeforeTaxes[account.getAccountID()]?.earningsWithdrawnForPeriod || 0;
        const earningsWithdrawnForPeriod =
          (earningsWithdrawnByAccount[account.getAccountID()] || 0) + earningsWithdrawnForPeriodBeforeTaxes;

        return [
          account.getAccountID(),
          { ...accountData, contributionsForPeriod, withdrawalsForPeriod, realizedGainsForPeriod, earningsWithdrawnForPeriod },
        ];
      })
    );

    const totalValue = this.simulationState.portfolio.getTotalValue();
    const totalWithdrawals = this.simulationState.portfolio.getTotalWithdrawals();
    const totalContributions = this.simulationState.portfolio.getTotalContributions();
    const totalRealizedGains = this.simulationState.portfolio.getTotalRealizedGains();
    const totalEarningsWithdrawn = this.simulationState.portfolio.getTotalEarningsWithdrawn();
    const assetAllocation = this.simulationState.portfolio.getWeightedAssetAllocation();

    return {
      portfolioData: {
        totalValue,
        totalWithdrawals,
        totalContributions,
        totalRealizedGains,
        totalEarningsWithdrawn,
        withdrawalsForPeriod,
        contributionsForPeriod,
        realizedGainsForPeriod,
        earningsWithdrawnForPeriod,
        perAccountData,
        assetAllocation,
      },
      discretionaryExpense,
    };
  }

  private processContributions(
    grossCashFlow: number,
    incomesData?: IncomesData
  ): { transactionsBreakdown: TransactionsBreakdown; discretionaryExpense: number } {
    const byAccount: Record<string, number> = {};
    if (!(grossCashFlow > 0)) {
      return { transactionsBreakdown: { totalForPeriod: 0, byAccount }, discretionaryExpense: 0 };
    }

    const age = this.simulationState.time.age;
    const contributionRules = this.contributionRules.getRules().sort((a, b) => a.getRank() - b.getRank());

    let remainingToContribute = grossCashFlow;
    let currentRuleIndex = 0;
    while (remainingToContribute > 0 && currentRuleIndex < contributionRules.length) {
      const rule = contributionRules[currentRuleIndex];

      const contributeToAccountID = rule.getAccountID();
      const contributeToAccount = this.simulationState.portfolio.getAccountById(contributeToAccountID);
      if (!contributeToAccount) {
        console.warn(`Contribution rule references non-existent account ID: ${contributeToAccountID}`);

        currentRuleIndex++;
        continue;
      }

      const contributionAmount = rule.getContributionAmount(remainingToContribute, contributeToAccount, this.monthlyData, age, incomesData);
      if (contributionAmount <= 0) {
        currentRuleIndex++;
        continue;
      }

      contributeToAccount.applyContribution(contributionAmount);
      byAccount[contributeToAccountID] = contributionAmount;

      remainingToContribute -= contributionAmount;
      currentRuleIndex++;
    }

    let discretionaryExpense = 0;
    if (remainingToContribute > 0) {
      const baseRule = this.contributionRules.getBaseRuleType();
      switch (baseRule) {
        case 'spend':
          discretionaryExpense = remainingToContribute;
          break;
        case 'save':
          const portfolioHasExtraSavingsAccount = this.simulationState.portfolio
            .getAccounts()
            .some((account) => account.getAccountID() === this.extraSavingsAccount.getAccountID());
          if (!portfolioHasExtraSavingsAccount) {
            this.simulationState.portfolio.addExtraSavingsAccount(this.extraSavingsAccount);
          }

          this.extraSavingsAccount.applyContribution(remainingToContribute);
          byAccount[this.extraSavingsAccount.getAccountID()] =
            (byAccount[this.extraSavingsAccount.getAccountID()] || 0) + remainingToContribute;

          remainingToContribute = 0;
          break;
      }
    }

    const totalForPeriod = grossCashFlow - remainingToContribute;

    return { transactionsBreakdown: { totalForPeriod, byAccount }, discretionaryExpense };
  }

  private processWithdrawals(grossCashFlow: number): TransactionsBreakdown & {
    realizedGainsForPeriod: number;
    realizedGainsByAccount: Record<string, number>;
    earningsWithdrawnForPeriod: number;
    earningsWithdrawnByAccount: Record<string, number>;
  } {
    const byAccount: Record<string, number> = {};
    const realizedGainsByAccount: Record<string, number> = {};
    const earningsWithdrawnByAccount: Record<string, number> = {};
    if (!(grossCashFlow < 0)) {
      return {
        totalForPeriod: 0,
        byAccount,
        realizedGainsForPeriod: 0,
        realizedGainsByAccount,
        earningsWithdrawnForPeriod: 0,
        earningsWithdrawnByAccount,
      };
    }

    let realizedGainsForPeriod = 0;
    let earningsWithdrawnForPeriod = 0;

    const withdrawalOrder = this.getWithdrawalOrder();
    let remainingToWithdraw = Math.abs(grossCashFlow);

    for (const accountType of withdrawalOrder) {
      if (remainingToWithdraw <= 0) break;

      const accountsOfType = this.simulationState.portfolio.getAccounts().filter((account) => account.getAccountType() === accountType);
      if (accountsOfType.length === 0) continue;

      for (const account of accountsOfType) {
        if (remainingToWithdraw <= 0) break;
        if (!(account.getTotalValue() > 0)) continue;

        const withdrawFromThisAccount = Math.min(remainingToWithdraw, account.getTotalValue());

        const { realizedGains, earningsWithdrawn } = account.applyWithdrawal(withdrawFromThisAccount);
        realizedGainsByAccount[account.getAccountID()] = realizedGains;
        realizedGainsForPeriod += realizedGains;
        earningsWithdrawnByAccount[account.getAccountID()] = earningsWithdrawn;
        earningsWithdrawnForPeriod += earningsWithdrawn;

        byAccount[account.getAccountID()] = withdrawFromThisAccount;
        remainingToWithdraw -= withdrawFromThisAccount;
      }
    }

    // TODO: Handle going into debt (remainingToWithdraw > 0 after drawdown loop)
    // TODO: Handle Required Minimum Distributions starting age 73

    const totalForPeriod = Math.abs(grossCashFlow) - remainingToWithdraw;

    return {
      totalForPeriod,
      byAccount,
      realizedGainsForPeriod,
      realizedGainsByAccount,
      earningsWithdrawnForPeriod,
      earningsWithdrawnByAccount,
    };
  }

  private getWithdrawalOrder(): AccountInputs['type'][] {
    // TODO: Create more sophisticated drawdown strategy based on tax, penalty efficiency

    const age = this.simulationState.time.age;
    const retirementAge = 59.5;

    if (age < retirementAge) {
      return ['savings', 'taxableBrokerage', 'roth401k', 'rothIra', '401k', 'ira', 'hsa'];
    } else {
      return ['savings', 'taxableBrokerage', '401k', 'ira', 'hsa', 'roth401k', 'rothIra'];
    }
  }

  getMonthlyData(): PortfolioData[] {
    return this.monthlyData;
  }

  resetMonthlyData(): void {
    this.monthlyData = [];
  }

  getAnnualData(): PortfolioData {
    const lastMonthData = this.monthlyData[this.monthlyData.length - 1];

    return {
      ...lastMonthData,
      ...this.monthlyData.reduce(
        (acc, curr) => {
          acc.contributionsForPeriod += curr.contributionsForPeriod;
          acc.withdrawalsForPeriod += curr.withdrawalsForPeriod;
          acc.realizedGainsForPeriod += curr.realizedGainsForPeriod;
          acc.earningsWithdrawnForPeriod += curr.earningsWithdrawnForPeriod;

          Object.entries(curr.perAccountData).forEach(([accountID, accountData]) => {
            acc.perAccountData[accountID] = {
              ...accountData,
              contributionsForPeriod: (acc.perAccountData[accountID]?.contributionsForPeriod ?? 0) + accountData.contributionsForPeriod,
              withdrawalsForPeriod: (acc.perAccountData[accountID]?.withdrawalsForPeriod ?? 0) + accountData.withdrawalsForPeriod,
              realizedGainsForPeriod: (acc.perAccountData[accountID]?.realizedGainsForPeriod ?? 0) + accountData.realizedGainsForPeriod,
              earningsWithdrawnForPeriod:
                (acc.perAccountData[accountID]?.earningsWithdrawnForPeriod ?? 0) + accountData.earningsWithdrawnForPeriod,
            };
          });

          return acc;
        },
        {
          contributionsForPeriod: 0,
          withdrawalsForPeriod: 0,
          realizedGainsForPeriod: 0,
          earningsWithdrawnForPeriod: 0,
          perAccountData: {} as Record<string, AccountDataWithTransactions>,
        }
      ),
    };
  }
}

export interface PortfolioData {
  totalValue: number;
  totalWithdrawals: number;
  totalContributions: number;
  totalRealizedGains: number;
  totalEarningsWithdrawn: number;
  withdrawalsForPeriod: number;
  contributionsForPeriod: number;
  realizedGainsForPeriod: number;
  earningsWithdrawnForPeriod: number;
  perAccountData: Record<string, AccountDataWithTransactions>;
  assetAllocation: AssetAllocation | null;
}

export class Portfolio {
  private accounts: Account[];

  constructor(data: AccountInputs[]) {
    this.accounts = data.map((accountData) => {
      if (accountData.type !== 'savings') {
        return new InvestmentAccount(accountData);
      } else {
        return new SavingsAccount(accountData);
      }
    });
  }

  addExtraSavingsAccount(extraSavingsAccount: SavingsAccount): void {
    this.accounts.push(extraSavingsAccount);
  }

  getWeightedAssetAllocation(): AssetAllocation | null {
    const totalValue = this.getTotalValue();
    if (totalValue === 0) return null;

    const weightedAllocation = this.accounts.reduce(
      (acc, account) => {
        const weight = account.getTotalValue() / totalValue;

        return {
          stocks: acc.stocks + (account.getAccountData().assetAllocation.stocks || 0) * weight,
          bonds: acc.bonds + (account.getAccountData().assetAllocation.bonds || 0) * weight,
          cash: acc.cash + (account.getAccountData().assetAllocation.cash || 0) * weight,
        };
      },
      { stocks: 0, bonds: 0, cash: 0 } as AssetAllocation
    );

    return weightedAllocation;
  }

  getAccounts(): Account[] {
    return this.accounts;
  }

  getTotalValue(): number {
    return this.accounts.reduce((acc, account) => acc + account.getTotalValue(), 0);
  }

  getTotalWithdrawals(): number {
    return this.accounts.reduce((acc, account) => acc + account.getTotalWithdrawals(), 0);
  }

  getTotalContributions(): number {
    return this.accounts.reduce((acc, account) => acc + account.getTotalContributions(), 0);
  }

  getTotalRealizedGains(): number {
    return this.accounts.reduce((acc, account) => acc + account.getTotalRealizedGains(), 0);
  }

  getTotalEarningsWithdrawn(): number {
    return this.accounts.reduce((acc, account) => acc + account.getTotalEarningsWithdrawn(), 0);
  }

  getTotalReturns(): AssetReturnAmounts {
    return this.accounts.reduce(
      (acc, curr) => {
        const currTotalReturns = curr.getTotalReturns();
        return {
          cash: acc.cash + currTotalReturns.cash,
          bonds: acc.bonds + currTotalReturns.bonds,
          stocks: acc.stocks + currTotalReturns.stocks,
        };
      },
      { cash: 0, bonds: 0, stocks: 0 } as AssetReturnAmounts
    );
  }

  getAccountById(accountID: string): Account | undefined {
    return this.accounts.find((account) => account.getAccountID() === accountID);
  }

  applyReturns(returns: AssetReturnRates): { returnsForPeriod: AssetReturnAmounts; totalReturns: AssetReturnAmounts } {
    const returnsForPeriod: AssetReturnAmounts = {
      cash: 0,
      bonds: 0,
      stocks: 0,
    };
    const totalReturns: AssetReturnAmounts = {
      cash: 0,
      bonds: 0,
      stocks: 0,
    };

    this.accounts.forEach((account) => {
      const { returnsForPeriod: accountReturnsForPeriod, totalReturns: accountTotalReturns } = account.applyReturns(returns);

      returnsForPeriod.cash += accountReturnsForPeriod.cash;
      returnsForPeriod.bonds += accountReturnsForPeriod.bonds;
      returnsForPeriod.stocks += accountReturnsForPeriod.stocks;

      totalReturns.cash += accountTotalReturns.cash;
      totalReturns.bonds += accountTotalReturns.bonds;
      totalReturns.stocks += accountTotalReturns.stocks;
    });

    return { returnsForPeriod, totalReturns };
  }

  applyYields(yields: AssetYieldRates): { yieldsForPeriod: AssetYieldAmounts; totalYields: AssetYieldAmounts } {
    const yieldsForPeriod: AssetYieldAmounts = {
      taxable: { dividendYield: 0, bondYield: 0 },
      taxDeferred: { dividendYield: 0, bondYield: 0 },
      taxFree: { dividendYield: 0, bondYield: 0 },
    };
    const totalYields: AssetYieldAmounts = {
      taxable: { dividendYield: 0, bondYield: 0 },
      taxDeferred: { dividendYield: 0, bondYield: 0 },
      taxFree: { dividendYield: 0, bondYield: 0 },
    };

    this.accounts
      .filter((account) => account.getAccountType() !== 'savings')
      .forEach((account) => {
        const { yieldsForPeriod: accountYieldsForPeriod, totalYields: accountTotalYields } = account.applyYields(yields);

        (['taxable', 'taxDeferred', 'taxFree'] as TaxCategory[]).forEach((category) => {
          yieldsForPeriod[category].dividendYield += accountYieldsForPeriod[category].dividendYield;
          yieldsForPeriod[category].bondYield += accountYieldsForPeriod[category].bondYield;

          totalYields[category].dividendYield += accountTotalYields[category].dividendYield;
          totalYields[category].bondYield += accountTotalYields[category].bondYield;
        });
      });

    return { yieldsForPeriod, totalYields };
  }
}

export interface AccountData {
  totalValue: number;
  totalWithdrawals: number;
  totalContributions: number;
  totalRealizedGains: number;
  name: string;
  id: string;
  type: AccountInputs['type'];
  assetAllocation: AssetAllocation;
}

export interface AccountDataWithTransactions extends AccountData {
  contributionsForPeriod: number;
  withdrawalsForPeriod: number;
  realizedGainsForPeriod: number;
  earningsWithdrawnForPeriod: number;
}

export abstract class Account {
  constructor(
    protected totalValue: number,
    protected name: string,
    protected id: string,
    protected type: AccountInputs['type'],
    protected totalReturns: AssetReturnAmounts,
    protected totalContributions: number,
    protected totalWithdrawals: number,
    protected totalRealizedGains: number,
    protected totalEarningsWithdrawn: number,
    protected totalYields: AssetYieldAmounts
  ) {}

  getAccountID(): string {
    return this.id;
  }

  getAccountType(): AccountInputs['type'] {
    return this.type;
  }

  getTotalValue(): number {
    return this.totalValue;
  }

  getTotalWithdrawals(): number {
    return this.totalWithdrawals;
  }

  getTotalContributions(): number {
    return this.totalContributions;
  }

  getTotalReturns(): AssetReturnAmounts {
    return this.totalReturns;
  }

  getTotalRealizedGains(): number {
    return this.totalRealizedGains;
  }

  getTotalEarningsWithdrawn(): number {
    return this.totalEarningsWithdrawn;
  }

  abstract getAccountData(): AccountData;

  abstract applyReturns(returns: AssetReturnRates): { returnsForPeriod: AssetReturnAmounts; totalReturns: AssetReturnAmounts };
  abstract applyYields(yields: AssetYieldRates): { yieldsForPeriod: AssetYieldAmounts; totalYields: AssetYieldAmounts };
  abstract applyContribution(amount: number): void;
  abstract applyWithdrawal(amount: number): { realizedGains: number; earningsWithdrawn: number };
}

export class SavingsAccount extends Account {
  constructor(data: AccountInputs) {
    super(data.currentValue, data.name, data.id, data.type, { cash: 0, bonds: 0, stocks: 0 }, 0, 0, 0, 0, {
      taxable: { dividendYield: 0, bondYield: 0 },
      taxDeferred: { dividendYield: 0, bondYield: 0 },
      taxFree: { dividendYield: 0, bondYield: 0 },
    });
  }

  getAccountData(): AccountData {
    const assetAllocation: AssetAllocation = {
      cash: 1,
      bonds: 0,
      stocks: 0,
    };

    return {
      totalValue: this.totalValue,
      totalWithdrawals: this.totalWithdrawals,
      totalContributions: this.totalContributions,
      totalRealizedGains: this.totalRealizedGains,
      name: this.name,
      id: this.id,
      type: this.type,
      assetAllocation,
    };
  }

  applyReturns(returns: AssetReturnRates): { returnsForPeriod: AssetReturnAmounts; totalReturns: AssetReturnAmounts } {
    const cashReturnsAmount = this.totalValue * returns.cash;

    this.totalValue += cashReturnsAmount;
    this.totalReturns.cash += cashReturnsAmount;

    return { returnsForPeriod: { cash: cashReturnsAmount, bonds: 0, stocks: 0 }, totalReturns: { ...this.totalReturns } };
  }

  applyYields(yields: AssetYieldRates): { yieldsForPeriod: AssetYieldAmounts; totalYields: AssetYieldAmounts } {
    throw new Error('Savings account should not receive yields');
  }

  applyContribution(amount: number): void {
    this.totalValue += amount;
    this.totalContributions += amount;
  }

  applyWithdrawal(amount: number): { realizedGains: number; earningsWithdrawn: number } {
    if (amount > this.totalValue) throw new Error('Insufficient funds for withdrawal');
    this.totalValue -= amount;
    this.totalWithdrawals += amount;

    return { realizedGains: 0, earningsWithdrawn: 0 };
  }
}

export class InvestmentAccount extends Account {
  private initialPercentBonds: number;
  private currPercentBonds: number;

  private costBasis: number | undefined;
  private contributionBasis: number | undefined;

  constructor(data: AccountInputs & { type: InvestmentAccountType }) {
    super(data.currentValue, data.name, data.id, data.type, { cash: 0, bonds: 0, stocks: 0 }, 0, 0, 0, 0, {
      taxable: { dividendYield: 0, bondYield: 0 },
      taxDeferred: { dividendYield: 0, bondYield: 0 },
      taxFree: { dividendYield: 0, bondYield: 0 },
    });
    this.initialPercentBonds = (data.percentBonds ?? 0) / 100;
    this.currPercentBonds = (data.percentBonds ?? 0) / 100;

    if ('costBasis' in data) this.costBasis = data.costBasis;
    if ('contributionBasis' in data) this.contributionBasis = data.contributionBasis;
  }

  getAccountData(): AccountData {
    const assetAllocation: AssetAllocation = {
      cash: 0,
      bonds: this.currPercentBonds,
      stocks: 1 - this.currPercentBonds,
    };

    return {
      totalValue: this.totalValue,
      totalWithdrawals: this.totalWithdrawals,
      totalContributions: this.totalContributions,
      totalRealizedGains: this.totalRealizedGains,
      name: this.name,
      id: this.id,
      type: this.type,
      assetAllocation,
    };
  }

  applyReturns(returns: AssetReturnRates): { returnsForPeriod: AssetReturnAmounts; totalReturns: AssetReturnAmounts } {
    const bondsPercent = this.currPercentBonds;
    const stocksPercent = 1 - bondsPercent;

    const currentBondsValue = this.totalValue * bondsPercent;
    const currentStocksValue = this.totalValue * stocksPercent;

    const bondReturnsAmount = currentBondsValue * returns.bonds;
    this.totalReturns.bonds += bondReturnsAmount;
    const newBondsValue = currentBondsValue + bondReturnsAmount;

    const stockReturnsAmount = currentStocksValue * returns.stocks;
    this.totalReturns.stocks += stockReturnsAmount;
    const newStocksValue = currentStocksValue + stockReturnsAmount;

    this.totalValue = newBondsValue + newStocksValue;
    this.currPercentBonds = this.totalValue ? newBondsValue / this.totalValue : this.initialPercentBonds;

    return { returnsForPeriod: { cash: 0, bonds: bondReturnsAmount, stocks: stockReturnsAmount }, totalReturns: { ...this.totalReturns } };
  }

  applyYields(yields: AssetYieldRates): { yieldsForPeriod: AssetYieldAmounts; totalYields: AssetYieldAmounts } {
    const { dividendYield, bondYield } = yields;

    const bondsPercent = this.currPercentBonds;
    const stocksPercent = 1 - bondsPercent;

    const currentBondsValue = this.totalValue * bondsPercent;
    const currentStocksValue = this.totalValue * stocksPercent;

    const bondYieldAmount = currentBondsValue * bondYield;
    const dividendYieldAmount = currentStocksValue * dividendYield;

    switch (this.type) {
      case 'savings':
        throw new Error('Savings account should not be of type InvestmentAccount');
      case 'taxableBrokerage':
        this.totalYields.taxable.bondYield += bondYieldAmount;
        this.totalYields.taxable.dividendYield += dividendYieldAmount;

        return {
          yieldsForPeriod: {
            taxable: { bondYield: bondYieldAmount, dividendYield: dividendYieldAmount },
            taxDeferred: { bondYield: 0, dividendYield: 0 },
            taxFree: { bondYield: 0, dividendYield: 0 },
          },
          totalYields: { ...this.totalYields },
        };
      case '401k':
      case 'ira':
      case 'hsa':
        this.totalYields.taxDeferred.bondYield += bondYieldAmount;
        this.totalYields.taxDeferred.dividendYield += dividendYieldAmount;

        return {
          yieldsForPeriod: {
            taxable: { bondYield: 0, dividendYield: 0 },
            taxDeferred: { bondYield: bondYieldAmount, dividendYield: dividendYieldAmount },
            taxFree: { bondYield: 0, dividendYield: 0 },
          },
          totalYields: { ...this.totalYields },
        };
      case 'roth401k':
      case 'rothIra':
        this.totalYields.taxFree.bondYield += bondYieldAmount;
        this.totalYields.taxFree.dividendYield += dividendYieldAmount;

        return {
          yieldsForPeriod: {
            taxable: { bondYield: 0, dividendYield: 0 },
            taxDeferred: { bondYield: 0, dividendYield: 0 },
            taxFree: { bondYield: bondYieldAmount, dividendYield: dividendYieldAmount },
          },
          totalYields: { ...this.totalYields },
        };
    }
  }

  applyContribution(amount: number): void {
    if (amount < 0) throw new Error('Contribution amount must be non-negative');
    if (amount === 0) return;

    const currentBondValue = this.totalValue * this.currPercentBonds;

    const newTotalValue = this.totalValue + amount;
    const targetBondValue = newTotalValue * this.initialPercentBonds;

    let bondContribution = targetBondValue - currentBondValue;
    bondContribution = Math.max(0, Math.min(amount, bondContribution));

    this.totalValue = newTotalValue;
    this.currPercentBonds = newTotalValue ? (currentBondValue + bondContribution) / newTotalValue : this.initialPercentBonds;

    this.totalContributions += amount;
    if (this.costBasis !== undefined) this.costBasis += amount;
    if (this.contributionBasis !== undefined) this.contributionBasis += amount;
  }

  applyWithdrawal(amount: number): { realizedGains: number; earningsWithdrawn: number } {
    if (amount < 0) throw new Error('Withdrawal amount must be non-negative');
    if (amount === 0) return { realizedGains: 0, earningsWithdrawn: 0 };
    if (amount > this.totalValue) throw new Error('Insufficient funds for withdrawal');

    const currentBondValue = this.totalValue * this.currPercentBonds;

    const newTotalValue = this.totalValue - amount;
    const targetBondValue = newTotalValue * this.initialPercentBonds;

    let bondWithdrawal = currentBondValue - targetBondValue;
    bondWithdrawal = Math.max(0, Math.min(amount, bondWithdrawal, currentBondValue));

    let realizedGains = 0;
    if (this.costBasis !== undefined) {
      const basisProportion = this.costBasis / this.totalValue;
      const basisWithdrawn = Math.min(amount * basisProportion, this.costBasis);
      this.costBasis -= basisWithdrawn;

      realizedGains = amount - basisWithdrawn;
      this.totalRealizedGains += realizedGains;
    }

    let earningsWithdrawn = 0;
    if (this.contributionBasis !== undefined) {
      const contributionWithdrawn = Math.min(amount, this.contributionBasis);
      this.contributionBasis -= contributionWithdrawn;

      earningsWithdrawn = amount - contributionWithdrawn;
      this.totalEarningsWithdrawn += earningsWithdrawn;
    }

    this.totalValue = newTotalValue;
    this.currPercentBonds = newTotalValue ? (currentBondValue - bondWithdrawal) / newTotalValue : this.initialPercentBonds;

    this.totalWithdrawals += amount;

    return { realizedGains, earningsWithdrawn };
  }
}
