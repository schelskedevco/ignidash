import type { AccountInputs, InvestmentAccountType } from '@/lib/schemas/inputs/account-form-schema';

import type {
  AssetReturnRates,
  AssetReturnAmounts,
  AssetAllocation,
  AssetValues,
  AssetYieldRates,
  AssetYieldAmounts,
  TaxCategory,
} from './asset';

type WithdrawalType = 'rmd' | 'regular';
type ContributionType = 'self' | 'employer';

export interface AccountData {
  balance: number;
  totalContributions: number;
  totalEmployerMatch: number;
  totalWithdrawals: number;
  totalRealizedGains: number;
  totalEarningsWithdrawn: number;
  totalRmds: number;
  name: string;
  id: string;
  type: AccountInputs['type'];
  assetAllocation: AssetAllocation;
}

export interface AccountDataWithTransactions extends AccountData {
  contributionsForPeriod: number;
  employerMatchForPeriod: number;
  withdrawalsForPeriod: number;
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
    protected totalReturns: AssetReturnAmounts,
    protected totalContributions: number,
    protected totalEmployerMatch: number,
    protected totalWithdrawals: number,
    protected totalRealizedGains: number,
    protected totalEarningsWithdrawn: number,
    protected totalRmds: number,
    protected totalYields: AssetYieldAmounts
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

  getTotalReturns(): AssetReturnAmounts {
    return this.totalReturns;
  }

  getTotalContributions(): number {
    return this.totalContributions;
  }

  getTotalEmployerMatch(): number {
    return this.totalEmployerMatch;
  }

  getTotalWithdrawals(): number {
    return this.totalWithdrawals;
  }

  getTotalRealizedGains(): number {
    return this.totalRealizedGains;
  }

  getTotalEarningsWithdrawn(): number {
    return this.totalEarningsWithdrawn;
  }

  getTotalRmds(): number {
    return this.totalRmds;
  }

  getTotalYields(): AssetYieldAmounts {
    return this.totalYields;
  }

  abstract getHasRMDs(): boolean;
  abstract getAccountData(): AccountData;
  abstract applyReturns(returns: AssetReturnRates): { returnsForPeriod: AssetReturnAmounts; totalReturns: AssetReturnAmounts };
  abstract applyYields(yields: AssetYieldRates): { yieldsForPeriod: AssetYieldAmounts; totalYields: AssetYieldAmounts };
  abstract applyContribution(amount: number, type: ContributionType, contributionAllocation: AssetAllocation): AssetValues;
  abstract applyWithdrawal(
    amount: number,
    type: WithdrawalType,
    withdrawalAllocation: AssetAllocation
  ): AssetValues & { realizedGains: number; earningsWithdrawn: number };
}

export class SavingsAccount extends Account {
  readonly taxCategory: TaxCategory = 'cashSavings';

  constructor(data: AccountInputs) {
    super(data.balance, data.name, data.id, data.type, { cash: 0, bonds: 0, stocks: 0 }, 0, 0, 0, 0, 0, 0, {
      stocks: 0,
      bonds: 0,
      cash: 0,
    });
  }

  getHasRMDs(): boolean {
    return false;
  }

  getAccountData(): AccountData {
    const assetAllocation: AssetAllocation = {
      cash: 1,
      bonds: 0,
      stocks: 0,
    };

    return {
      balance: this.balance,
      totalWithdrawals: this.totalWithdrawals,
      totalContributions: this.totalContributions,
      totalEmployerMatch: this.totalEmployerMatch,
      totalRealizedGains: this.totalRealizedGains,
      totalEarningsWithdrawn: this.totalEarningsWithdrawn,
      totalRmds: this.totalRmds,
      name: this.name,
      id: this.id,
      type: this.type,
      assetAllocation,
    };
  }

  applyReturns(returns: AssetReturnRates): { returnsForPeriod: AssetReturnAmounts; totalReturns: AssetReturnAmounts } {
    const cashReturnsAmount = this.balance * returns.cash;

    this.balance += cashReturnsAmount;
    this.totalReturns.cash += cashReturnsAmount;

    return { returnsForPeriod: { cash: cashReturnsAmount, bonds: 0, stocks: 0 }, totalReturns: { ...this.totalReturns } };
  }

  applyYields(yields: AssetYieldRates): { yieldsForPeriod: AssetYieldAmounts; totalYields: AssetYieldAmounts } {
    const { cash: cashYield } = yields;

    const cashYieldAmount = this.balance * cashYield;
    this.totalYields.cash += cashYieldAmount;

    return {
      yieldsForPeriod: { cash: cashYieldAmount, bonds: 0, stocks: 0 },
      totalYields: { ...this.totalYields },
    };
  }

  applyContribution(amount: number, type: ContributionType, contributionAllocation: AssetAllocation): AssetValues {
    this.balance += amount;
    this.totalContributions += amount;
    if (type === 'employer') this.totalEmployerMatch += amount;

    return { stocks: 0, bonds: 0, cash: amount };
  }

