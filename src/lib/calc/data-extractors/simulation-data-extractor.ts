import type { MultiSimulationResult, SimulationDataPoint, SimulationResult } from '@/lib/calc/simulation-engine';

export interface MilestonesData {
  yearsToRetirement: number | null;
  retirementAge: number | null;
  yearsToBankruptcy: number | null;
  bankruptcyAge: number | null;
}

export interface ReturnsStatsData {
  meanStockReturn: number | null;
  meanBondReturn: number | null;
  meanCashReturn: number | null;
  meanInflationRate: number | null;
  minStockReturn: number;
  maxStockReturn: number;
  earlyRetirementStockReturn: number | null;
}

export interface CashFlowData {
  totalIncomeFromIncomes: number;
  earnedIncome: number;
  socialSecurityIncome: number;
  taxExemptIncome: number;
  totalExpenses: number;
  totalTaxesAndPenalties: number;
  cashFlow: number;
}

export interface TaxAmountsByType {
  incomeTax: number;
  ficaTax: number;
  capGainsTax: number;
  niit: number;
  totalTaxes: number;
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

export interface PortfolioValueByTaxCategory {
  cashSavings: number;
  taxableBrokerageValue: number;
  taxDeferredValue: number;
  taxFreeValue: number;
}

export interface HoldingsByAssetClass {
  stockHoldings: number;
  bondHoldings: number;
  cashHoldings: number;
}

export interface LifetimeTaxAmounts {
  lifetimeIncomeTaxes: number;
  lifetimeFicaTaxes: number;
  lifetimeCapGainsTaxes: number;
  lifetimeNiit: number;
  lifetimeEarlyWithdrawalPenalties: number;
  lifetimeTaxesAndPenalties: number;
}

export interface PercentInPhaseForYear {
  percentAccumulation: number;
  numberAccumulation: number;
  percentRetirement: number;
  numberRetirement: number;
  percentBankrupt: number;
  numberBankrupt: number;
}

export class SimulationDataExtractor {
  static getMilestonesData(data: SimulationDataPoint[], startAge: number): MilestonesData {
    let yearsToRetirement: number | null = null;
    let retirementAge: number | null = null;
    let yearsToBankruptcy: number | null = null;
    let bankruptcyAge: number | null = null;

    for (const dp of data) {
      if (dp.phase?.name === 'retirement' && retirementAge === null) {
        retirementAge = Math.floor(dp.age);
        yearsToRetirement = retirementAge - Math.floor(startAge);
      }

      if (dp.portfolio.totalValue <= 0.1 && bankruptcyAge === null) {
        bankruptcyAge = Math.floor(dp.age);
        yearsToBankruptcy = bankruptcyAge - Math.floor(startAge);
      }
    }

    return { yearsToRetirement, retirementAge, yearsToBankruptcy, bankruptcyAge };
  }

