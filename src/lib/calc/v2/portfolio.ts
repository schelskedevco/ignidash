import type { AccountInputs, InvestmentAccountType } from '@/lib/schemas/account-form-schema';

import type { SimulationState } from './simulation-engine';
import type { AssetReturnRates, AssetReturnAmounts } from '../asset';
import { ContributionRules } from './contribution-rules';

export interface PortfolioData {
  totalValue: number;
  totalWithdrawals: number;
  totalContributions: number;
}

export class PortfolioProcessor {
  constructor(
    private simulationState: SimulationState,
    private contributionRules: ContributionRules
  ) {}

  process(grossCashFlow: number): PortfolioData {
    // Process contributions (Needs income, taxes, expenses)
    // Process withdrawals (Needs net cash flow)
    // Process rebalance (Needs final portfolio state)

    const totalContributions = this.processContributions(grossCashFlow);
    const totalWithdrawals = this.processWithdrawals(grossCashFlow);

    return { totalValue: this.simulationState.portfolio.getTotalValue(), totalWithdrawals, totalContributions };
  }

  private processContributions(grossCashFlow: number): number {
    if (!(grossCashFlow > 0)) {
      return 0;
    }

    const totalContributions = grossCashFlow;
    const contributionRules = this.contributionRules.getRules();

    let cashLeftToAllocate = grossCashFlow;
    let currentRuleIndex = 0;
    while (cashLeftToAllocate > 0 && currentRuleIndex < contributionRules.length) {
      const rule = contributionRules[currentRuleIndex];
      if (!rule.canApply()) {
        currentRuleIndex++;
        continue;
      }

      const contributionAmount = rule.getContributionAmount(cashLeftToAllocate);
      const contributeToAccountID = rule.getAccountID();
      const contributeToAccount = this.simulationState.portfolio.getAccountById(contributeToAccountID)!;

      contributeToAccount.applyContribution(contributionAmount);

      cashLeftToAllocate -= contributionAmount;
      currentRuleIndex++;
    }

    if (cashLeftToAllocate > 0) {
      const baseRule = this.contributionRules.getBaseRuleType();
      switch (baseRule) {
        case 'spend':
          // Handle remaining cash for spend
          break;
        case 'save':
          // Handle remaining cash for save
          break;
      }
    }

    return totalContributions;
  }

  private processWithdrawals(grossCashFlow: number): number {
    if (!(grossCashFlow < 0)) {
      return 0;
    }

    const totalWithdrawals = grossCashFlow;
    return totalWithdrawals;
  }
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

  getTotalValue(): number {
    return this.accounts.reduce((acc, account) => acc + account.getCurrentValue(), 0);
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
  name: string;
  currentValue: number;
}

export abstract class Account {
  constructor(
    protected currentValue: number,
    protected name: string,
    protected id: string,
    protected totalReturns: AssetReturnAmounts
  ) {}

  getAccountID(): string {
    return this.id;
  }

  getCurrentValue(): number {
    return this.currentValue;
  }

  abstract applyReturns(returns: AssetReturnRates): AssetReturnAmounts;
  abstract applyContribution(amount: number): void;
}

export class SavingsAccount extends Account {
  constructor(data: AccountInputs) {
    super(data.currentValue, data.name, data.id, { cash: 0, bonds: 0, stocks: 0 });
  }

  applyReturns(returns: AssetReturnRates): AssetReturnAmounts {
    const cashReturnsAmount = this.currentValue * returns.cash;

    this.currentValue += cashReturnsAmount;
    this.totalReturns.cash += cashReturnsAmount;

    return {
      cash: cashReturnsAmount,
      bonds: 0,
      stocks: 0,
    };
  }

  applyContribution(amount: number): void {
    this.currentValue += amount;
  }
}

export class InvestmentAccount extends Account {
  private initialPercentBonds: number;
  private currPercentBonds: number;
  private costBasis: number | undefined;
  private contributions: number | undefined;

  constructor(data: AccountInputs & { type: InvestmentAccountType }) {
    super(data.currentValue, data.name, data.id, { cash: 0, bonds: 0, stocks: 0 });
    this.initialPercentBonds = data.percentBonds ?? 0;
    this.currPercentBonds = data.percentBonds ?? 0;

    if ('costBasis' in data) this.costBasis = data.costBasis;
    if ('contributions' in data) this.contributions = data.contributions;
  }

  applyReturns(returns: AssetReturnRates): AssetReturnAmounts {
    const bondsPercent = this.currPercentBonds / 100;
    const stocksPercent = 1 - bondsPercent;

    const currentBondsValue = this.currentValue * bondsPercent;
    const currentStocksValue = this.currentValue * stocksPercent;

    const bondReturnsAmount = currentBondsValue * returns.bonds;
    this.totalReturns.bonds += bondReturnsAmount;
    const newBondsValue = currentBondsValue + bondReturnsAmount;

    const stockReturnsAmount = currentStocksValue * returns.stocks;
    this.totalReturns.stocks += stockReturnsAmount;
    const newStocksValue = currentStocksValue + stockReturnsAmount;

    this.currentValue = newBondsValue + newStocksValue;
    this.currPercentBonds = (newBondsValue / this.currentValue) * 100;

    return {
      cash: 0,
      bonds: bondReturnsAmount,
      stocks: stockReturnsAmount,
    };
  }

  applyContribution(amount: number): void {
    // TODO: Handle percentBonds allocation with contributions.

    this.currentValue += amount;

    if (this.costBasis !== undefined) this.costBasis += amount;
    if (this.contributions !== undefined) this.contributions += amount;
  }
}
