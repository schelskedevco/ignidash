import type { SimulationDataPoint, SimulationResult } from '@/lib/calc/v2/simulation-engine';

export interface MilestonesData {
  yearsToRetirement: number | null;
  retirementAge: number | null;
  yearsToBankruptcy: number | null;
  bankruptcyAge: number | null;
}

export interface ReturnsStatsData {
  averageStockReturn: number | null;
  averageBondReturn: number | null;
  averageCashReturn: number | null;
  averageInflationRate: number | null;
  minStockReturn: number;
  maxStockReturn: number;
  earlyRetirementStockReturn: number | null;
}

export interface OperatingCashFlowData {
  earnedIncome: number;
  earnedIncomeAfterTax: number;
  totalExpenses: number;
  operatingCashFlow: number;
}

export interface TaxAmountsByType {
  incomeTax: number;
  capGainsTax: number;
  earlyWithdrawalPenalties: number;
  totalTaxesAndPenalties: number;
}

export interface ContributionsByTaxCategory {
  cashSavingsContributions: number;
  taxableBrokerageContributions: number;
  taxDeferredContributions: number;
  taxFreeContributions: number;
}

export interface WithdrawalsByTaxCategory {
  cashSavingsWithdrawals: number;
  taxableBrokerageWithdrawals: number;
  taxDeferredWithdrawals: number;
  taxFreeWithdrawals: number;
  earlyWithdrawals: number;
}

export interface BalanceByTaxCategory {
  cashSavings: number;
  taxableBrokerageBalance: number;
  taxDeferredBalance: number;
  taxFreeBalance: number;
}

export interface HoldingsByAssetClass {
  stockHoldings: number;
  bondHoldings: number;
  cashHoldings: number;
}

export interface TaxableIncomeSources {
  realizedGains: number;
  taxDeferredWithdrawals: number;
  earlyRothEarningsWithdrawals: number;
  earlyWithdrawals: number;
  taxableDividendIncome: number;
  taxableInterestIncome: number;
  earnedIncome: number;
  grossIncome: number;
}

export class SimulationDataExtractor {
  static getMilestonesData(data: SimulationDataPoint[], startAge: number): MilestonesData {
    let yearsToRetirement: number | null = null;
    let retirementAge: number | null = null;
    let yearsToBankruptcy: number | null = null;
    let bankruptcyAge: number | null = null;

    for (const dp of data) {
      const phase = dp.phase;
      if (phase?.name === 'retirement' && retirementAge === null) {
        const retirementDate = new Date(dp.date);

        yearsToRetirement = retirementDate.getFullYear() - new Date().getFullYear();
        retirementAge = startAge + yearsToRetirement;
      }

      if (dp.portfolio.totalValue <= 0.1 && bankruptcyAge === null) {
        const bankruptcyDate = new Date(dp.date);

        yearsToBankruptcy = bankruptcyDate.getFullYear() - new Date().getFullYear();
        bankruptcyAge = startAge + yearsToBankruptcy;
      }
    }

    return { yearsToRetirement, retirementAge, yearsToBankruptcy, bankruptcyAge };
  }

  static getAverageReturnsData(result: SimulationResult, retirementAge: number | null): ReturnsStatsData {
    const { data, context } = result;

    const startAge = context.startAge;
    const startDateYear = new Date().getFullYear();

    const { stocks, bonds, cash, inflation, count, minStockReturn, maxStockReturn, earlyRetirementStocks, yearsOfEarlyRetirement } = data
      .slice(1)
      .reduce(
        (acc, dp) => {
          const currDateYear = new Date(dp.date).getFullYear();
          const currAge = currDateYear - startDateYear + startAge;

          const returnsData = dp.returns!;
          const stockReturn = returnsData.annualReturnRates.stocks;

          let earlyRetirementStocks = acc.earlyRetirementStocks;
          let yearsOfEarlyRetirement = acc.yearsOfEarlyRetirement;
          if (retirementAge !== null && currAge > retirementAge && currAge < retirementAge + 5) {
            earlyRetirementStocks += stockReturn;
            yearsOfEarlyRetirement += 1;
          }

          return {
            stocks: acc.stocks + stockReturn,
            bonds: acc.bonds + returnsData.annualReturnRates.bonds,
            cash: acc.cash + returnsData.annualReturnRates.cash,
            inflation: acc.inflation + returnsData.annualInflationRate,
            count: acc.count + 1,
            minStockReturn: Math.min(acc.minStockReturn, stockReturn),
            maxStockReturn: Math.max(acc.maxStockReturn, stockReturn),
            earlyRetirementStocks,
            yearsOfEarlyRetirement,
          };
        },
        {
          stocks: 0,
          bonds: 0,
          cash: 0,
          inflation: 0,
          count: 0,
          minStockReturn: Infinity,
          maxStockReturn: -Infinity,
          earlyRetirementStocks: 0,
          yearsOfEarlyRetirement: 0,
        }
      );

    const averageStockReturn = count > 0 ? stocks / count : null;
    const averageBondReturn = count > 0 ? bonds / count : null;
    const averageCashReturn = count > 0 ? cash / count : null;
    const averageInflationRate = count > 0 ? inflation / count : null;
    const earlyRetirementStockReturn = yearsOfEarlyRetirement > 0 ? earlyRetirementStocks / yearsOfEarlyRetirement : null;

    return {
      averageStockReturn,
      averageBondReturn,
      averageCashReturn,
      averageInflationRate,
      minStockReturn,
      maxStockReturn,
      earlyRetirementStockReturn,
    };
  }

