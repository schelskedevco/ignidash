import type { AccountInputs } from '@/lib/schemas/account-form-schema';

import { type Account, SavingsAccount, InvestmentAccount, type AccountDataWithTransactions } from './account';
import type { SimulationState } from './simulation-engine';
import type { AssetReturnRates, AssetReturnAmounts, AssetAllocation, AssetYieldRates, AssetYieldAmounts, TaxCategory } from '../asset';
import { ContributionRules } from './contribution-rules';
import type { IncomesData } from './incomes';
import type { ExpensesData } from './expenses';
import type { TaxesData } from './taxes';
import type { AccountDataWithReturns } from './returns';
import { uniformLifetimeMap } from '../data/rmds-table';

type TransactionsBreakdown = { totalForPeriod: number; byAccount: Record<string, number> };

type WithdrawalModifier = 'contributionsOnly';

interface WithdrawalOrderItem {
  accountType: AccountInputs['type'];
  modifier?: WithdrawalModifier;
}

const EXTRA_SAVINGS_ACCOUNT_ID = '54593a0d-7b4f-489d-a5bd-42500afba532';
const RMD_SAVINGS_ACCOUNT_ID = 'd7288042-1f83-4e50-9a6a-b1ef7a6191cc';

export class PortfolioProcessor {
  private extraSavingsAccount: SavingsAccount;
  private rmdSavingsAccount: SavingsAccount;
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
    this.rmdSavingsAccount = new SavingsAccount({
      type: 'savings' as const,
      id: RMD_SAVINGS_ACCOUNT_ID,
      name: '[System] RMD Savings',
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

    const perAccountData: Record<string, AccountDataWithTransactions> = this.buildPerAccountData(
      {}, // baseAccountData
      contributionsByAccount,
      withdrawalsByAccount,
      realizedGainsByAccount,
      earningsWithdrawnByAccount,
      {} // rmdsByAccount
    );

    const result = this.buildPortfolioData(
      { withdrawalsForPeriod, contributionsForPeriod, realizedGainsForPeriod, earningsWithdrawnForPeriod, rmdsForPeriod: 0 },
      perAccountData
    );

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

    const perAccountData: Record<string, AccountDataWithTransactions> = this.buildPerAccountData(
      perAccountDataBeforeTaxes,
      contributionsByAccount,
      withdrawalsByAccount,
      realizedGainsByAccount,
      earningsWithdrawnByAccount,
      {} // rmdsByAccount
    );

    const portfolioData = this.buildPortfolioData(
      { withdrawalsForPeriod, contributionsForPeriod, realizedGainsForPeriod, earningsWithdrawnForPeriod, rmdsForPeriod: 0 },
      perAccountData
    );

    return {
      portfolioData,
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

    for (const { accountType, modifier } of withdrawalOrder) {
      if (remainingToWithdraw <= 0) break;

      const accountsOfType = this.simulationState.portfolio.getAccounts().filter((account) => account.getAccountType() === accountType);
      if (accountsOfType.length === 0) continue;

      for (const account of accountsOfType) {
        if (remainingToWithdraw <= 0) break;
        if (!(account.getTotalValue() > 0)) continue;

        let maxWithdrawable = account.getTotalValue();
        if (modifier === 'contributionsOnly' && account instanceof InvestmentAccount) {
          maxWithdrawable = Math.min(maxWithdrawable, account.getContributionBasis()!);
        }

        const withdrawFromThisAccount = Math.min(remainingToWithdraw, maxWithdrawable);

        const { realizedGains, earningsWithdrawn } = account.applyWithdrawal(withdrawFromThisAccount, 'regular');
        realizedGainsByAccount[account.getAccountID()] = realizedGains;
        realizedGainsForPeriod += realizedGains;
        earningsWithdrawnByAccount[account.getAccountID()] = earningsWithdrawn;
        earningsWithdrawnForPeriod += earningsWithdrawn;

        byAccount[account.getAccountID()] = withdrawFromThisAccount;
        remainingToWithdraw -= withdrawFromThisAccount;
      }
    }

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

  processRequiredMinimumDistributions(): PortfolioData {
    const age = this.simulationState.time.age;
    if (age < 73) throw new Error('RMDs should not be processed for ages under 73');

    const withdrawalsByAccount: Record<string, number> = {};
    const realizedGainsByAccount: Record<string, number> = {};
    const earningsWithdrawnByAccount: Record<string, number> = {};
    const rmdsByAccount: Record<string, number> = {};

    let totalForPeriod = 0;
    let realizedGainsForPeriod = 0;
    let earningsWithdrawnForPeriod = 0;

    const accountsWithRMDs = this.simulationState.portfolio.getAccounts().filter((account) => account.getHasRMDs());
    for (const account of accountsWithRMDs) {
      if (!(account.getTotalValue() > 0)) continue;

      const lookupAge = Math.min(Math.floor(age), 120);
      const rmdAmount = account.getTotalValue() / uniformLifetimeMap[lookupAge];

      const { realizedGains, earningsWithdrawn } = account.applyWithdrawal(rmdAmount, 'rmd');
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
    if (!portfolioHasRmdSavingsAccount) {
      this.simulationState.portfolio.addRmdSavingsAccount(this.rmdSavingsAccount);
    }

    this.rmdSavingsAccount.applyContribution(totalForPeriod);
    contributionsByAccount[this.rmdSavingsAccount.getAccountID()] =
      (contributionsByAccount[this.rmdSavingsAccount.getAccountID()] || 0) + totalForPeriod;

    const perAccountData: Record<string, AccountDataWithTransactions> = this.buildPerAccountData(
      {}, // baseAccountData
      contributionsByAccount,
      withdrawalsByAccount,
      realizedGainsByAccount,
      earningsWithdrawnByAccount,
      rmdsByAccount
    );

    const result = this.buildPortfolioData(
      {
        withdrawalsForPeriod: totalForPeriod,
        contributionsForPeriod: totalForPeriod,
        realizedGainsForPeriod,
        earningsWithdrawnForPeriod,
        rmdsForPeriod: totalForPeriod,
      },
      perAccountData
    );

    this.monthlyData.push(result);
    return result;
  }

  private buildPerAccountData(
    baseAccountData: Record<string, AccountDataWithTransactions>,
    contributionsByAccount: Record<string, number>,
    withdrawalsByAccount: Record<string, number>,
    realizedGainsByAccount: Record<string, number>,
    earningsWithdrawnByAccount: Record<string, number>,
    rmdsByAccount: Record<string, number>
  ): Record<string, AccountDataWithTransactions> {
    return Object.fromEntries(
      this.simulationState.portfolio.getAccounts().map((account) => {
        const accountID = account.getAccountID();
        const accountData = account.getAccountData();

        const baseContributionsForPeriod = baseAccountData[accountID]?.contributionsForPeriod || 0;
        const contributionsForPeriod = (contributionsByAccount[accountID] || 0) + baseContributionsForPeriod;

        const baseWithdrawalsForPeriod = baseAccountData[accountID]?.withdrawalsForPeriod || 0;
        const withdrawalsForPeriod = (withdrawalsByAccount[accountID] || 0) + baseWithdrawalsForPeriod;

        const baseRealizedGainsForPeriod = baseAccountData[accountID]?.realizedGainsForPeriod || 0;
        const realizedGainsForPeriod = (realizedGainsByAccount[accountID] || 0) + baseRealizedGainsForPeriod;

        const baseEarningsWithdrawnForPeriod = baseAccountData[accountID]?.earningsWithdrawnForPeriod || 0;
        const earningsWithdrawnForPeriod = (earningsWithdrawnByAccount[accountID] || 0) + baseEarningsWithdrawnForPeriod;

        const baseRmdsForPeriod = baseAccountData[accountID]?.rmdsForPeriod || 0;
        const rmdsForPeriod = (rmdsByAccount[accountID] || 0) + baseRmdsForPeriod;

        return [
          accountID,
          {
            ...accountData,
            contributionsForPeriod,
            withdrawalsForPeriod,
            realizedGainsForPeriod,
            earningsWithdrawnForPeriod,
            rmdsForPeriod,
          },
        ];
      })
    );
  }

  private buildPortfolioData(
    forPeriodData: {
      withdrawalsForPeriod: number;
      contributionsForPeriod: number;
      realizedGainsForPeriod: number;
      earningsWithdrawnForPeriod: number;
      rmdsForPeriod: number;
    },
    perAccountData: Record<string, AccountDataWithTransactions>
  ): PortfolioData {
    return {
      totalValue: this.simulationState.portfolio.getTotalValue(),
      totalWithdrawals: this.simulationState.portfolio.getTotalWithdrawals(),
      totalContributions: this.simulationState.portfolio.getTotalContributions(),
      totalRealizedGains: this.simulationState.portfolio.getTotalRealizedGains(),
      totalEarningsWithdrawn: this.simulationState.portfolio.getTotalEarningsWithdrawn(),
      totalRmds: this.simulationState.portfolio.getTotalRmds(),
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
  totalRmds: number;
  withdrawalsForPeriod: number;
  contributionsForPeriod: number;
  realizedGainsForPeriod: number;
  earningsWithdrawnForPeriod: number;
  rmdsForPeriod: number;
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

  addRmdSavingsAccount(rmdSavingsAccount: SavingsAccount): void {
    this.accounts.push(rmdSavingsAccount);
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
