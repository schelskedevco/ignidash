import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import type { GlidePathInputs } from '@/lib/schemas/inputs/glide-path-schema';

import {
  type Account,
  SavingsAccount,
  TaxableBrokerageAccount,
  TaxDeferredAccount,
  TaxFreeAccount,
  type AccountDataWithTransactions,
} from './account';
import type { SimulationState, SimulationContext } from './simulation-engine';
import type {
  AssetReturnRates,
  AssetReturnAmounts,
  AssetAllocation,
  AssetValues,
  AssetYieldRates,
  AssetYieldAmounts,
  TaxCategory,
} from './asset';
import { ContributionRules } from './contribution-rules';
import type { IncomesData } from './incomes';
import type { ExpensesData } from './expenses';
import type { AccountDataWithReturns } from './returns';
import { uniformLifetimeMap } from './historical-data/rmds-table';

type TransactionsBreakdown = { totalForPeriod: number; byAccount: Record<string, number> };

type WithdrawalModifier = 'contributionsOnly';

interface WithdrawalOrderItem {
  accountType: AccountInputs['type'];
  modifier?: WithdrawalModifier;
}

const EXTRA_SAVINGS_ACCOUNT_ID = '54593a0d-7b4f-489d-a5bd-42500afba532';
const RMD_SAVINGS_ACCOUNT_ID = 'd7288042-1f83-4e50-9a6a-b1ef7a6191cc';
const DEFAULT_ASSET_ALLOCATION = { stocks: 0.6, bonds: 0.4, cash: 0 };

export class PortfolioProcessor {
  private initialAssetAllocation: AssetAllocation | null;
  private extraSavingsAccount: SavingsAccount;
  private rmdSavingsAccount: SavingsAccount;
  private monthlyData: PortfolioData[] = [];
  private totalShortfall: number = 0;

  constructor(
    private simulationState: SimulationState,
    private simulationContext: SimulationContext,
    private contributionRules: ContributionRules,
    private glidePath?: GlidePathInputs
  ) {
    this.initialAssetAllocation = this.simulationState.portfolio.getWeightedAssetAllocation();
    this.extraSavingsAccount = new SavingsAccount({
      type: 'savings' as const,
      id: EXTRA_SAVINGS_ACCOUNT_ID,
      name: 'Extra Savings',
      balance: 0,
    });
    this.rmdSavingsAccount = new SavingsAccount({
      type: 'savings' as const,
      id: RMD_SAVINGS_ACCOUNT_ID,
      name: 'RMD Savings',
      balance: 0,
    });
  }

  processCashFlows(incomesData: IncomesData, expensesData: ExpensesData): { portfolioData: PortfolioData; discretionaryExpense: number } {
    const grossCashFlow = incomesData.totalIncomeAfterPayrollDeductions - expensesData.totalExpenses;

    const {
      totalForPeriod: contributionsForPeriod,
      byAccount: contributionsByAccount,
      discretionaryExpense,
      employerMatchForPeriod,
      employerMatchByAccount,
    } = this.processContributions(grossCashFlow, incomesData);

    const {
      totalForPeriod: withdrawalsForPeriod,
      byAccount: withdrawalsByAccount,
      realizedGainsForPeriod,
      realizedGainsByAccount,
      earningsWithdrawnForPeriod,
      earningsWithdrawnByAccount,
      shortfallForPeriod,
    } = this.processWithdrawals(grossCashFlow);

    const perAccountData: Record<string, AccountDataWithTransactions> = this.buildPerAccountData(
      {}, // baseAccountData
      contributionsByAccount,
      employerMatchByAccount,
      withdrawalsByAccount,
      realizedGainsByAccount,
      earningsWithdrawnByAccount,
      {} // rmdsByAccount
    );

    const portfolioData = this.buildPortfolioData(
      {
        withdrawalsForPeriod,
        contributionsForPeriod,
        employerMatchForPeriod,
        realizedGainsForPeriod,
        earningsWithdrawnForPeriod,
        rmdsForPeriod: 0,
        shortfallForPeriod,
      },
      perAccountData
    );

    this.monthlyData.push(portfolioData);
    return { portfolioData, discretionaryExpense };
  }

