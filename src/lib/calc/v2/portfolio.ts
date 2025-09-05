import type { AccountInputs, InvestmentAccountType } from '@/lib/schemas/account-form-schema';
import { v4 as uuidv4 } from 'uuid';

import type { SimulationState } from './simulation-engine';
import type { AssetReturnRates, AssetReturnAmounts, AssetAllocation } from '../asset';
import { ContributionRules } from './contribution-rules';

type TransactionsBreakdown = { totalForPeriod: number; byAccount: Record<string, number> };

export class PortfolioProcessor {
  private extraSavingsAccount: SavingsAccount;
  private monthlyData: PortfolioData[] = [];

  constructor(
    private simulationState: SimulationState,
    private contributionRules: ContributionRules
  ) {
    this.extraSavingsAccount = new SavingsAccount({
      type: 'savings' as const,
      id: uuidv4(),
      name: '[SYSTEM] Extra Savings',
      currentValue: 0,
    });
  }

  process(grossCashFlow: number): PortfolioData {
    const { totalForPeriod: contributionsForPeriod, byAccount: contributionsByAccount } = this.processContributions(grossCashFlow);
    const { totalForPeriod: withdrawalsForPeriod, byAccount: withdrawalsByAccount } = this.processWithdrawals(grossCashFlow);

    const perAccountData: Record<string, AccountDataWithTransactions> = Object.fromEntries(
      this.simulationState.portfolio.getAccounts().map((account) => {
        const accountData = account.getAccountData();
        const contributionsForPeriod = contributionsByAccount[account.getAccountID()] || 0;
        const withdrawalsForPeriod = withdrawalsByAccount[account.getAccountID()] || 0;

        return [account.getAccountID(), { ...accountData, contributionsForPeriod, withdrawalsForPeriod }];
      })
    );
    const totalValue = this.simulationState.portfolio.getTotalValue();
    const totalWithdrawals = this.simulationState.portfolio.getTotalWithdrawals();
    const totalContributions = this.simulationState.portfolio.getTotalContributions();
    const assetAllocation = this.simulationState.portfolio.getWeightedAssetAllocation();

    const result = {
      totalValue,
      totalWithdrawals,
      totalContributions,
      withdrawalsForPeriod,
      contributionsForPeriod,
      perAccountData,
      assetAllocation,
    };

    this.monthlyData.push(result);
    return result;
  }

  private processContributions(grossCashFlow: number): TransactionsBreakdown {
    const byAccount: Record<string, number> = {};
    if (!(grossCashFlow > 0)) {
      return { totalForPeriod: 0, byAccount };
    }

    const totalForPeriod = grossCashFlow;
    const contributionRules = this.contributionRules.getRules().sort((a, b) => a.getRank() - b.getRank());

    let remainingToContribute = grossCashFlow;
    let currentRuleIndex = 0;
    while (remainingToContribute > 0 && currentRuleIndex < contributionRules.length) {
      const rule = contributionRules[currentRuleIndex];
      if (!rule.canApply()) {
        currentRuleIndex++;
        continue;
      }

      const contributionAmount = rule.getContributionAmount(remainingToContribute);
      const contributeToAccountID = rule.getAccountID();
      const contributeToAccount = this.simulationState.portfolio.getAccountById(contributeToAccountID)!;

      contributeToAccount.applyContribution(contributionAmount);
      byAccount[contributeToAccountID] = contributionAmount;

      remainingToContribute -= contributionAmount;
      currentRuleIndex++;
    }

    if (remainingToContribute > 0) {
      const baseRule = this.contributionRules.getBaseRuleType();
      switch (baseRule) {
        case 'spend':
          // TODO: Create SYSTEM expense for remainingToContribute with spend base rule
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
          break;
      }
    }

    return { totalForPeriod, byAccount };
  }

  private processWithdrawals(grossCashFlow: number): TransactionsBreakdown {
    const byAccount: Record<string, number> = {};
    if (!(grossCashFlow < 0)) {
      return { totalForPeriod: 0, byAccount };
    }

    // TODO: Create more sophisticated drawdown strategy
    const withdrawalOrder = ['savings', 'taxableBrokerage', 'roth401k', 'rothIra', '401k', 'ira', 'hsa'] as const;
    let remainingToWithdraw = grossCashFlow;

    for (const accountType of withdrawalOrder) {
      if (remainingToWithdraw <= 0) break;

      const accountsOfType = this.simulationState.portfolio.getAccounts().filter((account) => account.getAccountType() === accountType);
      if (accountsOfType.length === 0) continue;

      for (const account of accountsOfType) {
        if (remainingToWithdraw <= 0) break;
        if (!(account.getTotalValue() > 0)) continue;

        const withdrawFromThisAccount = Math.min(remainingToWithdraw, account.getTotalValue());
        account.applyWithdrawal(withdrawFromThisAccount);

        byAccount[account.getAccountID()] = withdrawFromThisAccount;
        remainingToWithdraw -= withdrawFromThisAccount;
      }
    }

    // TODO: Handle going into debt (totalDebt: remainingToWithdraw > 0 ? remainingToWithdraw : 0)

    return { totalForPeriod: grossCashFlow, byAccount };
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

          Object.entries(curr.perAccountData).forEach(([accountID, accountData]) => {
            acc.perAccountData[accountID] = {
              ...accountData,
              contributionsForPeriod: (acc.perAccountData[accountID]?.contributionsForPeriod ?? 0) + accountData.contributionsForPeriod,
              withdrawalsForPeriod: (acc.perAccountData[accountID]?.withdrawalsForPeriod ?? 0) + accountData.withdrawalsForPeriod,
            };
          });

          return acc;
        },
        {
          contributionsForPeriod: 0,
          withdrawalsForPeriod: 0,
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
  withdrawalsForPeriod: number;
  contributionsForPeriod: number;
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

  applyReturns(returns: AssetReturnRates): AssetReturnAmounts {
    const totalReturns: AssetReturnAmounts = {
      cash: 0,
      bonds: 0,
      stocks: 0,
    };

    this.accounts.forEach((account) => {
      const accountReturns = account.applyReturns(returns);

      totalReturns.cash += accountReturns.cash;
      totalReturns.bonds += accountReturns.bonds;
      totalReturns.stocks += accountReturns.stocks;
    });

    return totalReturns;
  }
}

export interface AccountData {
  totalValue: number;
  totalWithdrawals: number;
  totalContributions: number;
  name: string;
  id: string;
  type: 'savings' | 'taxableBrokerage' | 'roth401k' | 'rothIra' | '401k' | 'ira' | 'hsa';
  assetAllocation: AssetAllocation;
}

export interface AccountDataWithTransactions extends AccountData {
  contributionsForPeriod: number;
  withdrawalsForPeriod: number;
}

export abstract class Account {
  constructor(
    protected totalValue: number,
    protected name: string,
    protected id: string,
    protected type: 'savings' | 'taxableBrokerage' | 'roth401k' | 'rothIra' | '401k' | 'ira' | 'hsa',
    protected totalReturns: AssetReturnAmounts,
    protected totalContributions: number,
    protected totalWithdrawals: number
  ) {}

