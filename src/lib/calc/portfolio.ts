import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import type { GlidePathInputs } from '@/lib/schemas/inputs/glide-path-schema';

import {
  type Account,
  SavingsAccount,
  TaxableBrokerageAccount,
  TaxDeferredAccount,
  TaxFreeAccount,
  InvestmentAccount,
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
  AssetTransactions,
  TaxCategory,
} from './asset';
import { ContributionRules } from './contribution-rules';
import type { IncomesData } from './incomes';
import type { ExpensesData } from './expenses';
import type { DebtsData } from './debts';
import type { PhysicalAssetsData } from './physical-assets';
import type { AccountDataWithReturns } from './returns';
import { uniformLifetimeMap } from './historical-data/rmds-table';

type TransactionsBreakdown = { totalForPeriod: AssetTransactions; byAccount: Record<string, AssetTransactions> };

type WithdrawalModifier = 'contributionsOnly';
interface WithdrawalOrderItem {
  accountType: AccountInputs['type'];
  modifier?: WithdrawalModifier;
}

const EXTRA_SAVINGS_ACCOUNT_ID = '54593a0d-7b4f-489d-a5bd-42500afba532';
const RMD_SAVINGS_ACCOUNT_ID = 'd7288042-1f83-4e50-9a6a-b1ef7a6191cc';
const DEFAULT_ASSET_ALLOCATION = { stocks: 0.6, bonds: 0.4, cash: 0 };

const zeroTransactions = (): AssetTransactions => ({ stocks: 0, bonds: 0, cash: 0 });

const addTransactions = (a: AssetTransactions, b: AssetTransactions): AssetTransactions => ({
  stocks: a.stocks + b.stocks,
  bonds: a.bonds + b.bonds,
  cash: a.cash + b.cash,
});

export class PortfolioProcessor {
  private initialAssetAllocation: AssetAllocation | null;
  private extraSavingsAccount: SavingsAccount;
  private rmdSavingsAccount: SavingsAccount;
  private monthlyData: PortfolioData[] = [];
  private outstandingShortfall: number = 0;

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