  processTaxes(
    annualPortfolioDataBeforeTaxes: PortfolioData,
    taxesData: { totalTaxesDue: number; totalTaxesRefund: number }
  ): { portfolioData: PortfolioData; discretionaryExpense: number } {
    const perAccountDataBeforeTaxes = annualPortfolioDataBeforeTaxes.perAccountData;

    let withdrawalsForPeriod = annualPortfolioDataBeforeTaxes.withdrawalsForPeriod;
    let contributionsForPeriod = annualPortfolioDataBeforeTaxes.contributionsForPeriod;
    let employerMatchForPeriod = annualPortfolioDataBeforeTaxes.employerMatchForPeriod;
    let realizedGainsForPeriod = annualPortfolioDataBeforeTaxes.realizedGainsForPeriod;
    let earningsWithdrawnForPeriod = annualPortfolioDataBeforeTaxes.earningsWithdrawnForPeriod;
    const rmdsForPeriod = annualPortfolioDataBeforeTaxes.rmdsForPeriod;
    let shortfallForPeriod = annualPortfolioDataBeforeTaxes.shortfallForPeriod;

    let contributionsByAccount: Record<string, number> = {};
    let employerMatchByAccount: Record<string, number> = {};
    let withdrawalsByAccount: Record<string, number> = {};
    let realizedGainsByAccount: Record<string, number> = {};
    let earningsWithdrawnByAccount: Record<string, number> = {};

    // Account for annual shortfall before processing tax refund
    const taxesRefundAfterShortfall = Math.max(0, taxesData.totalTaxesRefund - shortfallForPeriod);

    let discretionaryExpense = 0;
    if (taxesRefundAfterShortfall > 0) {
      const res = this.processContributions(taxesRefundAfterShortfall);
      contributionsForPeriod += res.totalForPeriod;
      contributionsByAccount = res.byAccount;
      discretionaryExpense += res.discretionaryExpense;
      employerMatchForPeriod += res.employerMatchForPeriod;
      employerMatchByAccount = res.employerMatchByAccount;
    }

    if (taxesData.totalTaxesDue > 0) {
      const res = this.processWithdrawals(-taxesData.totalTaxesDue);
      withdrawalsForPeriod += res.totalForPeriod;
      withdrawalsByAccount = res.byAccount;
      realizedGainsForPeriod += res.realizedGainsForPeriod;
      realizedGainsByAccount = res.realizedGainsByAccount;
      earningsWithdrawnForPeriod += res.earningsWithdrawnForPeriod;
      earningsWithdrawnByAccount = res.earningsWithdrawnByAccount;
      shortfallForPeriod += res.shortfallForPeriod;
    }

    const perAccountData: Record<string, AccountDataWithTransactions> = this.buildPerAccountData(
      perAccountDataBeforeTaxes,
      contributionsByAccount,
      employerMatchByAccount,
      withdrawalsByAccount,
      realizedGainsByAccount,
      earningsWithdrawnByAccount,
      {} // rmdsByAccount
    );

    const portfolioData = this.buildPortfolioData(
      {
        withdrawalsForPeriod,
        contributionsForPeriod,
        employerMatchForPeriod,
        realizedGainsForPeriod,
        earningsWithdrawnForPeriod,
        rmdsForPeriod,
        shortfallForPeriod,
      },
      perAccountData
    );

    return { portfolioData, discretionaryExpense };
  }