  applyWithdrawal(
    amount: number,
    type: WithdrawalType,
    withdrawalAllocation: AssetAllocation
  ): AssetValues & { realizedGains: number; earningsWithdrawn: number } {
    if (amount > this.balance) throw new Error('Insufficient funds for withdrawal');
    if (type === 'rmd') throw new Error('Savings account should not have RMDs');

    this.balance -= amount;
    this.totalWithdrawals += amount;

    return { stocks: 0, bonds: 0, cash: amount, realizedGains: 0, earningsWithdrawn: 0 };
  }
}

export abstract class InvestmentAccount extends Account {
  private currPercentBonds: number;

  constructor(data: AccountInputs & { type: InvestmentAccountType }) {
    super(data.balance, data.name, data.id, data.type, { cash: 0, bonds: 0, stocks: 0 }, 0, 0, 0, 0, 0, 0, {
      stocks: 0,
      bonds: 0,
      cash: 0,
    });
    this.currPercentBonds = data.percentBonds / 100;
  }

  getHasRMDs(): boolean {
    return this.type === 'ira' || this.type === '401k';
  }

  getAccountData(): AccountData {
    const assetAllocation: AssetAllocation = {
      cash: 0,
      bonds: this.currPercentBonds,
      stocks: 1 - this.currPercentBonds,
    };

    return {
      balance: this.balance,
      totalWithdrawals: this.totalWithdrawals,
      totalContributions: this.totalContributions,
      totalEmployerMatch: this.totalEmployerMatch,
      totalRealizedGains: this.totalRealizedGains,
      totalEarningsWithdrawn: this.totalEarningsWithdrawn,
      totalRmds: this.totalRmds,
      name: this.name,
      id: this.id,
      type: this.type,
      assetAllocation,
    };
  }

  applyReturns(returns: AssetReturnRates): { returnsForPeriod: AssetReturnAmounts; totalReturns: AssetReturnAmounts } {
    const bondsPercent = this.currPercentBonds;
    const stocksPercent = 1 - bondsPercent;

    const currentBondsValue = this.balance * bondsPercent;
    const currentStocksValue = this.balance * stocksPercent;

    const bondReturnsAmount = currentBondsValue * returns.bonds;
    this.totalReturns.bonds += bondReturnsAmount;
    const newBondsValue = currentBondsValue + bondReturnsAmount;

    const stockReturnsAmount = currentStocksValue * returns.stocks;
    this.totalReturns.stocks += stockReturnsAmount;
    const newStocksValue = currentStocksValue + stockReturnsAmount;

    this.balance = newBondsValue + newStocksValue;
    this.currPercentBonds = this.balance ? newBondsValue / this.balance : this.currPercentBonds;

    return { returnsForPeriod: { cash: 0, bonds: bondReturnsAmount, stocks: stockReturnsAmount }, totalReturns: { ...this.totalReturns } };
  }

  applyYields(yields: AssetYieldRates): { yieldsForPeriod: AssetYieldAmounts; totalYields: AssetYieldAmounts } {
    const { stocks: dividendYield, bonds: bondYield } = yields;

    const bondsPercent = this.currPercentBonds;
    const stocksPercent = 1 - bondsPercent;

    const currentBondsValue = this.balance * bondsPercent;
    const currentStocksValue = this.balance * stocksPercent;

    const bondYieldAmount = currentBondsValue * bondYield;
    const dividendYieldAmount = currentStocksValue * dividendYield;

    this.totalYields.bonds += bondYieldAmount;
    this.totalYields.stocks += dividendYieldAmount;

    return {
      yieldsForPeriod: { bonds: bondYieldAmount, stocks: dividendYieldAmount, cash: 0 },
      totalYields: { ...this.totalYields },
    };
  }

  protected applyContributionShared(amount: number, type: ContributionType, contributionAllocation: AssetAllocation): AssetValues {
    if (amount < 0) throw new Error('Contribution amount must be non-negative');
    if (amount === 0) return { stocks: 0, bonds: 0, cash: 0 };

    const currentBondsValue = this.balance * this.currPercentBonds;
    const currentStocksValue = this.balance * (1 - this.currPercentBonds);

    const stockBondAllocationTotal = contributionAllocation.stocks + contributionAllocation.bonds;
    const bondAllocationPercent =
      stockBondAllocationTotal > 0 ? contributionAllocation.bonds / stockBondAllocationTotal : this.currPercentBonds;

    const bondContribution = amount * bondAllocationPercent;
    const stockContribution = amount * (1 - bondAllocationPercent);

    const newBondsValue = currentBondsValue + bondContribution;
    const newStocksValue = currentStocksValue + stockContribution;
    const newBalance = newBondsValue + newStocksValue;

    this.balance = newBalance;
    this.currPercentBonds = newBalance > 0 ? newBondsValue / newBalance : this.currPercentBonds;

    this.totalContributions += amount;
    if (type === 'employer') this.totalEmployerMatch += amount;

    return { stocks: stockContribution, bonds: bondContribution, cash: 0 };
  }

