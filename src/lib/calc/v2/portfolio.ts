import { AccountInputs } from '@/lib/schemas/account-form-schema';

import { SimulationState } from './simulation-engine';

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
  constructor(private data: AccountInputs[]) {}

  getTotalValue(): number {
    return this.data.reduce((acc, account) => acc + account.currentValue, 0);
  }
}

export interface AccountData {
  name: string;
  currentValue: number;
}

export class Account {
  constructor(private data: AccountInputs) {}

  getCurrentValue(): number {
    return this.data.currentValue;
  }
}

export class SavingsAccount extends Account {
  constructor(data: AccountInputs) {
    super(data);
  }
}

export class InvestmentAccount extends Account {
  constructor(data: AccountInputs) {
    super(data);
  }
}
