import type { AccountInputs, InvestmentAccountType } from '@/lib/schemas/account-form-schema';

import type { SimulationState } from './simulation-engine';
import type { AssetReturnRates, AssetReturnAmounts } from '../asset';

export interface PortfolioData {
  totalValue: number;
  totalWithdrawals: number;
  totalContributions: number;
}

export class PortfolioProcessor {
  constructor(private simulationState: SimulationState) {}

  process(netCashFlow: number): PortfolioData {
    // Process contributions (Needs income, taxes, expenses)
    // Process withdrawals (Needs net cash flow)
    // Process rebalance (Needs final portfolio state)

    if (netCashFlow > 0) {
      // Handle contributions
    } else if (netCashFlow < 0) {
      // Handle withdrawals
    }

    return { totalValue: this.simulationState.portfolio.getTotalValue(), totalWithdrawals: 0, totalContributions: 0 };
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

  getCurrentValue(): number {
    return this.currentValue;
  }

  abstract applyReturns(returns: AssetReturnRates): AssetReturnAmounts;
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
}

export class InvestmentAccount extends Account {
  private percentBonds: number;
  private costBasis: number | undefined;
  private contributions: number | undefined;

  constructor(data: AccountInputs & { type: InvestmentAccountType }) {
    super(data.currentValue, data.name, data.id, { cash: 0, bonds: 0, stocks: 0 });
    this.percentBonds = data.percentBonds ?? 0;

    if ('costBasis' in data) this.costBasis = data.costBasis;
    if ('contributions' in data) this.contributions = data.contributions;
  }

  applyReturns(returns: AssetReturnRates): AssetReturnAmounts {
    const bondsPercent = this.percentBonds / 100;
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
    this.percentBonds = (newBondsValue / this.currentValue) * 100;

    return {
      cash: 0,
      bonds: bondReturnsAmount,
      stocks: stockReturnsAmount,
    };
  }
}