  private processContributions(
    grossCashFlow: number,
    incomesData?: IncomesData
  ): TransactionsBreakdown & {
    discretionaryExpense: number;
    employerMatchForPeriod: number;
    employerMatchByAccount: Record<string, number>;
  } {
    const byAccount: Record<string, number> = {};
    const employerMatchByAccount: Record<string, number> = {};
    if (!(grossCashFlow > 0)) {
      return { totalForPeriod: 0, byAccount, discretionaryExpense: 0, employerMatchForPeriod: 0, employerMatchByAccount };
    }

    const age = this.simulationState.time.age;
    const contributionRules = this.contributionRules.getRules().sort((a, b) => a.getRank() - b.getRank());

    let employerMatchForPeriod = 0;

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

      const { contributionAmount, employerMatchAmount } = rule.getContributionAmount(
        remainingToContribute,
        contributeToAccount,
        this.monthlyData,
        age,
        incomesData
      );
      if (contributionAmount <= 0) {
        currentRuleIndex++;
        continue;
      }

      const contributionAllocation = this.getAllocationForContribution(contributionAmount + employerMatchAmount);
      contributeToAccount.applyContribution(contributionAmount, 'self', contributionAllocation);
      byAccount[contributeToAccountID] = contributionAmount + employerMatchAmount;

      if (employerMatchAmount > 0) contributeToAccount.applyContribution(employerMatchAmount, 'employer', contributionAllocation);
      employerMatchByAccount[contributeToAccountID] = employerMatchAmount;
      employerMatchForPeriod += employerMatchAmount;

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

          const contributionAllocation = this.getAllocationForContribution(remainingToContribute);
          this.extraSavingsAccount.applyContribution(remainingToContribute, 'self', contributionAllocation);
          byAccount[this.extraSavingsAccount.getAccountID()] =
            (byAccount[this.extraSavingsAccount.getAccountID()] || 0) + remainingToContribute;

          remainingToContribute = 0;
          break;
      }
    }

    const totalForPeriod = grossCashFlow - remainingToContribute + employerMatchForPeriod;

    return { totalForPeriod, byAccount, discretionaryExpense, employerMatchForPeriod, employerMatchByAccount };
  }

  private processWithdrawals(grossCashFlow: number): TransactionsBreakdown & {
    realizedGainsForPeriod: number;
    realizedGainsByAccount: Record<string, number>;
    earningsWithdrawnForPeriod: number;
    earningsWithdrawnByAccount: Record<string, number>;
    shortfallForPeriod: number;
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
        shortfallForPeriod: 0,
      };
    }

    let realizedGainsForPeriod = 0;
    let earningsWithdrawnForPeriod = 0;

    const withdrawalOrder = this.getWithdrawalOrder();
    let remainingToWithdraw = Math.abs(grossCashFlow);

    for (const { accountType, modifier } of withdrawalOrder) {
      if (remainingToWithdraw <= 0) break;

      const accountsOfType = this.simulationState.portfolio.getAccounts().filter((account) => account.getAccountType() === accountType);
      if (accountsOfType.length === 0) continue;

      for (const account of accountsOfType) {
        if (remainingToWithdraw <= 0) break;
        if (!(account.getBalance() > 0)) continue;

        let maxWithdrawable = account.getBalance();
        if (modifier === 'contributionsOnly' && account instanceof TaxFreeAccount) {
          maxWithdrawable = Math.min(maxWithdrawable, account.getContributionBasis());
        }

        const withdrawFromThisAccount = Math.min(remainingToWithdraw, maxWithdrawable);

        const withdrawalAllocation = this.getAllocationForWithdrawal(withdrawFromThisAccount);
        const { realizedGains, earningsWithdrawn } = account.applyWithdrawal(withdrawFromThisAccount, 'regular', withdrawalAllocation);
        realizedGainsByAccount[account.getAccountID()] = realizedGains;
        realizedGainsForPeriod += realizedGains;
        earningsWithdrawnByAccount[account.getAccountID()] = earningsWithdrawn;
        earningsWithdrawnForPeriod += earningsWithdrawn;

        byAccount[account.getAccountID()] = withdrawFromThisAccount;
        remainingToWithdraw -= withdrawFromThisAccount;
      }
    }

    const totalForPeriod = Math.abs(grossCashFlow) - remainingToWithdraw;

    const shortfallForPeriod = remainingToWithdraw;
    this.totalShortfall += shortfallForPeriod;

    return {
      totalForPeriod,
      byAccount,
      realizedGainsForPeriod,
      realizedGainsByAccount,
      earningsWithdrawnForPeriod,
      earningsWithdrawnByAccount,
      shortfallForPeriod,
    };
  }

  processRequiredMinimumDistributions(): PortfolioData {
    const age = this.simulationState.time.age;
    if (age < 73) throw new Error('RMDs should not be processed for ages under 73');

    const withdrawalsByAccount: Record<string, number> = {};
    const rmdsByAccount: Record<string, number> = {};

    const realizedGainsByAccount: Record<string, number> = {};
    const earningsWithdrawnByAccount: Record<string, number> = {};

    let totalForPeriod = 0;
    let realizedGainsForPeriod = 0;
    let earningsWithdrawnForPeriod = 0;

    const accountsWithRMDs = this.simulationState.portfolio.getAccounts().filter((account) => account.getHasRMDs());
    for (const account of accountsWithRMDs) {
      if (!(account.getBalance() > 0)) continue;

      const lookupAge = Math.min(Math.floor(age), 120);
      const rmdAmount = account.getBalance() / uniformLifetimeMap[lookupAge];

      const withdrawalAllocation = this.getAllocationForWithdrawal(rmdAmount);
      const { realizedGains, earningsWithdrawn } = account.applyWithdrawal(rmdAmount, 'rmd', withdrawalAllocation);
      realizedGainsByAccount[account.getAccountID()] = realizedGains;
      realizedGainsForPeriod += realizedGains;
      earningsWithdrawnByAccount[account.getAccountID()] = earningsWithdrawn;
      earningsWithdrawnForPeriod += earningsWithdrawn;

      withdrawalsByAccount[account.getAccountID()] = rmdAmount;
      rmdsByAccount[account.getAccountID()] = rmdAmount;
      totalForPeriod += rmdAmount;
    }

    const contributionsByAccount: Record<string, number> = {};

    const portfolioHasRmdSavingsAccount = this.simulationState.portfolio
      .getAccounts()
      .some((account) => account.getAccountID() === this.rmdSavingsAccount.getAccountID());
    if (!portfolioHasRmdSavingsAccount && totalForPeriod > 0) {
      this.simulationState.portfolio.addRmdSavingsAccount(this.rmdSavingsAccount);
    }

    const contributionAllocation = this.getAllocationForContribution(totalForPeriod);
    this.rmdSavingsAccount.applyContribution(totalForPeriod, 'self', contributionAllocation);
    contributionsByAccount[this.rmdSavingsAccount.getAccountID()] =
      (contributionsByAccount[this.rmdSavingsAccount.getAccountID()] || 0) + totalForPeriod;

    const perAccountData: Record<string, AccountDataWithTransactions> = this.buildPerAccountData(
      {}, // baseAccountData
      contributionsByAccount,
      {}, // employerMatchByAccount
      withdrawalsByAccount,
      realizedGainsByAccount,
      earningsWithdrawnByAccount,
      rmdsByAccount
    );

    const portfolioData = this.buildPortfolioData(
      {
        withdrawalsForPeriod: totalForPeriod,
        employerMatchForPeriod: 0,
        contributionsForPeriod: totalForPeriod,
        realizedGainsForPeriod,
        earningsWithdrawnForPeriod,
        rmdsForPeriod: totalForPeriod,
        shortfallForPeriod: 0,
      },
      perAccountData
    );

    this.monthlyData.push(portfolioData);
    return portfolioData;
  }

  private buildPerAccountData(
    baseAccountData: Record<string, AccountDataWithTransactions>,
    contributionsByAccount: Record<string, number>,
    employerMatchByAccount: Record<string, number>,
    withdrawalsByAccount: Record<string, number>,
    realizedGainsByAccount: Record<string, number>,
    earningsWithdrawnByAccount: Record<string, number>,
    rmdsByAccount: Record<string, number>
  ): Record<string, AccountDataWithTransactions> {
    const addToBase = (accountID: string, field: keyof AccountDataWithTransactions, value: number) => {
      return ((baseAccountData[accountID]?.[field] as number) || 0) + value;
    };

    return Object.fromEntries(
      this.simulationState.portfolio.getAccounts().map((account) => {
        const accountID = account.getAccountID();
        const accountData = account.getAccountData();

        return [
          accountID,
          {
            ...accountData,
            contributionsForPeriod: addToBase(accountID, 'contributionsForPeriod', contributionsByAccount[accountID] || 0),
            employerMatchForPeriod: addToBase(accountID, 'employerMatchForPeriod', employerMatchByAccount[accountID] || 0),
            withdrawalsForPeriod: addToBase(accountID, 'withdrawalsForPeriod', withdrawalsByAccount[accountID] || 0),
            realizedGainsForPeriod: addToBase(accountID, 'realizedGainsForPeriod', realizedGainsByAccount[accountID] || 0),
            earningsWithdrawnForPeriod: addToBase(accountID, 'earningsWithdrawnForPeriod', earningsWithdrawnByAccount[accountID] || 0),
            rmdsForPeriod: addToBase(accountID, 'rmdsForPeriod', rmdsByAccount[accountID] || 0),
          },
        ];
      })
    );
  }

  private buildPortfolioData(
    forPeriodData: {
      withdrawalsForPeriod: number;
      contributionsForPeriod: number;
      employerMatchForPeriod: number;
      realizedGainsForPeriod: number;
      earningsWithdrawnForPeriod: number;
      rmdsForPeriod: number;
      shortfallForPeriod: number;
    },
    perAccountData: Record<string, AccountDataWithTransactions>
  ): PortfolioData {
    return {
      totalValue: this.simulationState.portfolio.getTotalValue(),
      totalWithdrawals: this.simulationState.portfolio.getTotalWithdrawals(),
      totalContributions: this.simulationState.portfolio.getTotalContributions(),
      totalEmployerMatch: this.simulationState.portfolio.getTotalEmployerMatch(),
      totalRealizedGains: this.simulationState.portfolio.getTotalRealizedGains(),
      totalEarningsWithdrawn: this.simulationState.portfolio.getTotalEarningsWithdrawn(),
      totalRmds: this.simulationState.portfolio.getTotalRmds(),
      totalShortfall: this.totalShortfall,
      ...forPeriodData,
      perAccountData,
      assetAllocation: this.simulationState.portfolio.getWeightedAssetAllocation(),
    };
  }

  private getWithdrawalOrder(): Array<WithdrawalOrderItem> {
    const age = this.simulationState.time.age;
    const regularQualifiedWithdrawalAge = 59.5;

    if (age < regularQualifiedWithdrawalAge) {
      return [
        { accountType: 'savings' },
        { accountType: 'taxableBrokerage' },
        { accountType: 'roth401k', modifier: 'contributionsOnly' },
        { accountType: 'rothIra', modifier: 'contributionsOnly' },
        { accountType: '401k' },
        { accountType: 'ira' },
        { accountType: 'roth401k' },
        { accountType: 'rothIra' },
        { accountType: 'hsa' },
      ];
    } else {
      return [
        { accountType: 'savings' },
        { accountType: '401k' },
        { accountType: 'ira' },
        { accountType: 'taxableBrokerage' },
        { accountType: 'roth401k' },
        { accountType: 'rothIra' },
        { accountType: 'hsa' },
      ];
    }
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
          acc.employerMatchForPeriod += curr.employerMatchForPeriod;
          acc.withdrawalsForPeriod += curr.withdrawalsForPeriod;
          acc.realizedGainsForPeriod += curr.realizedGainsForPeriod;
          acc.earningsWithdrawnForPeriod += curr.earningsWithdrawnForPeriod;
          acc.rmdsForPeriod += curr.rmdsForPeriod;
          acc.shortfallForPeriod += curr.shortfallForPeriod;

          Object.entries(curr.perAccountData).forEach(([accountID, accountData]) => {
            acc.perAccountData[accountID] = {
              ...accountData,
              contributionsForPeriod: (acc.perAccountData[accountID]?.contributionsForPeriod ?? 0) + accountData.contributionsForPeriod,
              employerMatchForPeriod: (acc.perAccountData[accountID]?.employerMatchForPeriod ?? 0) + accountData.employerMatchForPeriod,
              withdrawalsForPeriod: (acc.perAccountData[accountID]?.withdrawalsForPeriod ?? 0) + accountData.withdrawalsForPeriod,
              realizedGainsForPeriod: (acc.perAccountData[accountID]?.realizedGainsForPeriod ?? 0) + accountData.realizedGainsForPeriod,
              earningsWithdrawnForPeriod:
                (acc.perAccountData[accountID]?.earningsWithdrawnForPeriod ?? 0) + accountData.earningsWithdrawnForPeriod,
              rmdsForPeriod: (acc.perAccountData[accountID]?.rmdsForPeriod ?? 0) + accountData.rmdsForPeriod,
            };
          });

          return acc;
        },
        {
          contributionsForPeriod: 0,
          employerMatchForPeriod: 0,
          withdrawalsForPeriod: 0,
          realizedGainsForPeriod: 0,
          earningsWithdrawnForPeriod: 0,
          rmdsForPeriod: 0,
          shortfallForPeriod: 0,
          perAccountData: {} as Record<string, AccountDataWithTransactions>,
        }
      ),
    };
  }

  processRebalance(): void {}

  private getTargetAssetAllocation(): AssetAllocation {
    if (!this.initialAssetAllocation) console.warn('No initial asset allocation available; using default 60/40');

    const startAllocation = this.initialAssetAllocation ?? DEFAULT_ASSET_ALLOCATION;
    if (!this.glidePath) return startAllocation;

    const targetAllocation: AssetAllocation = {
      stocks: this.glidePath.targetStockAllocation / 100,
      bonds: this.glidePath.targetBondAllocation / 100,
      cash: this.glidePath.targetCashAllocation / 100,
    };

    let progress: number;

    switch (this.glidePath.endTimePoint.type) {
      case 'customAge': {
        const startAge = this.simulationContext.startAge;
        const endAge = this.glidePath.endTimePoint.age!;
        const currentAge = this.simulationState.time.age;

        const totalSpan = endAge - startAge;
        if (totalSpan <= 0) return targetAllocation;

        progress = (currentAge - startAge) / totalSpan;
        break;
      }
      case 'customDate': {
        const startDate = this.simulationContext.startDate;
        const endDate = new Date(this.glidePath.endTimePoint.year!, this.glidePath.endTimePoint.month! - 1, 1);
        const currentDate = this.simulationState.time.date;

        const totalSpan = endDate.getTime() - startDate.getTime();
        if (totalSpan <= 0) return targetAllocation;

        progress = (currentDate.getTime() - startDate.getTime()) / totalSpan;
        break;
      }
    }

    progress = Math.max(0, Math.min(1, progress));

    return {
      stocks: startAllocation.stocks + (targetAllocation.stocks - startAllocation.stocks) * progress,
      bonds: startAllocation.bonds + (targetAllocation.bonds - startAllocation.bonds) * progress,
      cash: startAllocation.cash + (targetAllocation.cash - startAllocation.cash) * progress,
    };
  }

  private getAllocationForContribution(contributionAmount: number): AssetAllocation {
    const targetAllocation = this.getTargetAssetAllocation();
    const { stocks: currStocksValue, bonds: currBondsValue, cash: currCashValue } = this.simulationState.portfolio.getCurrentAssetValues();
    const currTotalValue = this.simulationState.portfolio.getTotalValue();
    const newTotalValue = currTotalValue + contributionAmount;

    const targetStocksValue = newTotalValue * targetAllocation.stocks;
    const targetBondsValue = newTotalValue * targetAllocation.bonds;
    const targetCashValue = newTotalValue * targetAllocation.cash;

    const stocksNeeded = Math.max(0, targetStocksValue - currStocksValue);
    const bondsNeeded = Math.max(0, targetBondsValue - currBondsValue);
    const cashNeeded = Math.max(0, targetCashValue - currCashValue);
    const totalNeeded = stocksNeeded + bondsNeeded + cashNeeded;

    if (totalNeeded <= 0) return targetAllocation;

    return {
      stocks: stocksNeeded / totalNeeded,
      bonds: bondsNeeded / totalNeeded,
      cash: cashNeeded / totalNeeded,
    };
  }

  private getAllocationForWithdrawal(withdrawalAmount: number): AssetAllocation {
    const targetAllocation = this.getTargetAssetAllocation();
    const { stocks: currStocksValue, bonds: currBondsValue, cash: currCashValue } = this.simulationState.portfolio.getCurrentAssetValues();
    const currTotalValue = this.simulationState.portfolio.getTotalValue();
    const newTotalValue = Math.max(0, currTotalValue - withdrawalAmount);

    const targetStocksValue = newTotalValue * targetAllocation.stocks;
    const targetBondsValue = newTotalValue * targetAllocation.bonds;
    const targetCashValue = newTotalValue * targetAllocation.cash;

    const stocksExcess = Math.max(0, currStocksValue - targetStocksValue);
    const bondsExcess = Math.max(0, currBondsValue - targetBondsValue);
    const cashExcess = Math.max(0, currCashValue - targetCashValue);
    const totalExcess = stocksExcess + bondsExcess + cashExcess;

    if (totalExcess <= 0) return targetAllocation;

    return {
      stocks: stocksExcess / totalExcess,
      bonds: bondsExcess / totalExcess,
      cash: cashExcess / totalExcess,
    };
  }
}