  protected applyWithdrawalShared(amount: number, type: WithdrawalType, withdrawalAllocation: AssetAllocation): AssetValues {
    if (amount < 0) throw new Error('Withdrawal amount must be non-negative');
    if (amount === 0) return { stocks: 0, bonds: 0, cash: 0 };
    if (amount > this.balance) throw new Error('Insufficient funds for withdrawal');

    const currentBondsValue = this.balance * this.currPercentBonds;
    const currentStocksValue = this.balance * (1 - this.currPercentBonds);

    const stockBondAllocationTotal = withdrawalAllocation.stocks + withdrawalAllocation.bonds;
    const bondAllocationPercent =
      stockBondAllocationTotal > 0 ? withdrawalAllocation.bonds / stockBondAllocationTotal : this.currPercentBonds;

    const targetBondWithdrawal = Math.min(amount * bondAllocationPercent, currentBondsValue);
    const bondWithdrawal = Math.max(targetBondWithdrawal, amount - currentStocksValue);
    const stockWithdrawal = amount - bondWithdrawal;

    const newBondsValue = currentBondsValue - bondWithdrawal;
    const newStocksValue = currentStocksValue - stockWithdrawal;
    const newBalance = newBondsValue + newStocksValue;

    this.balance = newBalance;
    this.currPercentBonds = newBalance > 0 ? newBondsValue / newBalance : this.currPercentBonds;

    this.totalWithdrawals += amount;
    if (type === 'rmd') this.totalRmds += amount;

    return { stocks: stockWithdrawal, bonds: bondWithdrawal, cash: 0 };
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

  applyContribution(amount: number, type: ContributionType, contributionAllocation: AssetAllocation): AssetValues {
    const { stocks, bonds, cash } = super.applyContributionShared(amount, type, contributionAllocation);
    this.costBasis += amount;
    return { stocks, bonds, cash };
  }

  applyWithdrawal(
    amount: number,
    type: WithdrawalType,
    withdrawalAllocation: AssetAllocation
  ): AssetValues & { realizedGains: number; earningsWithdrawn: number } {
    const basisProportion = this.costBasis / this.balance;
    const basisWithdrawn = Math.min(amount * basisProportion, this.costBasis);
    this.costBasis -= basisWithdrawn;

    const realizedGains = amount - basisWithdrawn;
    this.totalRealizedGains += realizedGains;

    const { stocks, bonds, cash } = super.applyWithdrawalShared(amount, type, withdrawalAllocation);

    return { stocks, bonds, cash, realizedGains, earningsWithdrawn: 0 };
  }
}

export class TaxDeferredAccount extends InvestmentAccount {
  readonly taxCategory: TaxCategory = 'taxDeferred';

  constructor(data: AccountInputs & { type: 'ira' | '401k' | 'hsa' }) {
    super(data);
  }

  applyContribution(amount: number, type: ContributionType, contributionAllocation: AssetAllocation): AssetValues {
    return super.applyContributionShared(amount, type, contributionAllocation);
  }

  applyWithdrawal(
    amount: number,
    type: WithdrawalType,
    withdrawalAllocation: AssetAllocation
  ): AssetValues & { realizedGains: number; earningsWithdrawn: number } {
    const { stocks, bonds, cash } = super.applyWithdrawalShared(amount, type, withdrawalAllocation);
    return { stocks, bonds, cash, realizedGains: 0, earningsWithdrawn: 0 };
  }
}

export class TaxFreeAccount extends InvestmentAccount {
  readonly taxCategory: TaxCategory = 'taxFree';

  private contributionBasis: number;

  constructor(data: AccountInputs & { type: 'rothIra' | 'roth401k' }) {
    super(data);
    this.contributionBasis = data.contributionBasis!;
  }

  getContributionBasis(): number {
    return this.contributionBasis;
  }

  applyContribution(amount: number, type: ContributionType, contributionAllocation: AssetAllocation): AssetValues {
    const { stocks, bonds, cash } = super.applyContributionShared(amount, type, contributionAllocation);
    this.contributionBasis += amount;
    return { stocks, bonds, cash };
  }

  applyWithdrawal(
    amount: number,
    type: WithdrawalType,
    withdrawalAllocation: AssetAllocation
  ): AssetValues & { realizedGains: number; earningsWithdrawn: number } {
    const contributionWithdrawn = Math.min(amount, this.contributionBasis);
    this.contributionBasis -= contributionWithdrawn;

    const earningsWithdrawn = amount - contributionWithdrawn;
    this.totalEarningsWithdrawn += earningsWithdrawn;

    const { stocks, bonds, cash } = super.applyWithdrawalShared(amount, type, withdrawalAllocation);

    return { stocks, bonds, cash, earningsWithdrawn, realizedGains: 0 };
  }
}
