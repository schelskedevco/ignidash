import type { AccountInputs, InvestmentAccountType } from '@/lib/schemas/account-form-schema';

import type { AssetReturnRates, AssetReturnAmounts, AssetAllocation, AssetYieldRates, AssetYieldAmounts, TaxCategory } from '../asset';

type WithdrawalType = 'rmd' | 'regular';

export interface AccountData {
  totalValue: number;
  totalContributions: number;
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
  withdrawalsForPeriod: number;
  realizedGainsForPeriod: number;
  earningsWithdrawnForPeriod: number;
  rmdsForPeriod: number;
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
    protected totalRmds: number,
    protected totalYields: AssetYieldAmounts
  ) {}

  getTotalValue(): number {
    return this.totalValue;
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

  getHasRMDs(): boolean {
    return this.type === 'ira' || this.type === '401k';
  }

  abstract getAccountData(): AccountData;
  abstract applyReturns(returns: AssetReturnRates): { returnsForPeriod: AssetReturnAmounts; totalReturns: AssetReturnAmounts };
  abstract applyYields(yields: AssetYieldRates): { yieldsForPeriod: AssetYieldAmounts; totalYields: AssetYieldAmounts };
  abstract applyContribution(amount: number): void;
  abstract applyWithdrawal(amount: number, type: WithdrawalType): { realizedGains: number; earningsWithdrawn: number };
}

export class SavingsAccount extends Account {
  constructor(data: AccountInputs) {
    super(data.currentValue, data.name, data.id, data.type, { cash: 0, bonds: 0, stocks: 0 }, 0, 0, 0, 0, 0, {
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
      totalEarningsWithdrawn: this.totalEarningsWithdrawn,
      totalRmds: this.totalRmds,
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

  applyWithdrawal(amount: number, type: WithdrawalType): { realizedGains: number; earningsWithdrawn: number } {
    if (amount > this.totalValue) throw new Error('Insufficient funds for withdrawal');
    if (type === 'rmd') throw new Error('Savings account should not have RMDs');

    this.totalValue -= amount;
    this.totalWithdrawals += amount;

    return { realizedGains: 0, earningsWithdrawn: 0 };
  }
}

export abstract class InvestmentAccount extends Account {
  abstract readonly taxCategory: TaxCategory;

  private initialPercentBonds: number;
  private currPercentBonds: number;

  constructor(data: AccountInputs & { type: InvestmentAccountType }) {
    super(data.currentValue, data.name, data.id, data.type, { cash: 0, bonds: 0, stocks: 0 }, 0, 0, 0, 0, 0, {
      taxable: { dividendYield: 0, bondYield: 0 },
      taxDeferred: { dividendYield: 0, bondYield: 0 },
      taxFree: { dividendYield: 0, bondYield: 0 },
    });
    this.initialPercentBonds = (data.percentBonds ?? 0) / 100;
    this.currPercentBonds = (data.percentBonds ?? 0) / 100;
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
  }

  protected applyWithdrawalShared(amount: number, type: WithdrawalType): void {
    if (amount < 0) throw new Error('Withdrawal amount must be non-negative');
    if (amount === 0) return;
    if (amount > this.totalValue) throw new Error('Insufficient funds for withdrawal');

    const currentBondValue = this.totalValue * this.currPercentBonds;

    const newTotalValue = this.totalValue - amount;
    const targetBondValue = newTotalValue * this.initialPercentBonds;

    let bondWithdrawal = currentBondValue - targetBondValue;
    bondWithdrawal = Math.max(0, Math.min(amount, bondWithdrawal, currentBondValue));

    this.totalValue = newTotalValue;
    this.currPercentBonds = newTotalValue ? (currentBondValue - bondWithdrawal) / newTotalValue : this.initialPercentBonds;

    this.totalWithdrawals += amount;
    if (type === 'rmd') this.totalRmds += amount;
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

  applyContribution(amount: number): void {
    super.applyContribution(amount);
    this.costBasis += amount;
  }

  applyWithdrawal(amount: number, type: WithdrawalType): { realizedGains: number; earningsWithdrawn: number } {
    super.applyWithdrawalShared(amount, type);

    const basisProportion = this.costBasis / this.totalValue;
    const basisWithdrawn = Math.min(amount * basisProportion, this.costBasis);
    this.costBasis -= basisWithdrawn;

    const realizedGains = amount - basisWithdrawn;
    this.totalRealizedGains += realizedGains;

    return { realizedGains, earningsWithdrawn: 0 };
  }
}

export class TaxDeferredAccount extends InvestmentAccount {
  readonly taxCategory: TaxCategory = 'taxDeferred';

  constructor(data: AccountInputs & { type: 'ira' | '401k' | 'hsa' }) {
    super(data);
  }

  applyWithdrawal(amount: number, type: WithdrawalType): { realizedGains: number; earningsWithdrawn: number } {
    super.applyWithdrawalShared(amount, type);
    return { realizedGains: 0, earningsWithdrawn: 0 };
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

  applyContribution(amount: number): void {
    super.applyContribution(amount);
    this.contributionBasis += amount;
  }

  applyWithdrawal(amount: number, type: WithdrawalType): { realizedGains: number; earningsWithdrawn: number } {
    super.applyWithdrawalShared(amount, type);

    const contributionWithdrawn = Math.min(amount, this.contributionBasis);
    this.contributionBasis -= contributionWithdrawn;

    const earningsWithdrawn = amount - contributionWithdrawn;
    this.totalEarningsWithdrawn += earningsWithdrawn;

    return { earningsWithdrawn, realizedGains: 0 };
  }
}
