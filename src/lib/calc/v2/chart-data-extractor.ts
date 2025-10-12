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

      const taxesData = data.taxes!;

      const incomeTax = taxesData.incomeTaxes.incomeTaxAmount;
      const capGainsTax = taxesData.capitalGainsTaxes.capitalGainsTaxAmount;
      const earlyWithdrawalPenalties = taxesData.earlyWithdrawalPenalties.totalPenaltyAmount;
      const totalTaxesAndPenalties = incomeTax + capGainsTax + earlyWithdrawalPenalties;

      const incomesData = data.incomes!;
      const expensesData = data.expenses!;

      const earnedIncome = incomesData.totalGrossIncome;
      const earnedIncomeAfterTax = earnedIncome - totalTaxesAndPenalties;
      const expenses = expensesData.totalExpenses;
      const operatingCashFlow = earnedIncomeAfterTax - expenses;
      const savingsRate = earnedIncomeAfterTax > 0 ? (operatingCashFlow / earnedIncomeAfterTax) * 100 : null;

      return {
        age: currDateYear - startDateYear + startAge,
        perIncomeData: Object.values(incomesData.perIncomeData),
        perExpenseData: Object.values(expensesData.perExpenseData),
        earnedIncome,
        incomeTax,
        capGainsTax,
        earlyWithdrawalPenalties,
        expenses,
        operatingCashFlow,
        savingsRate,
      };
    });
  }

  extractSingleSimulationTaxesChartData(simulation: SimulationResult): SingleSimulationTaxesChartDataPoint[] {
    const startAge = simulation.context.startAge;
    const startDateYear = new Date().getFullYear();

    let cumulativeIncomeTaxAmount = 0;
    let cumulativeCapGainsTaxAmount = 0;
    let cumulativeEarlyWithdrawalPenalties = 0;
    let cumulativeTotalTaxAmount = 0;

    return simulation.data.slice(1).map((data) => {
      const currDateYear = new Date(data.date).getFullYear();
      const age = currDateYear - startDateYear + startAge;

      const taxesData = data.taxes!;

      const annualIncomeTaxAmount = taxesData.incomeTaxes.incomeTaxAmount;
      const annualCapGainsTaxAmount = taxesData.capitalGainsTaxes.capitalGainsTaxAmount;
      const annualEarlyWithdrawalPenalties = taxesData.earlyWithdrawalPenalties.totalPenaltyAmount;
      const totalAnnualTaxAmount = annualIncomeTaxAmount + annualCapGainsTaxAmount + annualEarlyWithdrawalPenalties;

      cumulativeIncomeTaxAmount += annualIncomeTaxAmount;
      cumulativeCapGainsTaxAmount += annualCapGainsTaxAmount;
      cumulativeEarlyWithdrawalPenalties += annualEarlyWithdrawalPenalties;
      cumulativeTotalTaxAmount += totalAnnualTaxAmount;

      const portfolioData = data.portfolio;
      const annualRealizedGains = portfolioData.realizedGainsForPeriod;

      let annualTaxDeferredWithdrawals = 0;
      let annualEarlyTaxFreeEarningsWithdrawals = 0;
      for (const account of Object.values(portfolioData.perAccountData)) {
        switch (account.type) {
          case 'roth401k':
          case 'rothIra':
            if (age < 59.5) annualEarlyTaxFreeEarningsWithdrawals += account.earningsWithdrawnForPeriod;
            break;
          case '401k':
          case 'ira':
          case 'hsa':
            annualTaxDeferredWithdrawals += account.withdrawalsForPeriod;
            break;
          default:
            break;
        }
      }

      const returnsData = data.returns!;
      const taxableDividendIncome = returnsData.yieldAmountsForPeriod.taxable.stocks;
      const taxableInterestIncome = returnsData.yieldAmountsForPeriod.taxable.bonds + returnsData.yieldAmountsForPeriod.taxable.cash;

      const incomesData = data.incomes!;

      const ordinaryIncome = incomesData.totalGrossIncome;
      const grossIncome =
        ordinaryIncome +
        annualTaxDeferredWithdrawals +
        annualEarlyTaxFreeEarningsWithdrawals +
        annualRealizedGains +
        taxableDividendIncome +
        taxableInterestIncome;

      return {
        age,
        ordinaryIncome,
        grossIncome,
        taxDeferredWithdrawals: annualTaxDeferredWithdrawals,
        earlyTaxFreeEarningsWithdrawals: annualEarlyTaxFreeEarningsWithdrawals,
        taxableInterestIncome,
        taxableOrdinaryIncome: taxesData.incomeTaxes.taxableOrdinaryIncome,
        annualIncomeTaxAmount,
        cumulativeIncomeTaxAmount,
        effectiveIncomeTaxRate: taxesData.incomeTaxes.effectiveIncomeTaxRate,
        topMarginalIncomeTaxRate: taxesData.incomeTaxes.topMarginalTaxRate,
        netIncome: taxesData.incomeTaxes.netIncome,
        realizedGains: annualRealizedGains,
        taxableDividendIncome,
        taxableCapGains: taxesData.capitalGainsTaxes.taxableCapitalGains,
        annualCapGainsTaxAmount,
        cumulativeCapGainsTaxAmount,
        effectiveCapGainsTaxRate: taxesData.capitalGainsTaxes.effectiveCapitalGainsTaxRate,
        topMarginalCapGainsTaxRate: taxesData.capitalGainsTaxes.topMarginalCapitalGainsTaxRate,
        netCapGains: taxesData.capitalGainsTaxes.netCapitalGains,
        annualEarlyWithdrawalPenalties,
        cumulativeEarlyWithdrawalPenalties,
        totalTaxableIncome: taxesData.totalTaxableIncome,
        totalAnnualTaxAmount,
        cumulativeTotalTaxAmount,
        totalNetIncome: taxesData.incomeTaxes.netIncome + taxesData.capitalGainsTaxes.netCapitalGains,
        adjustments: taxesData.adjustments,
        deductions: taxesData.deductions,
        capitalLossDeduction: taxesData.incomeTaxes.capitalLossDeduction,
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
        cumulativeStocksAmount: returnsData.totalReturnAmounts.stocks,
        cumulativeBondsAmount: returnsData.totalReturnAmounts.bonds,
        cumulativeCashAmount: returnsData.totalReturnAmounts.cash,
        annualStocksAmount: returnsData.returnAmountsForPeriod.stocks,
        annualBondsAmount: returnsData.returnAmountsForPeriod.bonds,
        annualCashAmount: returnsData.returnAmountsForPeriod.cash,
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
        cumulativeContributions: portfolioData.totalContributions,
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

    let cumulativeEarlyWithdrawalPenalties = 0;
    let cumulativeEarlyWithdrawals = 0;

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

      const taxesData = data.taxes!;
      const annualEarlyWithdrawalPenalties = taxesData.earlyWithdrawalPenalties.totalPenaltyAmount;
      cumulativeEarlyWithdrawalPenalties += annualEarlyWithdrawalPenalties;
      cumulativeEarlyWithdrawals += annualEarlyWithdrawals;

      const withdrawalRate = totalValue + annualWithdrawals > 0 ? (annualWithdrawals / (totalValue + annualWithdrawals)) * 100 : null;

      return {
        age,
        cumulativeWithdrawals: portfolioData.totalWithdrawals,
        annualWithdrawals: portfolioData.withdrawalsForPeriod,
        cumulativeRealizedGains: portfolioData.totalRealizedGains,
        annualRealizedGains: portfolioData.realizedGainsForPeriod,
        cumulativeRequiredMinimumDistributions: portfolioData.totalRmds,
        annualRequiredMinimumDistributions: portfolioData.rmdsForPeriod,
        cumulativeRothEarningsWithdrawals: portfolioData.totalEarningsWithdrawn,
        annualRothEarningsWithdrawals: portfolioData.earningsWithdrawnForPeriod,
        cumulativeEarlyWithdrawalPenalties,
        annualEarlyWithdrawalPenalties,
        cumulativeEarlyWithdrawals,
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
