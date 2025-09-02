import type { AccountInputs, InvestmentAccountType } from '@/lib/schemas/account-form-schema';

import type { SimulationState } from './simulation-engine';
import type { AssetReturnRates, AssetReturnAmounts } from '../asset';

export interface PortfolioData {
  totalValue: number;
}

export class PortfolioProcessor {
  constructor(private simulationState: SimulationState) {}

  process(): void {
    // Process contributions (Needs income, taxes, expenses)
    // Process withdrawals (Needs net cash flow)
    // Process rebalance (Needs final portfolio state)

    return;
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
  constructor(protected currentValue: number) {}

  getCurrentValue(): number {
    return this.currentValue;
  }

  abstract applyReturns(returns: AssetReturnRates): AssetReturnAmounts;
}

export class SavingsAccount extends Account {
  constructor(data: AccountInputs) {
    super(data.currentValue);
  }

  applyReturns(returns: AssetReturnRates): AssetReturnAmounts {
    const cashReturnsAmount = this.currentValue * returns.cash;
    this.currentValue += cashReturnsAmount;
    return {
      cash: cashReturnsAmount,
      bonds: 0,
      stocks: 0,
    };
  }
}

export class InvestmentAccount extends Account {
  private percentBonds: number;

  constructor(data: AccountInputs & { type: InvestmentAccountType }) {
    super(data.currentValue);
    this.percentBonds = data.percentBonds ?? 0;
  }

  applyReturns(returns: AssetReturnRates): AssetReturnAmounts {
    const bondsPercent = this.percentBonds / 100;
    const stocksPercent = 1 - bondsPercent;

    const currentBondsValue = this.currentValue * bondsPercent;
    const currentStocksValue = this.currentValue * stocksPercent;

    const bondReturnsAmount = currentBondsValue * returns.bonds;
    const newBondsValue = currentBondsValue + bondReturnsAmount;

    const stockReturnsAmount = currentStocksValue * returns.stocks;
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
