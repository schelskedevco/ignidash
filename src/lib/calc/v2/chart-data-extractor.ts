import type {
  SingleSimulationPortfolioChartDataPoint,
  SingleSimulationCashFlowChartDataPoint,
  SingleSimulationTaxesChartDataPoint,
  SingleSimulationReturnsChartDataPoint,
  SingleSimulationContributionsChartDataPoint,
  SingleSimulationWithdrawalsChartDataPoint,
} from '@/lib/types/chart-data-points';

import type { SimulationResult } from './simulation-engine';

export class ChartDataExtractor {
  extractSingleSimulationPortfolioChartData(simulation: SimulationResult): SingleSimulationPortfolioChartDataPoint[] {
    const startAge = simulation.context.startAge;
    const startDateYear = new Date().getFullYear();

    return simulation.data.map((data) => {
      const currDateYear = new Date(data.date).getFullYear();

      const portfolioData = data.portfolio;
      const totalValue = portfolioData.totalValue;

      const assetAllocation = portfolioData.assetAllocation ?? { stocks: 0, bonds: 0, cash: 0 };
      const stocksAllocation = assetAllocation.stocks;
      const bondsAllocation = assetAllocation.bonds;
      const cashAllocation = assetAllocation.cash;

      let cashSavings = 0;
      let taxableBrokerage = 0;
      let taxDeferred = 0;
      let taxFree = 0;

      for (const account of Object.values(portfolioData.perAccountData)) {
        switch (account.type) {
          case 'savings':
            cashSavings += account.totalValue;
            break;
          case 'taxableBrokerage':
            taxableBrokerage += account.totalValue;
            break;
          case '401k':
          case 'ira':
          case 'hsa':
            taxDeferred += account.totalValue;
            break;
          case 'roth401k':
          case 'rothIra':
            taxFree += account.totalValue;
            break;
        }
      }

      return {
        age: currDateYear - startDateYear + startAge,
        stockHoldings: totalValue * stocksAllocation,
        bondHoldings: totalValue * bondsAllocation,
        cashHoldings: totalValue * cashAllocation,
        taxableBrokerage,
        taxDeferred,
        taxFree,
        cashSavings,
        perAccountData: Object.values(portfolioData.perAccountData),
      };
    });
  }

  extractSingleSimulationCashFlowChartData(simulation: SimulationResult): SingleSimulationCashFlowChartDataPoint[] {
    const startAge = simulation.context.startAge;
    const startDateYear = new Date().getFullYear();

    return simulation.data.slice(1).map((data) => {
      const currDateYear = new Date(data.date).getFullYear();

      const portfolioData = data.portfolio;

      let taxDeferredWithdrawals = 0;
      for (const account of Object.values(portfolioData.perAccountData)) {
        switch (account.type) {
          case '401k':
          case 'ira':
          case 'hsa':
            taxDeferredWithdrawals += account.withdrawalsForPeriod;
            break;
          default:
            break;
        }
      }

      const incomesData = data.incomes!;
      const expensesData = data.expenses!;
      const taxesData = data.taxes!;

      const ordinaryIncome = incomesData.totalGrossIncome;
      const grossIncome = ordinaryIncome + taxDeferredWithdrawals;
      const incomeTax = taxesData.incomeTaxes.incomeTaxAmount;
      const expenses = expensesData.totalExpenses;
      const netIncome = grossIncome - incomeTax;
      const netCashFlow = netIncome - expenses;
      const savingsRate = netIncome > 0 ? (netCashFlow / netIncome) * 100 : null;

      return {
        age: currDateYear - startDateYear + startAge,
        perIncomeData: Object.values(incomesData.perIncomeData),
        perExpenseData: Object.values(expensesData.perExpenseData),
        ordinaryIncome,
        taxDeferredWithdrawals,
        grossIncome,
        incomeTax,
        expenses,
        netIncome,
        netCashFlow,
        savingsRate,
      };
    });
  }

