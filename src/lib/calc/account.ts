import type { AccountInputs, InvestmentAccountType } from '@/lib/schemas/inputs/account-form-schema';

import type {
  AssetReturnRates,
  AssetReturnAmounts,
  AssetAllocation,
  AssetYieldRates,
  AssetYieldAmounts,
  TaxCategory,
  AssetTransactions,
} from './asset';

type WithdrawalType = 'rmd' | 'regular';
type ContributionType = 'self' | 'employer';

export interface AccountData {
  balance: number;
  cumulativeContributions: AssetTransactions;
  cumulativeEmployerMatch: number;
  cumulativeWithdrawals: AssetTransactions;
  cumulativeRealizedGains: number;
  cumulativeEarningsWithdrawn: number;
  cumulativeRmds: number;
  name: string;
  id: string;
  type: AccountInputs['type'];
  assetAllocation: AssetAllocation;
}

export interface AccountDataWithTransactions extends AccountData {
  contributionsForPeriod: AssetTransactions;
  employerMatchForPeriod: number;
  withdrawalsForPeriod: AssetTransactions;
  realizedGainsForPeriod: number;
  earningsWithdrawnForPeriod: number;
  rmdsForPeriod: number;
}

export abstract class Account {
  abstract readonly taxCategory: TaxCategory;

  constructor(
    protected balance: number,
    protected name: string,
    protected id: string,
    protected type: AccountInputs['type'],
    protected cumulativeReturns: AssetReturnAmounts,
    protected cumulativeContributions: AssetTransactions,
    protected cumulativeEmployerMatch: number,
    protected cumulativeWithdrawals: AssetTransactions,
    protected cumulativeRealizedGains: number,
    protected cumulativeEarningsWithdrawn: number,
    protected cumulativeRmds: number,
    protected cumulativeYields: AssetYieldAmounts
  ) {}

  getBalance(): number {
    return this.balance;
  }

  getAccountName(): string {
    return this.name;
  }

  getAccountID(): string {
    return this.id;
  }

  getAccountType(): AccountInputs['type'] {
    return this.type;
  }

  getCumulativeReturns(): AssetReturnAmounts {
    return this.cumulativeReturns;
  }

  getCumulativeContributions(): AssetTransactions {
    return this.cumulativeContributions;
  }

  getCumulativeEmployerMatch(): number {
    return this.cumulativeEmployerMatch;
  }

  getCumulativeWithdrawals(): AssetTransactions {
    return this.cumulativeWithdrawals;
  }

  getCumulativeRealizedGains(): number {
    return this.cumulativeRealizedGains;
  }

  getCumulativeEarningsWithdrawn(): number {
    return this.cumulativeEarningsWithdrawn;
  }

  getCumulativeRmds(): number {
    return this.cumulativeRmds;
  }

  getCumulativeYields(): AssetYieldAmounts {
    return this.cumulativeYields;
  }

  abstract getHasRMDs(): boolean;
  abstract getAccountData(): AccountData;
  abstract applyReturns(returns: AssetReturnRates): { returnsForPeriod: AssetReturnAmounts; cumulativeReturns: AssetReturnAmounts };
  abstract applyYields(yields: AssetYieldRates): { yieldsForPeriod: AssetYieldAmounts; cumulativeYields: AssetYieldAmounts };
  abstract applyContribution(amount: number, type: ContributionType, contributionAllocation: AssetAllocation): AssetTransactions;
  abstract applyWithdrawal(
    amount: number,
    type: WithdrawalType,
    withdrawalAllocation: AssetAllocation
  ): AssetTransactions & { realizedGains: number; earningsWithdrawn: number };
}

export class SavingsAccount extends Account {
  readonly taxCategory: TaxCategory = 'cashSavings';

  constructor(data: AccountInputs) {
    const cumulativeReturns: AssetReturnAmounts = { cash: 0, bonds: 0, stocks: 0 };
    const cumulativeContributions: AssetTransactions = { cash: 0, bonds: 0, stocks: 0 };
    const cumulativeWithdrawals: AssetTransactions = { cash: 0, bonds: 0, stocks: 0 };
    const cumulativeYields: AssetYieldAmounts = { cash: 0, bonds: 0, stocks: 0 };

    super(
      data.balance,
      data.name,
      data.id,
      data.type,
      cumulativeReturns,
      cumulativeContributions,
      0,
      cumulativeWithdrawals,
      0,
      0,
      0,
      cumulativeYields
    );
  }

  getHasRMDs(): boolean {
    return false;
  }