  static getTaxAmountsByType(dp: SimulationDataPoint): TaxAmountsByType {
    const taxesData = dp.taxes;

    const incomeTax = taxesData?.incomeTaxes.incomeTaxAmount ?? 0;
    const capGainsTax = taxesData?.capitalGainsTaxes.capitalGainsTaxAmount ?? 0;
    const earlyWithdrawalPenalties = taxesData?.earlyWithdrawalPenalties.totalPenaltyAmount ?? 0;
    const totalTaxesAndPenalties = incomeTax + capGainsTax + earlyWithdrawalPenalties;

    return { incomeTax, capGainsTax, earlyWithdrawalPenalties, totalTaxesAndPenalties };
  }

  static getOperatingCashFlowData(dp: SimulationDataPoint): OperatingCashFlowData {
    const incomesData = dp.incomes;
    const expensesData = dp.expenses;

    const { totalTaxesAndPenalties } = this.getTaxAmountsByType(dp);

    const earnedIncome = incomesData?.totalGrossIncome ?? 0;
    const earnedIncomeAfterTax = earnedIncome - totalTaxesAndPenalties;
    const totalExpenses = expensesData?.totalExpenses ?? 0;
    const operatingCashFlow = earnedIncomeAfterTax - totalExpenses;

    return { earnedIncome, earnedIncomeAfterTax, totalExpenses, operatingCashFlow };
  }

  static getContributionsByTaxCategory(dp: SimulationDataPoint): ContributionsByTaxCategory {
    const portfolioData = dp.portfolio;

    let cashSavingsContributions = 0;
    let taxableBrokerageContributions = 0;
    let taxDeferredContributions = 0;
    let taxFreeContributions = 0;

    for (const account of Object.values(portfolioData.perAccountData)) {
      switch (account.type) {
        case 'savings':
          cashSavingsContributions += account.contributionsForPeriod;
          break;
        case 'taxableBrokerage':
          taxableBrokerageContributions += account.contributionsForPeriod;
          break;
        case '401k':
        case 'ira':
        case 'hsa':
          taxDeferredContributions += account.contributionsForPeriod;
          break;
        case 'roth401k':
        case 'rothIra':
          taxFreeContributions += account.contributionsForPeriod;
          break;
      }
    }

    return { cashSavingsContributions, taxableBrokerageContributions, taxDeferredContributions, taxFreeContributions };
  }

  static getWithdrawalsByTaxCategory(dp: SimulationDataPoint, age: number): WithdrawalsByTaxCategory {
    const portfolioData = dp.portfolio;

    let cashSavingsWithdrawals = 0;
    let taxableBrokerageWithdrawals = 0;
    let taxDeferredWithdrawals = 0;
    let taxFreeWithdrawals = 0;
    let earlyWithdrawals = 0;

    for (const account of Object.values(portfolioData.perAccountData)) {
      switch (account.type) {
        case 'savings':
          cashSavingsWithdrawals += account.withdrawalsForPeriod;
          break;
        case 'taxableBrokerage':
          taxableBrokerageWithdrawals += account.withdrawalsForPeriod;
          break;
        case '401k':
        case 'ira':
          taxDeferredWithdrawals += account.withdrawalsForPeriod;
          if (age < 59.5) earlyWithdrawals += account.withdrawalsForPeriod;
          break;
        case 'hsa':
          taxDeferredWithdrawals += account.withdrawalsForPeriod;
          if (age < 65) earlyWithdrawals += account.withdrawalsForPeriod;
          break;
        case 'roth401k':
        case 'rothIra':
          taxFreeWithdrawals += account.withdrawalsForPeriod;
          if (age < 59.5) earlyWithdrawals += account.earningsWithdrawnForPeriod;
          break;
      }
    }

    return { cashSavingsWithdrawals, taxableBrokerageWithdrawals, taxDeferredWithdrawals, taxFreeWithdrawals, earlyWithdrawals };
  }