  extractSingleSimulationTaxesChartData(simulation: SimulationResult): SingleSimulationTaxesChartDataPoint[] {
    const startAge = simulation.context.startAge;
    const startDateYear = new Date().getFullYear();

    let totalIncomeTaxAmount = 0;
    let totalCapGainsTaxAmount = 0;
    let totalTaxAmount = 0;

    return simulation.data.slice(1).map((data) => {
      const currDateYear = new Date(data.date).getFullYear();

      const taxesData = data.taxes!;

      const annualIncomeTaxAmount = taxesData.incomeTaxes.incomeTaxAmount;
      const annualCapGainsTaxAmount = taxesData.capitalGainsTaxes.capitalGainsTaxAmount;
      const totalAnnualTaxAmount = annualIncomeTaxAmount + annualCapGainsTaxAmount;

      totalIncomeTaxAmount += annualIncomeTaxAmount;
      totalCapGainsTaxAmount += annualCapGainsTaxAmount;
      totalTaxAmount += totalAnnualTaxAmount;

      const portfolioData = data.portfolio;

      let annualTaxDeferredWithdrawals = 0;
      for (const account of Object.values(portfolioData.perAccountData)) {
        switch (account.type) {
          case '401k':
          case 'ira':
          case 'hsa':
            annualTaxDeferredWithdrawals += account.withdrawalsForPeriod;
            break;
          default:
            break;
        }
      }

      const incomesData = data.incomes;

      const ordinaryIncome = incomesData?.totalGrossIncome ?? 0;
      const annualRealizedGains = portfolioData.realizedGainsForPeriod;
      const grossIncome = ordinaryIncome + annualTaxDeferredWithdrawals + annualRealizedGains;

      return {
        age: currDateYear - startDateYear + startAge,
        grossIncome,
        taxableOrdinaryIncome: taxesData.incomeTaxes.taxableOrdinaryIncome,
        annualIncomeTaxAmount,
        totalIncomeTaxAmount,
        effectiveIncomeTaxRate: taxesData.incomeTaxes.effectiveIncomeTaxRate,
        topMarginalIncomeTaxRate: taxesData.incomeTaxes.topMarginalTaxRate,
        netIncome: taxesData.incomeTaxes.netIncome,
        capitalLossDeduction: taxesData.incomeTaxes.capitalLossDeduction,
        taxableCapGains: taxesData.capitalGainsTaxes.taxableCapitalGains,
        annualCapGainsTaxAmount,
        totalCapGainsTaxAmount,
        effectiveCapGainsTaxRate: taxesData.capitalGainsTaxes.effectiveCapitalGainsTaxRate,
        topMarginalCapGainsTaxRate: taxesData.capitalGainsTaxes.topMarginalCapitalGainsTaxRate,
        netCapGains: taxesData.capitalGainsTaxes.netCapitalGains,
        totalTaxableIncome: taxesData.totalTaxableIncome,
        totalAnnualTaxAmount,
        totalTaxAmount,
        totalNetIncome: taxesData.incomeTaxes.netIncome + taxesData.capitalGainsTaxes.netCapitalGains,
        adjustments: taxesData.adjustments,
        deductions: taxesData.deductions,
      };
    });
  }

  extractSingleSimulationReturnsChartData(simulation: SimulationResult): SingleSimulationReturnsChartDataPoint[] {
    const startAge = simulation.context.startAge;
    const startDateYear = new Date().getFullYear();

    return simulation.data.slice(1).map((data) => {
      const currDateYear = new Date(data.date).getFullYear();

      const returnsData = data.returns!;

      return {
        age: currDateYear - startDateYear + startAge,
        stocksRate: returnsData.annualReturnRates.stocks,
        bondsRate: returnsData.annualReturnRates.bonds,
        cashRate: returnsData.annualReturnRates.cash,
        inflationRate: returnsData.annualInflationRate,
        totalStocksAmount: returnsData.totalReturnAmounts.stocks,
        totalBondsAmount: returnsData.totalReturnAmounts.bonds,
        totalCashAmount: returnsData.totalReturnAmounts.cash,
        stocksAmount: returnsData.returnAmountsForPeriod.stocks,
        bondsAmount: returnsData.returnAmountsForPeriod.bonds,
        cashAmount: returnsData.returnAmountsForPeriod.cash,
        perAccountData: Object.values(returnsData.perAccountData),
      };
    });
  }