  getAccountData(): AccountData {
    const assetAllocation: AssetAllocation = { cash: 1, bonds: 0, stocks: 0 };

    return {
      balance: this.balance,
      cumulativeWithdrawals: { ...this.cumulativeWithdrawals },
      cumulativeContributions: { ...this.cumulativeContributions },
      cumulativeEmployerMatch: this.cumulativeEmployerMatch,
      cumulativeRealizedGains: this.cumulativeRealizedGains,
      cumulativeEarningsWithdrawn: this.cumulativeEarningsWithdrawn,
      cumulativeRmds: this.cumulativeRmds,
      name: this.name,
      id: this.id,
      type: this.type,
      assetAllocation,
    };
  }

  applyReturns(returns: AssetReturnRates): { returnsForPeriod: AssetReturnAmounts; cumulativeReturns: AssetReturnAmounts } {
    const cashReturnsAmount = this.balance * returns.cash;

    this.balance += cashReturnsAmount;
    this.cumulativeReturns.cash += cashReturnsAmount;

    return { returnsForPeriod: { cash: cashReturnsAmount, bonds: 0, stocks: 0 }, cumulativeReturns: { ...this.cumulativeReturns } };
  }

  applyYields(yields: AssetYieldRates): { yieldsForPeriod: AssetYieldAmounts; cumulativeYields: AssetYieldAmounts } {
    const { cash: cashYield } = yields;

    const cashYieldAmount = this.balance * cashYield;
    this.cumulativeYields.cash += cashYieldAmount;

    return {
      yieldsForPeriod: { cash: cashYieldAmount, bonds: 0, stocks: 0 },
      cumulativeYields: { ...this.cumulativeYields },
    };
  }

  applyContribution(amount: number, type: ContributionType, contributionAllocation: AssetAllocation): AssetTransactions {
    this.balance += amount;
    this.cumulativeContributions.cash += amount;
    if (type === 'employer') this.cumulativeEmployerMatch += amount;

    return { stocks: 0, bonds: 0, cash: amount };
  }

  applyWithdrawal(
    amount: number,
    type: WithdrawalType,
    withdrawalAllocation: AssetAllocation
  ): AssetTransactions & { realizedGains: number; earningsWithdrawn: number } {
    if (amount > this.balance) throw new Error('Insufficient funds for withdrawal');
    if (type === 'rmd') throw new Error('Savings account should not have RMDs');

    this.balance -= amount;
    this.cumulativeWithdrawals.cash += amount;

    return { stocks: 0, bonds: 0, cash: amount, realizedGains: 0, earningsWithdrawn: 0 };
  }
}

export abstract class InvestmentAccount extends Account {
  private currPercentBonds: number;

  constructor(data: AccountInputs & { type: InvestmentAccountType }) {
    const cumulativeReturns: AssetReturnAmounts = { cash: 0, bonds: 0, stocks: 0 };
    const cumulativeContributions: AssetTransactions = { cash: 0, bonds: 0, stocks: 0 };
    const cumulativeWithdrawals: AssetTransactions = { cash: 0, bonds: 0, stocks: 0 };
    const cumulativeYields: AssetYieldAmounts = { cash: 0, bonds: 0, stocks: 0 };

    super(
      data.balance,
      data.name,
      data.id,
      data.type,
      cumulativeReturns,
      cumulativeContributions,
      0,
      cumulativeWithdrawals,
      0,
      0,
      0,
      cumulativeYields
    );
    this.currPercentBonds = data.percentBonds / 100;
  }

  getHasRMDs(): boolean {
    return this.type === 'ira' || this.type === '401k' || this.type === '403b';
  }

  getAccountData(): AccountData {
    const assetAllocation: AssetAllocation = { cash: 0, bonds: this.currPercentBonds, stocks: 1 - this.currPercentBonds };

    return {
      balance: this.balance,
      cumulativeWithdrawals: { ...this.cumulativeWithdrawals },
      cumulativeContributions: { ...this.cumulativeContributions },
      cumulativeEmployerMatch: this.cumulativeEmployerMatch,
      cumulativeRealizedGains: this.cumulativeRealizedGains,
      cumulativeEarningsWithdrawn: this.cumulativeEarningsWithdrawn,
      cumulativeRmds: this.cumulativeRmds,
      name: this.name,
      id: this.id,
      type: this.type,
      assetAllocation,
    };
  }