  processContributionsAndWithdrawals(
    incomesData: IncomesData,
    expensesData: ExpensesData,
    debtsData: DebtsData,
    physicalAssetsData: PhysicalAssetsData
  ): { portfolioData: PortfolioData; discretionaryExpense: number } {
    const debtAndLoanPayments = Math.max(0, debtsData.totalPayment + physicalAssetsData.totalLoanPayment);

    const physicalAssetPurchaseOutlay = physicalAssetsData.totalPurchaseOutlay;
    const physicalAssetSaleProceeds = physicalAssetsData.totalSaleProceeds;

    const surplusDeficitAfterPayrollDeductions =
      incomesData.totalIncomeAfterPayrollDeductions +
      physicalAssetSaleProceeds -
      expensesData.totalExpenses -
      debtAndLoanPayments -
      physicalAssetPurchaseOutlay;

    const {
      totalForPeriod: contributionsForPeriod,
      byAccount: contributionsByAccount,
      discretionaryExpense,
      employerMatchForPeriod,
      employerMatchByAccount,
      shortfallRepaidForPeriod,
    } = this.processContributions(surplusDeficitAfterPayrollDeductions, incomesData);

    const {
      totalForPeriod: withdrawalsForPeriod,
      byAccount: withdrawalsByAccount,
      realizedGainsForPeriod: realizedGainsForPeriodBeforeRebalance,
      realizedGainsByAccount: realizedGainsByAccountBeforeRebalance,
      earningsWithdrawnForPeriod,
      earningsWithdrawnByAccount,
      shortfallForPeriod,
    } = this.processWithdrawals(surplusDeficitAfterPayrollDeductions);

    const { realizedGainsFromRebalance, realizedGainsByAccountFromRebalance } = this.processRebalance();

    const realizedGainsForPeriod = realizedGainsForPeriodBeforeRebalance + realizedGainsFromRebalance;
    const realizedGainsByAccount = { ...realizedGainsByAccountBeforeRebalance };
    for (const [k, v] of Object.entries(realizedGainsByAccountFromRebalance)) {
      realizedGainsByAccount[k] = (realizedGainsByAccount[k] ?? 0) + v;
    }

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
        shortfallRepaidForPeriod,
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

    let withdrawalsForPeriod = { ...annualPortfolioDataBeforeTaxes.withdrawalsForPeriod };
    let contributionsForPeriod = { ...annualPortfolioDataBeforeTaxes.contributionsForPeriod };
    let employerMatchForPeriod = annualPortfolioDataBeforeTaxes.employerMatchForPeriod;
    let realizedGainsForPeriod = annualPortfolioDataBeforeTaxes.realizedGainsForPeriod;
    let earningsWithdrawnForPeriod = annualPortfolioDataBeforeTaxes.earningsWithdrawnForPeriod;
    const rmdsForPeriod = annualPortfolioDataBeforeTaxes.rmdsForPeriod;
    let shortfallForPeriod = annualPortfolioDataBeforeTaxes.shortfallForPeriod;
    let shortfallRepaidForPeriod = annualPortfolioDataBeforeTaxes.shortfallRepaidForPeriod;

    let contributionsByAccount: Record<string, AssetTransactions> = {};
    let employerMatchByAccount: Record<string, number> = {};
    let withdrawalsByAccount: Record<string, AssetTransactions> = {};
    let realizedGainsByAccount: Record<string, number> = {};
    let earningsWithdrawnByAccount: Record<string, number> = {};

    let discretionaryExpense = 0;
    if (taxesData.totalTaxesRefund > 0) {
      const res = this.processContributions(taxesData.totalTaxesRefund);
      contributionsForPeriod = addTransactions(contributionsForPeriod, res.totalForPeriod);
      contributionsByAccount = res.byAccount;
      discretionaryExpense += res.discretionaryExpense;
      employerMatchForPeriod += res.employerMatchForPeriod;
      employerMatchByAccount = res.employerMatchByAccount;
      shortfallRepaidForPeriod += res.shortfallRepaidForPeriod;
    }

    if (taxesData.totalTaxesDue > 0) {
      const res = this.processWithdrawals(-taxesData.totalTaxesDue);
      withdrawalsForPeriod = addTransactions(withdrawalsForPeriod, res.totalForPeriod);
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
        shortfallRepaidForPeriod,
      },
      perAccountData
    );