  static getMeanReturnsData(result: SimulationResult, retirementAge: number | null): ReturnsStatsData {
    const { data } = result;

    const { stocks, bonds, cash, inflation, count, minStockReturn, maxStockReturn, earlyRetirementStocks, yearsOfEarlyRetirement } = data
      .slice(1)
      .reduce(
        (acc, dp) => {
          const age = Math.floor(dp.age);

          const returnsData = dp.returns!;
          const stockReturn = returnsData.annualReturnRates.stocks;

          let earlyRetirementStocks = acc.earlyRetirementStocks;
          let yearsOfEarlyRetirement = acc.yearsOfEarlyRetirement;
          if (retirementAge !== null && age > retirementAge && age < retirementAge + 5) {
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

    const meanStockReturn = count > 0 ? stocks / count : null;
    const meanBondReturn = count > 0 ? bonds / count : null;
    const meanCashReturn = count > 0 ? cash / count : null;
    const meanInflationRate = count > 0 ? inflation / count : null;
    const earlyRetirementStockReturn = yearsOfEarlyRetirement > 0 ? earlyRetirementStocks / yearsOfEarlyRetirement : null;

    return {
      meanStockReturn,
      meanBondReturn,
      meanCashReturn,
      meanInflationRate,
      minStockReturn,
      maxStockReturn,
      earlyRetirementStockReturn,
    };
  }

  static getTaxAmountsByType(dp: SimulationDataPoint): TaxAmountsByType {
    const taxesData = dp.taxes;
    const incomesData = dp.incomes;

    const incomeTax = taxesData?.incomeTaxes.incomeTaxAmount ?? 0;
    const ficaTax = incomesData?.totalFicaTax ?? 0;
    const capGainsTax = taxesData?.capitalGainsTaxes.capitalGainsTaxAmount ?? 0;
    const niit = taxesData?.niit.niitAmount ?? 0;
    const totalTaxes = incomeTax + ficaTax + capGainsTax + niit;
    const earlyWithdrawalPenalties = taxesData?.earlyWithdrawalPenalties.totalPenaltyAmount ?? 0;
    const totalTaxesAndPenalties = totalTaxes + earlyWithdrawalPenalties;

    return { incomeTax, ficaTax, capGainsTax, niit, totalTaxes, earlyWithdrawalPenalties, totalTaxesAndPenalties };
  }

  static getCashFlowData(dp: SimulationDataPoint): CashFlowData {
    const incomesData = dp.incomes;
    const expensesData = dp.expenses;

    const { totalTaxesAndPenalties } = this.getTaxAmountsByType(dp);

    const totalIncomeFromIncomes = incomesData?.totalIncome ?? 0;
    const socialSecurityIncome = incomesData?.totalSocialSecurityIncome ?? 0;
    const taxExemptIncome = incomesData?.totalTaxExemptIncome ?? 0;
    const earnedIncome = totalIncomeFromIncomes - socialSecurityIncome - taxExemptIncome;

    const totalExpenses = expensesData?.totalExpenses ?? 0;

    const cashFlow = totalIncomeFromIncomes - totalExpenses - totalTaxesAndPenalties;

    return { totalIncomeFromIncomes, earnedIncome, socialSecurityIncome, taxExemptIncome, totalExpenses, totalTaxesAndPenalties, cashFlow };
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
        case '403b':
        case 'ira':
        case 'hsa':
          taxDeferredContributions += account.contributionsForPeriod;
          break;
        case 'roth401k':
        case 'roth403b':
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
        case '403b':
        case 'ira':
          taxDeferredWithdrawals += account.withdrawalsForPeriod;
          if (age < 59.5) earlyWithdrawals += account.withdrawalsForPeriod;
          break;
        case 'hsa':
          taxDeferredWithdrawals += account.withdrawalsForPeriod;
          if (age < 65) earlyWithdrawals += account.withdrawalsForPeriod;
          break;
        case 'roth401k':
        case 'roth403b':
        case 'rothIra':
          taxFreeWithdrawals += account.withdrawalsForPeriod;
          if (age < 59.5) earlyWithdrawals += account.earningsWithdrawnForPeriod;
          break;
      }
    }

    return { cashSavingsWithdrawals, taxableBrokerageWithdrawals, taxDeferredWithdrawals, taxFreeWithdrawals, earlyWithdrawals };
  }

  static getPortfolioValueByTaxCategory(dp: SimulationDataPoint): PortfolioValueByTaxCategory {
    const portfolioData = dp.portfolio;

    let cashSavings = 0;
    let taxableBrokerageValue = 0;
    let taxDeferredValue = 0;
    let taxFreeValue = 0;

    for (const account of Object.values(portfolioData.perAccountData)) {
      switch (account.type) {
        case 'savings':
          cashSavings += account.balance;
          break;
        case 'taxableBrokerage':
          taxableBrokerageValue += account.balance;
          break;
        case '401k':
        case '403b':
        case 'ira':
        case 'hsa':
          taxDeferredValue += account.balance;
          break;
        case 'roth401k':
        case 'roth403b':
        case 'rothIra':
          taxFreeValue += account.balance;
          break;
      }
    }

    return { cashSavings, taxableBrokerageValue, taxDeferredValue, taxFreeValue };
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

  static getLifetimeTaxesAndPenalties(data: SimulationDataPoint[]): LifetimeTaxAmounts {
    const { lifetimeIncomeTaxes, lifetimeFicaTaxes, lifetimeCapGainsTaxes, lifetimeNiit, lifetimeEarlyWithdrawalPenalties } = data.reduce(
      (acc, dp) => {
        const incomeTax = dp.taxes?.incomeTaxes.incomeTaxAmount ?? 0;
        const ficaTax = dp.incomes?.totalFicaTax ?? 0;
        const capGainsTax = dp.taxes?.capitalGainsTaxes.capitalGainsTaxAmount ?? 0;
        const niit = dp.taxes?.niit.niitAmount ?? 0;
        const earlyWithdrawalPenalty = dp.taxes?.earlyWithdrawalPenalties.totalPenaltyAmount ?? 0;

        return {
          lifetimeIncomeTaxes: acc.lifetimeIncomeTaxes + incomeTax,
          lifetimeFicaTaxes: acc.lifetimeFicaTaxes + ficaTax,
          lifetimeCapGainsTaxes: acc.lifetimeCapGainsTaxes + capGainsTax,
          lifetimeNiit: acc.lifetimeNiit + niit,
          lifetimeEarlyWithdrawalPenalties: acc.lifetimeEarlyWithdrawalPenalties + earlyWithdrawalPenalty,
        };
      },
      {
        lifetimeIncomeTaxes: 0,
        lifetimeFicaTaxes: 0,
        lifetimeCapGainsTaxes: 0,
        lifetimeNiit: 0,
        lifetimeEarlyWithdrawalPenalties: 0,
      }
    );

    const lifetimeTaxesAndPenalties =
      lifetimeIncomeTaxes + lifetimeFicaTaxes + lifetimeCapGainsTaxes + lifetimeNiit + lifetimeEarlyWithdrawalPenalties;

    return {
      lifetimeIncomeTaxes,
      lifetimeFicaTaxes,
      lifetimeCapGainsTaxes,
      lifetimeNiit,
      lifetimeEarlyWithdrawalPenalties,
      lifetimeTaxesAndPenalties,
    };
  }

  static getSavingsRate(dp: SimulationDataPoint): number | null {
    const { totalIncomeFromIncomes, totalTaxesAndPenalties, cashFlow } = this.getCashFlowData(dp);
    const totalIncomeMinusTaxes = totalIncomeFromIncomes - totalTaxesAndPenalties;
    return totalIncomeMinusTaxes > 0 ? cashFlow / totalIncomeMinusTaxes : null;
  }

  static getWithdrawalRate(dp: SimulationDataPoint): number | null {
    const portfolioData = dp.portfolio;

    const totalValue = portfolioData.totalValue;
    const annualWithdrawals = portfolioData.withdrawalsForPeriod;

    return totalValue + annualWithdrawals > 0 ? annualWithdrawals / (totalValue + annualWithdrawals) : null;
  }

  static getPercentInPhaseForYear(simulations: MultiSimulationResult, year: number): PercentInPhaseForYear {
    const numSimulations = simulations.simulations.length;

    let numberAccumulation = 0;
    let numberRetirement = 0;
    let numberBankrupt = 0;

    for (const [, sim] of simulations.simulations) {
      const phaseName = sim.data[year].phase?.name;

      if (sim.data[year].portfolio.totalValue <= 0.1) {
        numberBankrupt++;
      } else if (!phaseName || phaseName === 'accumulation') {
        numberAccumulation++;
      } else if (phaseName === 'retirement') {
        numberRetirement++;
      }
    }

    const percentAccumulation = numberAccumulation / numSimulations;
    const percentRetirement = numberRetirement / numSimulations;
    const percentBankrupt = numberBankrupt / numSimulations;

    return {
      percentAccumulation,
      numberAccumulation,
      percentRetirement,
      numberRetirement,
      percentBankrupt,
      numberBankrupt,
    };
  }
}