  applyReturns(returns: AssetReturnRates): { returnsForPeriod: AssetReturnAmounts; cumulativeReturns: AssetReturnAmounts } {
    const bondsPercent = this.currPercentBonds;
    const stocksPercent = 1 - bondsPercent;

    const currentBondsValue = this.balance * bondsPercent;
    const currentStocksValue = this.balance * stocksPercent;

    const bondReturnsAmount = currentBondsValue * returns.bonds;
    this.cumulativeReturns.bonds += bondReturnsAmount;
    const newBondsValue = currentBondsValue + bondReturnsAmount;

    const stockReturnsAmount = currentStocksValue * returns.stocks;
    this.cumulativeReturns.stocks += stockReturnsAmount;
    const newStocksValue = currentStocksValue + stockReturnsAmount;

    this.balance = newBondsValue + newStocksValue;
    this.currPercentBonds = this.balance ? newBondsValue / this.balance : this.currPercentBonds;

    return {
      returnsForPeriod: { cash: 0, bonds: bondReturnsAmount, stocks: stockReturnsAmount },
      cumulativeReturns: { ...this.cumulativeReturns },
    };
  }

  applyYields(yields: AssetYieldRates): { yieldsForPeriod: AssetYieldAmounts; cumulativeYields: AssetYieldAmounts } {
    const { stocks: dividendYield, bonds: bondYield } = yields;

    const bondsPercent = this.currPercentBonds;
    const stocksPercent = 1 - bondsPercent;

    const currentBondsValue = this.balance * bondsPercent;
    const currentStocksValue = this.balance * stocksPercent;

    const bondYieldAmount = currentBondsValue * bondYield;
    const dividendYieldAmount = currentStocksValue * dividendYield;

    this.cumulativeYields.bonds += bondYieldAmount;
    this.cumulativeYields.stocks += dividendYieldAmount;

    return {
      yieldsForPeriod: { bonds: bondYieldAmount, stocks: dividendYieldAmount, cash: 0 },
      cumulativeYields: { ...this.cumulativeYields },
    };
  }

  protected applyContributionShared(amount: number, type: ContributionType, contributionAllocation: AssetAllocation): AssetTransactions {
    if (amount < 0) throw new Error('Contribution amount must be non-negative');
    if (amount === 0) return { stocks: 0, bonds: 0, cash: 0 };

    const currentBondsValue = this.balance * this.currPercentBonds;
    const currentStocksValue = this.balance * (1 - this.currPercentBonds);

    const bondContribution = amount * contributionAllocation.bonds;
    const stockContribution = amount * (1 - contributionAllocation.bonds);

    const newBondsValue = currentBondsValue + bondContribution;
    const newStocksValue = currentStocksValue + stockContribution;
    const newBalance = newBondsValue + newStocksValue;

    this.balance = newBalance;
    this.currPercentBonds = newBalance > 0 ? newBondsValue / newBalance : this.currPercentBonds;

    this.cumulativeContributions.stocks += stockContribution;
    this.cumulativeContributions.bonds += bondContribution;
    if (type === 'employer') this.cumulativeEmployerMatch += amount;

    return { stocks: stockContribution, bonds: bondContribution, cash: 0 };
  }

  protected applyWithdrawalShared(amount: number, type: WithdrawalType, withdrawalAllocation: AssetAllocation): AssetTransactions {
    if (amount < 0) throw new Error('Withdrawal amount must be non-negative');
    if (amount === 0) return { stocks: 0, bonds: 0, cash: 0 };
    if (amount > this.balance) throw new Error('Insufficient funds for withdrawal');

    const currentBondsValue = this.balance * this.currPercentBonds;
    const currentStocksValue = this.balance * (1 - this.currPercentBonds);

    const targetBondWithdrawal = Math.min(amount * withdrawalAllocation.bonds, currentBondsValue);
    const bondWithdrawal = Math.max(targetBondWithdrawal, amount - currentStocksValue);
    const stockWithdrawal = amount - bondWithdrawal;

    const newBondsValue = currentBondsValue - bondWithdrawal;
    const newStocksValue = currentStocksValue - stockWithdrawal;
    const newBalance = newBondsValue + newStocksValue;

    this.balance = Math.max(0, newBalance);
    this.currPercentBonds = newBalance > 0 ? newBondsValue / newBalance : this.currPercentBonds;

    this.cumulativeWithdrawals.stocks += stockWithdrawal;
    this.cumulativeWithdrawals.bonds += bondWithdrawal;
    if (type === 'rmd') this.cumulativeRmds += amount;

    return { stocks: stockWithdrawal, bonds: bondWithdrawal, cash: 0 };
  }