  static getBalanceByTaxCategory(dp: SimulationDataPoint): BalanceByTaxCategory {
    const portfolioData = dp.portfolio;

    let cashSavings = 0;
    let taxableBrokerageBalance = 0;
    let taxDeferredBalance = 0;
    let taxFreeBalance = 0;

    for (const account of Object.values(portfolioData.perAccountData)) {
      switch (account.type) {
        case 'savings':
          cashSavings += account.totalValue;
          break;
        case 'taxableBrokerage':
          taxableBrokerageBalance += account.totalValue;
          break;
        case '401k':
        case 'ira':
        case 'hsa':
          taxDeferredBalance += account.totalValue;
          break;
        case 'roth401k':
        case 'rothIra':
          taxFreeBalance += account.totalValue;
          break;
      }
    }

    return { cashSavings, taxableBrokerageBalance, taxDeferredBalance, taxFreeBalance };
  }

  static getHoldingsByAssetClass(dp: SimulationDataPoint): HoldingsByAssetClass {
    const portfolioData = dp.portfolio;
    const totalValue = portfolioData.totalValue;

    const assetAllocation = portfolioData.assetAllocation ?? { stocks: 0, bonds: 0, cash: 0 };
    const stocksAllocation = assetAllocation.stocks;
    const bondsAllocation = assetAllocation.bonds;
    const cashAllocation = assetAllocation.cash;

    return {
      stockHoldings: totalValue * stocksAllocation,
      bondHoldings: totalValue * bondsAllocation,
      cashHoldings: totalValue * cashAllocation,
    };
  }

  static getTaxableIncomeSources(dp: SimulationDataPoint, age: number): TaxableIncomeSources {
    const portfolioData = dp.portfolio;
    const realizedGains = portfolioData.realizedGainsForPeriod;

    let taxDeferredWithdrawals = 0;
    let earlyRothEarningsWithdrawals = 0;
    let earlyWithdrawals = 0;
    for (const account of Object.values(portfolioData.perAccountData)) {
      switch (account.type) {
        case 'roth401k':
        case 'rothIra': {
          if (age < 59.5) {
            const annualEarningsWithdrawn = account.earningsWithdrawnForPeriod;

            earlyRothEarningsWithdrawals += annualEarningsWithdrawn;
            earlyWithdrawals += annualEarningsWithdrawn;
          }
          break;
        }
        case '401k':
        case 'ira': {
          const annualWithdrawals = account.withdrawalsForPeriod;

          taxDeferredWithdrawals += annualWithdrawals;
          if (age < 59.5) earlyWithdrawals += annualWithdrawals;
          break;
        }
        case 'hsa': {
          const annualWithdrawals = account.withdrawalsForPeriod;

          taxDeferredWithdrawals += annualWithdrawals;
          if (age < 65) earlyWithdrawals += annualWithdrawals;
          break;
        }
        default:
          break;
      }
    }

    const taxableRetirementDistributions = taxDeferredWithdrawals + earlyRothEarningsWithdrawals;

    const returnsData = dp.returns;
    const taxableDividendIncome = returnsData?.yieldAmountsForPeriod.taxable.stocks ?? 0;
    const taxableInterestIncome =
      (returnsData?.yieldAmountsForPeriod.taxable.bonds ?? 0) + (returnsData?.yieldAmountsForPeriod.cashSavings.cash ?? 0);

    const incomesData = dp.incomes;
    const earnedIncome = incomesData?.totalGrossIncome ?? 0;
    const grossIncome = earnedIncome + taxableRetirementDistributions + realizedGains + taxableDividendIncome + taxableInterestIncome;

    return {
      realizedGains,
      taxDeferredWithdrawals,
      earlyRothEarningsWithdrawals,
      earlyWithdrawals,
      taxableDividendIncome,
      taxableInterestIncome,
      earnedIncome,
      grossIncome,
    };
  }

  static getSavingsRate(dp: SimulationDataPoint): number | null {
    const { earnedIncomeAfterTax, operatingCashFlow } = this.getOperatingCashFlowData(dp);
    return earnedIncomeAfterTax > 0 ? operatingCashFlow / earnedIncomeAfterTax : null;
  }

  static getWithdrawalRate(dp: SimulationDataPoint): number | null {
    const portfolioData = dp.portfolio;

    const totalValue = portfolioData.totalValue;
    const annualWithdrawals = portfolioData.withdrawalsForPeriod;

    return totalValue + annualWithdrawals > 0 ? annualWithdrawals / (totalValue + annualWithdrawals) : null;
  }
}