  extractSingleSimulationContributionsChartData(simulation: SimulationResult): SingleSimulationContributionsChartDataPoint[] {
    const startAge = simulation.context.startAge;
    const startDateYear = new Date().getFullYear();

    return simulation.data.slice(1).map((data) => {
      const currDateYear = new Date(data.date).getFullYear();

      const portfolioData = data.portfolio;

      let cashSavings = 0;
      let taxableBrokerage = 0;
      let taxDeferred = 0;
      let taxFree = 0;

      for (const account of Object.values(portfolioData.perAccountData)) {
        switch (account.type) {
          case 'savings':
            cashSavings += account.contributionsForPeriod;
            break;
          case 'taxableBrokerage':
            taxableBrokerage += account.contributionsForPeriod;
            break;
          case '401k':
          case 'ira':
          case 'hsa':
            taxDeferred += account.contributionsForPeriod;
            break;
          case 'roth401k':
          case 'rothIra':
            taxFree += account.contributionsForPeriod;
            break;
        }
      }

      return {
        age: currDateYear - startDateYear + startAge,
        totalContributions: portfolioData.totalContributions,
        annualContributions: portfolioData.contributionsForPeriod,
        perAccountData: Object.values(portfolioData.perAccountData),
        taxableBrokerage,
        taxDeferred,
        taxFree,
        cashSavings,
      };
    });
  }

  extractSingleSimulationWithdrawalsChartData(simulation: SimulationResult): SingleSimulationWithdrawalsChartDataPoint[] {
    const startAge = simulation.context.startAge;
    const startDateYear = new Date().getFullYear();

    let totalEarlyWithdrawalPenalties = 0;
    let totalEarlyWithdrawals = 0;

    return simulation.data.slice(1).map((data) => {
      const currDateYear = new Date(data.date).getFullYear();
      const age = currDateYear - startDateYear + startAge;

      const portfolioData = data.portfolio;
      const totalValue = portfolioData.totalValue;
      const annualWithdrawals = portfolioData.withdrawalsForPeriod;

      let cashSavings = 0;
      let taxableBrokerage = 0;
      let taxDeferred = 0;
      let taxFree = 0;
      let annualEarlyWithdrawals = 0;

      for (const account of Object.values(portfolioData.perAccountData)) {
        switch (account.type) {
          case 'savings':
            cashSavings += account.withdrawalsForPeriod;
            break;
          case 'taxableBrokerage':
            taxableBrokerage += account.withdrawalsForPeriod;
            break;
          case '401k':
          case 'ira':
            taxDeferred += account.withdrawalsForPeriod;
            if (age < 59.5) annualEarlyWithdrawals += account.withdrawalsForPeriod;
            break;
          case 'hsa':
            taxDeferred += account.withdrawalsForPeriod;
            if (age < 65) annualEarlyWithdrawals += account.withdrawalsForPeriod;
            break;
          case 'roth401k':
          case 'rothIra':
            taxFree += account.withdrawalsForPeriod;
            if (age < 59.5) annualEarlyWithdrawals += account.withdrawalsForPeriod;
            break;
        }
      }

      totalEarlyWithdrawals += annualEarlyWithdrawals;

      const withdrawalRate = totalValue + annualWithdrawals > 0 ? (annualWithdrawals / (totalValue + annualWithdrawals)) * 100 : null;

      const taxesData = data.taxes!;
      const annualEarlyWithdrawalPenalties = taxesData.earlyWithdrawalPenalties.totalPenaltyAmount;
      totalEarlyWithdrawalPenalties += annualEarlyWithdrawalPenalties;

      return {
        age,
        totalWithdrawals: portfolioData.totalWithdrawals,
        annualWithdrawals: portfolioData.withdrawalsForPeriod,
        totalRealizedGains: portfolioData.totalRealizedGains,
        annualRealizedGains: portfolioData.realizedGainsForPeriod,
        totalRequiredMinimumDistributions: portfolioData.totalRmds,
        annualRequiredMinimumDistributions: portfolioData.rmdsForPeriod,
        totalRothEarningsWithdrawals: portfolioData.totalEarningsWithdrawn,
        annualRothEarningsWithdrawals: portfolioData.earningsWithdrawnForPeriod,
        totalEarlyWithdrawalPenalties,
        annualEarlyWithdrawalPenalties,
        totalEarlyWithdrawals,
        annualEarlyWithdrawals,
        perAccountData: Object.values(portfolioData.perAccountData),
        taxableBrokerage,
        taxDeferred,
        taxFree,
        cashSavings,
        withdrawalRate,
      };
    });
  }
}