  applyRebalance(stocksExcess: number, bondsExcess: number): { stocksSold: number; bondsSold: number; realizedGains: number } {
    const currentBondsValue = this.balance * this.currPercentBonds;
    const currentStocksValue = this.balance * (1 - this.currPercentBonds);

    let stocksSold = 0;
    if (stocksExcess > 0) stocksSold = Math.min(stocksExcess, currentStocksValue);

    let bondsSold = 0;
    if (bondsExcess > 0) bondsSold = Math.min(bondsExcess, currentBondsValue);

    const newBondsValue = currentBondsValue - bondsSold + stocksSold;
    this.currPercentBonds = this.balance > 0 ? newBondsValue / this.balance : this.currPercentBonds;

    const realizedGains = this.calculateRebalanceGains(stocksSold, bondsSold);

    return { stocksSold, bondsSold, realizedGains };
  }

  protected calculateRebalanceGains(stocksSold: number, bondsSold: number): number {
    return 0;
  }
}

export class TaxableBrokerageAccount extends InvestmentAccount {
  readonly taxCategory: TaxCategory = 'taxable';

  private costBasis: number;

  constructor(data: AccountInputs & { type: 'taxableBrokerage' }) {
    super(data);
    this.costBasis = data.costBasis!;
  }

  getCostBasis(): number {
    return this.costBasis;
  }

  applyContribution(amount: number, type: ContributionType, contributionAllocation: AssetAllocation): AssetTransactions {
    const contributed = super.applyContributionShared(amount, type, contributionAllocation);
    this.costBasis += amount;
    return contributed;
  }

  applyWithdrawal(
    amount: number,
    type: WithdrawalType,
    withdrawalAllocation: AssetAllocation
  ): AssetTransactions & { realizedGains: number; earningsWithdrawn: number } {
    const basisProportion = this.costBasis / this.balance;
    const basisWithdrawn = Math.min(amount * basisProportion, this.costBasis);
    this.costBasis -= basisWithdrawn;

    const realizedGains = amount - basisWithdrawn;
    this.cumulativeRealizedGains += realizedGains;

    const withdrawn = super.applyWithdrawalShared(amount, type, withdrawalAllocation);

    return { ...withdrawn, realizedGains, earningsWithdrawn: 0 };
  }

  protected calculateRebalanceGains(stocksSold: number, bondsSold: number): number {
    const totalSold = stocksSold + bondsSold;
    if (totalSold <= 0) return 0;

    const basisProportion = this.costBasis / this.balance;
    const basisSold = Math.min(totalSold * basisProportion, this.costBasis);

    const realizedGains = totalSold - basisSold;
    this.cumulativeRealizedGains += realizedGains;

    this.costBasis += realizedGains;

    return realizedGains;
  }
}

export class TaxDeferredAccount extends InvestmentAccount {
  readonly taxCategory: TaxCategory = 'taxDeferred';

  constructor(data: AccountInputs & { type: 'ira' | '401k' | '403b' | 'hsa' }) {
    super(data);
  }

  applyContribution(amount: number, type: ContributionType, contributionAllocation: AssetAllocation): AssetTransactions {
    return super.applyContributionShared(amount, type, contributionAllocation);
  }

  applyWithdrawal(
    amount: number,
    type: WithdrawalType,
    withdrawalAllocation: AssetAllocation
  ): AssetTransactions & { realizedGains: number; earningsWithdrawn: number } {
    const withdrawn = super.applyWithdrawalShared(amount, type, withdrawalAllocation);
    return { ...withdrawn, realizedGains: 0, earningsWithdrawn: 0 };
  }
}

export class TaxFreeAccount extends InvestmentAccount {
  readonly taxCategory: TaxCategory = 'taxFree';

  private contributionBasis: number;

  constructor(data: AccountInputs & { type: 'rothIra' | 'roth401k' | 'roth403b' }) {
    super(data);
    this.contributionBasis = data.contributionBasis!;
  }

  getContributionBasis(): number {
    return this.contributionBasis;
  }

  applyContribution(amount: number, type: ContributionType, contributionAllocation: AssetAllocation): AssetTransactions {
    const contributed = super.applyContributionShared(amount, type, contributionAllocation);
    this.contributionBasis += amount;
    return contributed;
  }

  applyWithdrawal(
    amount: number,
    type: WithdrawalType,
    withdrawalAllocation: AssetAllocation
  ): AssetTransactions & { realizedGains: number; earningsWithdrawn: number } {
    const contributionWithdrawn = Math.min(amount, this.contributionBasis);
    this.contributionBasis -= contributionWithdrawn;

    const earningsWithdrawn = amount - contributionWithdrawn;
    this.cumulativeEarningsWithdrawn += earningsWithdrawn;

    const withdrawn = super.applyWithdrawalShared(amount, type, withdrawalAllocation);

    return { ...withdrawn, earningsWithdrawn, realizedGains: 0 };
  }
}