export interface PortfolioData {
  totalValue: number;
  totalWithdrawals: number;
  totalContributions: number;
  totalEmployerMatch: number;
  totalRealizedGains: number;
  totalEarningsWithdrawn: number;
  totalRmds: number;
  totalShortfall: number;
  withdrawalsForPeriod: number;
  contributionsForPeriod: number;
  employerMatchForPeriod: number;
  realizedGainsForPeriod: number;
  earningsWithdrawnForPeriod: number;
  rmdsForPeriod: number;
  shortfallForPeriod: number;
  perAccountData: Record<string, AccountDataWithTransactions>;
  assetAllocation: AssetAllocation | null;
}

export class Portfolio {
  private accounts: Account[];

  constructor(data: AccountInputs[]) {
    this.accounts = data.map((accountData) => {
      switch (accountData.type) {
        case 'savings':
          return new SavingsAccount(accountData);
        case 'taxableBrokerage':
          return new TaxableBrokerageAccount(accountData);
        case 'roth401k':
        case 'rothIra':
          return new TaxFreeAccount(accountData);
        case '401k':
        case 'ira':
        case 'hsa':
          return new TaxDeferredAccount(accountData);
      }
    });
  }

  addExtraSavingsAccount(extraSavingsAccount: SavingsAccount): void {
    this.accounts.push(extraSavingsAccount);
  }