  getAccountID(): string {
    return this.id;
  }

  getAccountType(): 'savings' | 'taxableBrokerage' | 'roth401k' | 'rothIra' | '401k' | 'ira' | 'hsa' {
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

  abstract getAccountData(): AccountData;

  abstract applyReturns(returns: AssetReturnRates): AssetReturnAmounts;
  abstract applyContribution(amount: number): void;
  abstract applyWithdrawal(amount: number): void;
}

export class SavingsAccount extends Account {
  constructor(data: AccountInputs) {
    super(data.currentValue, data.name, data.id, data.type, { cash: 0, bonds: 0, stocks: 0 }, 0, 0);
  }

  getAccountData(): AccountData {
    const assetAllocation: AssetAllocation = {
      cash: 100,
      bonds: 0,
      stocks: 0,
    };

    return {
      totalValue: this.totalValue,
      totalWithdrawals: this.totalWithdrawals,
      totalContributions: this.totalContributions,
      name: this.name,
      id: this.id,
      type: this.type,
      assetAllocation,
    };
  }

  applyReturns(returns: AssetReturnRates): AssetReturnAmounts {
    const cashReturnsAmount = this.totalValue * returns.cash;

    this.totalValue += cashReturnsAmount;
    this.totalReturns.cash += cashReturnsAmount;

    return { cash: cashReturnsAmount, bonds: 0, stocks: 0 };
  }

  applyContribution(amount: number): void {
    this.totalValue += amount;
    this.totalContributions += amount;
  }

  applyWithdrawal(amount: number): void {
    if (amount > this.totalValue) throw new Error('Insufficient funds for withdrawal');
    this.totalValue -= amount;
    this.totalWithdrawals += amount;
  }
}

export class InvestmentAccount extends Account {
  private initialPercentBonds: number;
  private currPercentBonds: number;

  private costBasis: number | undefined;
  private contributions: number | undefined;

  constructor(data: AccountInputs & { type: InvestmentAccountType }) {
    super(data.currentValue, data.name, data.id, data.type, { cash: 0, bonds: 0, stocks: 0 }, 0, 0);
    this.initialPercentBonds = (data.percentBonds ?? 0) / 100;
    this.currPercentBonds = (data.percentBonds ?? 0) / 100;

    if ('costBasis' in data) this.costBasis = data.costBasis;
    if ('contributions' in data) this.contributions = data.contributions;
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
      name: this.name,
      id: this.id,
      type: this.type,
      assetAllocation,
    };
  }

  applyReturns(returns: AssetReturnRates): AssetReturnAmounts {
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

    return { cash: 0, bonds: bondReturnsAmount, stocks: stockReturnsAmount };
  }

  applyContribution(amount: number): void {
    const currentBondValue = this.totalValue * this.currPercentBonds;

    const newTotalValue = this.totalValue + amount;
    const targetBondValue = newTotalValue * this.initialPercentBonds;

    let bondContribution = targetBondValue - currentBondValue;
    bondContribution = Math.max(0, Math.min(amount, bondContribution));

    this.totalValue = newTotalValue;
    this.currPercentBonds = newTotalValue ? (currentBondValue + bondContribution) / newTotalValue : this.initialPercentBonds;

    this.totalContributions += amount;
    if (this.costBasis !== undefined) this.costBasis += amount;
    if (this.contributions !== undefined) this.contributions += amount;
  }

  applyWithdrawal(amount: number): void {
    if (amount > this.totalValue) throw new Error('Insufficient funds for withdrawal');

    const currentBondValue = this.totalValue * this.currPercentBonds;

    const newTotalValue = this.totalValue - amount;
    const targetBondValue = newTotalValue * this.initialPercentBonds;

    let bondWithdrawal = currentBondValue - targetBondValue;
    bondWithdrawal = Math.max(0, Math.min(amount, bondWithdrawal, currentBondValue));

    this.totalValue = newTotalValue;
    this.currPercentBonds = newTotalValue ? (currentBondValue - bondWithdrawal) / newTotalValue : this.initialPercentBonds;

    this.totalWithdrawals += amount;
    if (this.costBasis !== undefined) this.costBasis -= amount;
    if (this.contributions !== undefined) this.contributions -= amount;
  }
}