    return { portfolioData, discretionaryExpense };
  }

  private processContributions(
    surplusDeficit: number,
    incomesData?: IncomesData
  ): TransactionsBreakdown & {
    discretionaryExpense: number;
    employerMatchForPeriod: number;
    employerMatchByAccount: Record<string, number>;
    shortfallRepaidForPeriod: number;
  } {
    const byAccount: Record<string, AssetTransactions> = {};
    const employerMatchByAccount: Record<string, number> = {};
    if (!(surplusDeficit > 0)) {
      return {
        totalForPeriod: zeroTransactions(),
        byAccount,
        discretionaryExpense: 0,
        employerMatchForPeriod: 0,
        employerMatchByAccount,
        shortfallRepaidForPeriod: 0,
      };
    }

    const shortfallRepaidForPeriod = Math.min(surplusDeficit, this.outstandingShortfall);
    this.outstandingShortfall -= shortfallRepaidForPeriod;

    const age = this.simulationState.time.age;
    const contributionRules = this.contributionRules.getRules().sort((a, b) => a.getRank() - b.getRank());

    let employerMatchForPeriod = 0;

    let remainingToContribute = surplusDeficit - shortfallRepaidForPeriod;
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
      const contributedAssets = contributeToAccount.applyContribution(contributionAmount, 'self', contributionAllocation);
      byAccount[contributeToAccountID] = { ...contributedAssets };

      if (employerMatchAmount > 0) {
        const matchedAssets = contributeToAccount.applyContribution(employerMatchAmount, 'employer', contributionAllocation);
        byAccount[contributeToAccountID] = addTransactions(byAccount[contributeToAccountID], matchedAssets);
      }

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
          const extraContributed = this.extraSavingsAccount.applyContribution(remainingToContribute, 'self', contributionAllocation);
          byAccount[this.extraSavingsAccount.getAccountID()] = addTransactions(
            byAccount[this.extraSavingsAccount.getAccountID()] ?? zeroTransactions(),
            extraContributed
          );

          remainingToContribute = 0;
          break;
      }
    }

    const totalForPeriod = Object.values(byAccount).reduce((acc, curr) => addTransactions(acc, curr), zeroTransactions());

    return { totalForPeriod, byAccount, discretionaryExpense, employerMatchForPeriod, employerMatchByAccount, shortfallRepaidForPeriod };
  }

  private processWithdrawals(surplusDeficit: number): TransactionsBreakdown & {
    realizedGainsForPeriod: number;
    realizedGainsByAccount: Record<string, number>;
    earningsWithdrawnForPeriod: number;
    earningsWithdrawnByAccount: Record<string, number>;
    shortfallForPeriod: number;
  } {
    const byAccount: Record<string, AssetTransactions> = {};
    const realizedGainsByAccount: Record<string, number> = {};
    const earningsWithdrawnByAccount: Record<string, number> = {};
    if (!(surplusDeficit < 0)) {
      return {
        totalForPeriod: zeroTransactions(),
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
    let remainingToWithdraw = Math.abs(surplusDeficit);

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
        const { realizedGains, earningsWithdrawn, ...withdrawnAssets } = account.applyWithdrawal(
          withdrawFromThisAccount,
          'regular',
          withdrawalAllocation
        );
        realizedGainsByAccount[account.getAccountID()] = realizedGains;
        realizedGainsForPeriod += realizedGains;
        earningsWithdrawnByAccount[account.getAccountID()] = earningsWithdrawn;
        earningsWithdrawnForPeriod += earningsWithdrawn;

        byAccount[account.getAccountID()] = { ...withdrawnAssets };
        remainingToWithdraw -= withdrawFromThisAccount;
      }
    }

    const totalForPeriod = Object.values(byAccount).reduce((acc, curr) => addTransactions(acc, curr), zeroTransactions());

    const shortfallForPeriod = remainingToWithdraw;
    this.outstandingShortfall += shortfallForPeriod;

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
    if (age < this.simulationContext.rmdAge)
      throw new Error(`RMDs should not be processed for ages under ${this.simulationContext.rmdAge}`);

    const withdrawalsByAccount: Record<string, AssetTransactions> = {};
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
      const { realizedGains, earningsWithdrawn, ...withdrawnAssets } = account.applyWithdrawal(rmdAmount, 'rmd', withdrawalAllocation);
      realizedGainsByAccount[account.getAccountID()] = realizedGains;
      realizedGainsForPeriod += realizedGains;
      earningsWithdrawnByAccount[account.getAccountID()] = earningsWithdrawn;
      earningsWithdrawnForPeriod += earningsWithdrawn;

      withdrawalsByAccount[account.getAccountID()] = { ...withdrawnAssets };
      rmdsByAccount[account.getAccountID()] = rmdAmount;
      totalForPeriod += rmdAmount;
    }

    const withdrawalsForPeriod = Object.values(withdrawalsByAccount).reduce((acc, curr) => addTransactions(acc, curr), zeroTransactions());

    const portfolioHasRmdSavingsAccount = this.simulationState.portfolio
      .getAccounts()
      .some((account) => account.getAccountID() === this.rmdSavingsAccount.getAccountID());
    if (!portfolioHasRmdSavingsAccount && totalForPeriod > 0) {
      this.simulationState.portfolio.addRmdSavingsAccount(this.rmdSavingsAccount);
    }

    const contributionsByAccount: Record<string, AssetTransactions> = {};

    const contributionAllocation = this.getAllocationForContribution(totalForPeriod);
    const contributedAssets = this.rmdSavingsAccount.applyContribution(totalForPeriod, 'self', contributionAllocation);
    contributionsByAccount[this.rmdSavingsAccount.getAccountID()] = { ...contributedAssets };

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
        withdrawalsForPeriod,
        employerMatchForPeriod: 0,
        contributionsForPeriod: { ...contributedAssets },
        realizedGainsForPeriod,
        earningsWithdrawnForPeriod,
        rmdsForPeriod: totalForPeriod,
        shortfallForPeriod: 0,
        shortfallRepaidForPeriod: 0,
      },
      perAccountData
    );

    this.monthlyData.push(portfolioData);
    return portfolioData;
  }

  private buildPerAccountData(
    baseAccountData: Record<string, AccountDataWithTransactions>,
    contributionsByAccount: Record<string, AssetTransactions>,
    employerMatchByAccount: Record<string, number>,
    withdrawalsByAccount: Record<string, AssetTransactions>,
    realizedGainsByAccount: Record<string, number>,
    earningsWithdrawnByAccount: Record<string, number>,
    rmdsByAccount: Record<string, number>
  ): Record<string, AccountDataWithTransactions> {
    const addToBaseNumber = (accountID: string, field: keyof AccountDataWithTransactions, value: number) => {
      return ((baseAccountData[accountID]?.[field] as number) ?? 0) + value;
    };

    const addToBaseTransactions = (accountID: string, field: keyof AccountDataWithTransactions, value: AssetTransactions) => {
      const base = (baseAccountData[accountID]?.[field] as AssetTransactions) ?? zeroTransactions();
      return addTransactions(base, value);
    };

    return Object.fromEntries(
      this.simulationState.portfolio.getAccounts().map((account) => {
        const accountID = account.getAccountID();
        const accountData = account.getAccountData();

        return [
          accountID,
          {
            ...accountData,
            contributionsForPeriod: addToBaseTransactions(
              accountID,
              'contributionsForPeriod',
              contributionsByAccount[accountID] ?? zeroTransactions()
            ),
            employerMatchForPeriod: addToBaseNumber(accountID, 'employerMatchForPeriod', employerMatchByAccount[accountID] ?? 0),
            withdrawalsForPeriod: addToBaseTransactions(
              accountID,
              'withdrawalsForPeriod',
              withdrawalsByAccount[accountID] ?? zeroTransactions()
            ),
            realizedGainsForPeriod: addToBaseNumber(accountID, 'realizedGainsForPeriod', realizedGainsByAccount[accountID] ?? 0),
            earningsWithdrawnForPeriod: addToBaseNumber(
              accountID,
              'earningsWithdrawnForPeriod',
              earningsWithdrawnByAccount[accountID] ?? 0
            ),
            rmdsForPeriod: addToBaseNumber(accountID, 'rmdsForPeriod', rmdsByAccount[accountID] ?? 0),
          },
        ];
      })
    );
  }

  private buildPortfolioData(
    forPeriodData: {
      withdrawalsForPeriod: AssetTransactions;
      contributionsForPeriod: AssetTransactions;
      employerMatchForPeriod: number;
      realizedGainsForPeriod: number;
      earningsWithdrawnForPeriod: number;
      rmdsForPeriod: number;
      shortfallForPeriod: number;
      shortfallRepaidForPeriod: number;
    },
    perAccountData: Record<string, AccountDataWithTransactions>
  ): PortfolioData {
    return {
      totalValue: this.simulationState.portfolio.getTotalValue(),
      cumulativeWithdrawals: this.simulationState.portfolio.getCumulativeWithdrawals(),
      cumulativeContributions: this.simulationState.portfolio.getCumulativeContributions(),
      cumulativeEmployerMatch: this.simulationState.portfolio.getCumulativeEmployerMatch(),
      cumulativeRealizedGains: this.simulationState.portfolio.getCumulativeRealizedGains(),
      cumulativeEarningsWithdrawn: this.simulationState.portfolio.getCumulativeEarningsWithdrawn(),
      cumulativeRmds: this.simulationState.portfolio.getCumulativeRmds(),
      outstandingShortfall: this.outstandingShortfall,
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
        { accountType: 'roth403b', modifier: 'contributionsOnly' },
        { accountType: 'rothIra', modifier: 'contributionsOnly' },
        { accountType: '401k' },
        { accountType: '403b' },
        { accountType: 'ira' },
        { accountType: 'roth401k' },
        { accountType: 'roth403b' },
        { accountType: 'rothIra' },
        { accountType: 'hsa' },
      ];
    } else {
      return [
        { accountType: 'savings' },
        { accountType: '401k' },
        { accountType: '403b' },
        { accountType: 'ira' },
        { accountType: 'taxableBrokerage' },
        { accountType: 'roth401k' },
        { accountType: 'roth403b' },
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
          acc.contributionsForPeriod = addTransactions(acc.contributionsForPeriod, curr.contributionsForPeriod);
          acc.employerMatchForPeriod += curr.employerMatchForPeriod;
          acc.withdrawalsForPeriod = addTransactions(acc.withdrawalsForPeriod, curr.withdrawalsForPeriod);
          acc.realizedGainsForPeriod += curr.realizedGainsForPeriod;
          acc.earningsWithdrawnForPeriod += curr.earningsWithdrawnForPeriod;
          acc.rmdsForPeriod += curr.rmdsForPeriod;
          acc.shortfallForPeriod += curr.shortfallForPeriod;
          acc.shortfallRepaidForPeriod += curr.shortfallRepaidForPeriod;

          Object.entries(curr.perAccountData).forEach(([accountID, accountData]) => {
            acc.perAccountData[accountID] = {
              ...accountData,
              contributionsForPeriod: addTransactions(
                acc.perAccountData[accountID]?.contributionsForPeriod ?? zeroTransactions(),
                accountData.contributionsForPeriod
              ),
              employerMatchForPeriod: (acc.perAccountData[accountID]?.employerMatchForPeriod ?? 0) + accountData.employerMatchForPeriod,
              withdrawalsForPeriod: addTransactions(
                acc.perAccountData[accountID]?.withdrawalsForPeriod ?? zeroTransactions(),
                accountData.withdrawalsForPeriod
              ),
              realizedGainsForPeriod: (acc.perAccountData[accountID]?.realizedGainsForPeriod ?? 0) + accountData.realizedGainsForPeriod,
              earningsWithdrawnForPeriod:
                (acc.perAccountData[accountID]?.earningsWithdrawnForPeriod ?? 0) + accountData.earningsWithdrawnForPeriod,
              rmdsForPeriod: (acc.perAccountData[accountID]?.rmdsForPeriod ?? 0) + accountData.rmdsForPeriod,
            };
          });

          return acc;
        },
        {
          contributionsForPeriod: zeroTransactions(),
          employerMatchForPeriod: 0,
          withdrawalsForPeriod: zeroTransactions(),
          realizedGainsForPeriod: 0,
          earningsWithdrawnForPeriod: 0,
          rmdsForPeriod: 0,
          shortfallForPeriod: 0,
          shortfallRepaidForPeriod: 0,
          perAccountData: {} as Record<string, AccountDataWithTransactions>,
        }
      ),
    };
  }

  private processRebalance(): {
    rebalanceOccurred: boolean;
    realizedGainsFromRebalance: number;
    realizedGainsByAccountFromRebalance: Record<string, number>;
  } {
    const realizedGainsByAccountFromRebalance: Record<string, number> = {};
    if (!this.glidePath?.enabled) return { rebalanceOccurred: false, realizedGainsFromRebalance: 0, realizedGainsByAccountFromRebalance };

    const totalValue = this.simulationState.portfolio.getTotalValue();
    if (totalValue <= 0) return { rebalanceOccurred: false, realizedGainsFromRebalance: 0, realizedGainsByAccountFromRebalance };

    const { stocks: currentStocksValue, bonds: currentBondsValue } = this.simulationState.portfolio.getCurrentAssetValues();
    const targetAllocation = this.getTargetAssetAllocation();

    const stocksExcess = currentStocksValue - totalValue * targetAllocation.stocks;
    const bondsExcess = currentBondsValue - totalValue * targetAllocation.bonds;

    const rebalanceOrder: Array<AccountInputs['type']> = [
      '401k',
      '403b',
      'ira',
      'hsa',
      'roth401k',
      'roth403b',
      'rothIra',
      'taxableBrokerage',
    ];

    let remainingStocksExcess = stocksExcess;
    let remainingBondsExcess = bondsExcess;
    let realizedGainsFromRebalance = 0;

    for (const accountType of rebalanceOrder) {
      if (Math.abs(remainingStocksExcess) < 1 && Math.abs(remainingBondsExcess) < 1) break;

      const accountsOfType = this.simulationState.portfolio.getAccounts().filter((account) => account.getAccountType() === accountType);
      if (accountsOfType.length === 0) continue;

      for (const account of accountsOfType) {
        if (Math.abs(remainingStocksExcess) < 1 && Math.abs(remainingBondsExcess) < 1) break;
        if (account.getBalance() <= 0) continue;
        if (!(account instanceof InvestmentAccount)) continue;

        const rebalance = account.applyRebalance(remainingStocksExcess, remainingBondsExcess);

        remainingStocksExcess -= rebalance.stocksSold;
        remainingBondsExcess -= rebalance.bondsSold;

        realizedGainsByAccountFromRebalance[account.getAccountID()] = rebalance.realizedGains;
        realizedGainsFromRebalance += rebalance.realizedGains;
      }
    }

    return { rebalanceOccurred: true, realizedGainsFromRebalance, realizedGainsByAccountFromRebalance };
  }

  private getTargetAssetAllocation(): AssetAllocation {
    if (!this.initialAssetAllocation) console.warn('No initial asset allocation available; using default 60/40');

    const startAllocation = this.initialAssetAllocation ?? DEFAULT_ASSET_ALLOCATION;
    if (!this.glidePath) return startAllocation;

    const targetAllocation: AssetAllocation = {
      stocks: 1 - this.glidePath.targetBondAllocation / 100,
      bonds: this.glidePath.targetBondAllocation / 100,
      cash: 0,
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
  cumulativeWithdrawals: AssetTransactions;
  cumulativeContributions: AssetTransactions;
  cumulativeEmployerMatch: number;
  cumulativeRealizedGains: number;
  cumulativeEarningsWithdrawn: number;
  cumulativeRmds: number;
  outstandingShortfall: number;
  withdrawalsForPeriod: AssetTransactions;
  contributionsForPeriod: AssetTransactions;
  employerMatchForPeriod: number;
  realizedGainsForPeriod: number;
  earningsWithdrawnForPeriod: number;
  rmdsForPeriod: number;
  shortfallForPeriod: number;
  shortfallRepaidForPeriod: number;
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
        case 'roth403b':
        case 'rothIra':
          return new TaxFreeAccount(accountData);
        case '401k':
        case '403b':
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
          stocks: acc.stocks + (account.getAccountData().assetAllocation.stocks ?? 0) * weight,
          bonds: acc.bonds + (account.getAccountData().assetAllocation.bonds ?? 0) * weight,
          cash: acc.cash + (account.getAccountData().assetAllocation.cash ?? 0) * weight,
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

  getCumulativeWithdrawals(): AssetTransactions {
    return this.accounts.reduce((acc, account) => addTransactions(acc, account.getCumulativeWithdrawals()), zeroTransactions());
  }

  getCumulativeContributions(): AssetTransactions {
    return this.accounts.reduce((acc, account) => addTransactions(acc, account.getCumulativeContributions()), zeroTransactions());
  }

  getCumulativeEmployerMatch(): number {
    return this.accounts.reduce((acc, account) => acc + account.getCumulativeEmployerMatch(), 0);
  }

  getCumulativeRealizedGains(): number {
    return this.accounts.reduce((acc, account) => acc + account.getCumulativeRealizedGains(), 0);
  }

  getCumulativeEarningsWithdrawn(): number {
    return this.accounts.reduce((acc, account) => acc + account.getCumulativeEarningsWithdrawn(), 0);
  }

  getCumulativeRmds(): number {
    return this.accounts.reduce((acc, account) => acc + account.getCumulativeRmds(), 0);
  }

  getCumulativeReturns(): AssetReturnAmounts {
    return this.accounts.reduce(
      (acc, curr) => {
        const cumulativeReturns = curr.getCumulativeReturns();

        return {
          cash: acc.cash + cumulativeReturns.cash,
          bonds: acc.bonds + cumulativeReturns.bonds,
          stocks: acc.stocks + cumulativeReturns.stocks,
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
    cumulativeReturns: AssetReturnAmounts;
    byAccount: Record<string, AccountDataWithReturns>;
  } {
    const addAssetAmounts = (a: AssetReturnAmounts, b: AssetReturnAmounts): AssetReturnAmounts => {
      return { stocks: a.stocks + b.stocks, bonds: a.bonds + b.bonds, cash: a.cash + b.cash };
    };

    const zeroAssetReturnAmounts: AssetReturnAmounts = { stocks: 0, bonds: 0, cash: 0 };

    let returnsForPeriod: AssetReturnAmounts = { ...zeroAssetReturnAmounts };
    let cumulativeReturns: AssetReturnAmounts = { ...zeroAssetReturnAmounts };

    const byAccount: Record<string, AccountDataWithReturns> = {};

    this.accounts.forEach((account) => {
      const { returnsForPeriod: accountReturnsForPeriod, cumulativeReturns: accountCumulativeReturns } = account.applyReturns(returns);

      returnsForPeriod = addAssetAmounts(returnsForPeriod, accountReturnsForPeriod);
      cumulativeReturns = addAssetAmounts(cumulativeReturns, accountCumulativeReturns);

      byAccount[account.getAccountID()] = {
        name: account.getAccountName(),
        id: account.getAccountID(),
        type: account.getAccountType(),
        returnAmountsForPeriod: accountReturnsForPeriod,
        cumulativeReturnAmounts: accountCumulativeReturns,
      };
    });

    return { returnsForPeriod, cumulativeReturns, byAccount };
  }

  applyYields(yields: AssetYieldRates): {
    yieldsForPeriod: Record<TaxCategory, AssetYieldAmounts>;
    cumulativeYields: Record<TaxCategory, AssetYieldAmounts>;
  } {
    const addAssetAmounts = (a: AssetYieldAmounts, b: AssetYieldAmounts): AssetYieldAmounts => {
      return { stocks: a.stocks + b.stocks, bonds: a.bonds + b.bonds, cash: a.cash + b.cash };
    };

    const zeroAssetYieldAmounts: AssetYieldAmounts = { stocks: 0, bonds: 0, cash: 0 };

    const yieldsForPeriod: Record<TaxCategory, AssetYieldAmounts> = {
      taxable: { ...zeroAssetYieldAmounts },
      taxDeferred: { ...zeroAssetYieldAmounts },
      taxFree: { ...zeroAssetYieldAmounts },
      cashSavings: { ...zeroAssetYieldAmounts },
    };
    const cumulativeYields: Record<TaxCategory, AssetYieldAmounts> = {
      taxable: { ...zeroAssetYieldAmounts },
      taxDeferred: { ...zeroAssetYieldAmounts },
      taxFree: { ...zeroAssetYieldAmounts },
      cashSavings: { ...zeroAssetYieldAmounts },
    };

    this.accounts.forEach((account) => {
      const { yieldsForPeriod: accountYieldsForPeriod, cumulativeYields: accountCumulativeYields } = account.applyYields(yields);

      const taxCategory = account.taxCategory;

      yieldsForPeriod[taxCategory] = addAssetAmounts(yieldsForPeriod[taxCategory], accountYieldsForPeriod);
      cumulativeYields[taxCategory] = addAssetAmounts(cumulativeYields[taxCategory], accountCumulativeYields);
    });

    return { yieldsForPeriod, cumulativeYields };
  }
}