  addRmdSavingsAccount(rmdSavingsAccount: SavingsAccount): void {
    this.accounts.push(rmdSavingsAccount);
  }

  getWeightedAssetAllocation(): AssetAllocation | null {
    const totalValue = this.getTotalValue();
    if (totalValue === 0) return null;

    const weightedAllocation = this.accounts.reduce(
      (acc, account) => {
        const weight = account.getBalance() / totalValue;

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

  getCurrentAssetValues(): AssetValues {
    return this.accounts.reduce(
      (acc, account) => ({
        stocks: acc.stocks + account.getBalance() * account.getAccountData().assetAllocation.stocks,
        bonds: acc.bonds + account.getBalance() * account.getAccountData().assetAllocation.bonds,
        cash: acc.cash + account.getBalance() * account.getAccountData().assetAllocation.cash,
      }),
      { stocks: 0, bonds: 0, cash: 0 }
    );
  }

  getAccounts(): Account[] {
    return this.accounts;
  }

  getTotalValue(): number {
    return this.accounts.reduce((acc, account) => acc + account.getBalance(), 0);
  }

  getTotalWithdrawals(): number {
    return this.accounts.reduce((acc, account) => acc + account.getTotalWithdrawals(), 0);
  }

  getTotalContributions(): number {
    return this.accounts.reduce((acc, account) => acc + account.getTotalContributions(), 0);
  }

  getTotalEmployerMatch(): number {
    return this.accounts.reduce((acc, account) => acc + account.getTotalEmployerMatch(), 0);
  }

  getTotalRealizedGains(): number {
    return this.accounts.reduce((acc, account) => acc + account.getTotalRealizedGains(), 0);
  }

  getTotalEarningsWithdrawn(): number {
    return this.accounts.reduce((acc, account) => acc + account.getTotalEarningsWithdrawn(), 0);
  }

  getTotalRmds(): number {
    return this.accounts.reduce((acc, account) => acc + account.getTotalRmds(), 0);
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

  applyReturns(returns: AssetReturnRates): {
    returnsForPeriod: AssetReturnAmounts;
    totalReturns: AssetReturnAmounts;
    byAccount: Record<string, AccountDataWithReturns>;
  } {
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
    const byAccount: Record<string, AccountDataWithReturns> = {};

    this.accounts.forEach((account) => {
      const { returnsForPeriod: accountReturnsForPeriod, totalReturns: accountTotalReturns } = account.applyReturns(returns);

      returnsForPeriod.cash += accountReturnsForPeriod.cash;
      returnsForPeriod.bonds += accountReturnsForPeriod.bonds;
      returnsForPeriod.stocks += accountReturnsForPeriod.stocks;

      totalReturns.cash += accountTotalReturns.cash;
      totalReturns.bonds += accountTotalReturns.bonds;
      totalReturns.stocks += accountTotalReturns.stocks;

      byAccount[account.getAccountID()] = {
        name: account.getAccountName(),
        id: account.getAccountID(),
        type: account.getAccountType(),
        returnAmountsForPeriod: accountReturnsForPeriod,
        totalReturnAmounts: accountTotalReturns,
      };
    });

    return { returnsForPeriod, totalReturns, byAccount };
  }

  applyYields(yields: AssetYieldRates): {
    yieldsForPeriod: Record<TaxCategory, AssetYieldAmounts>;
    totalYields: Record<TaxCategory, AssetYieldAmounts>;
  } {
    const yieldsForPeriod: Record<TaxCategory, AssetYieldAmounts> = {
      taxable: { stocks: 0, bonds: 0, cash: 0 },
      taxDeferred: { stocks: 0, bonds: 0, cash: 0 },
      taxFree: { stocks: 0, bonds: 0, cash: 0 },
      cashSavings: { stocks: 0, bonds: 0, cash: 0 },
    };
    const totalYields: Record<TaxCategory, AssetYieldAmounts> = {
      taxable: { stocks: 0, bonds: 0, cash: 0 },
      taxDeferred: { stocks: 0, bonds: 0, cash: 0 },
      taxFree: { stocks: 0, bonds: 0, cash: 0 },
      cashSavings: { stocks: 0, bonds: 0, cash: 0 },
    };

    this.accounts.forEach((account) => {
      const { yieldsForPeriod: accountYieldsForPeriod, totalYields: accountTotalYields } = account.applyYields(yields);

      const taxCategory = account.taxCategory;

      yieldsForPeriod[taxCategory].stocks += accountYieldsForPeriod.stocks;
      yieldsForPeriod[taxCategory].bonds += accountYieldsForPeriod.bonds;
      yieldsForPeriod[taxCategory].cash += accountYieldsForPeriod.cash;

      totalYields[taxCategory].stocks += accountTotalYields.stocks;
      totalYields[taxCategory].bonds += accountTotalYields.bonds;
      totalYields[taxCategory].cash += accountTotalYields.cash;
    });

    return { yieldsForPeriod, totalYields };
  }
}
