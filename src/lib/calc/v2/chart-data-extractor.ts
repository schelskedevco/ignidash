import type {
  SingleSimulationPortfolioChartDataPoint,
  SingleSimulationCashFlowChartDataPoint,
  SingleSimulationTaxesChartDataPoint,
  SingleSimulationReturnsChartDataPoint,
  SingleSimulationContributionsChartDataPoint,
  SingleSimulationWithdrawalsChartDataPoint,
} from '@/lib/types/chart-data-points';
import { SimulationDataExtractor } from '@/lib/utils/simulation-data-extractor';

import type { SimulationResult } from './simulation-engine';

export class ChartDataExtractor {
  extractSingleSimulationPortfolioChartData(simulation: SimulationResult): SingleSimulationPortfolioChartDataPoint[] {
    const startAge = simulation.context.startAge;
    const startDateYear = new Date().getFullYear();

    return simulation.data.map((data) => {
      const currDateYear = new Date(data.date).getFullYear();

      const portfolioData = data.portfolio;

      const { stockHoldings, bondHoldings, cashHoldings } = SimulationDataExtractor.getHoldingsByAssetClass(data);
      const {
        taxableBrokerageHoldings: taxableBrokerage,
        taxDeferredHoldings: taxDeferred,
        taxFreeHoldings: taxFree,
        cashSavings,
      } = SimulationDataExtractor.getHoldingsByTaxCategory(data);

      return {
        age: currDateYear - startDateYear + startAge,
        stockHoldings,
        bondHoldings,
        cashHoldings,
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

      const {
        incomeTaxAmount: incomeTax,
        capGainsTaxAmount: capGainsTax,
        earlyWithdrawalPenaltiesAmount: earlyWithdrawalPenalties,
      } = SimulationDataExtractor.getTaxAmountsByType(data);
      const { earnedIncome, totalExpenses: expenses, operatingCashFlow } = SimulationDataExtractor.getOperatingCashFlowData(data);
      const savingsRate = SimulationDataExtractor.getSavingsRate(data);

      return {
        age: currDateYear - startDateYear + startAge,
        perIncomeData: Object.values(data.incomes!.perIncomeData),
        perExpenseData: Object.values(data.expenses!.perExpenseData),
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

      const {
        incomeTaxAmount: annualIncomeTaxAmount,
        capGainsTaxAmount: annualCapGainsTaxAmount,
        earlyWithdrawalPenaltiesAmount: annualEarlyWithdrawalPenalties,
        totalTaxesAndPenalties: totalAnnualTaxAmount,
      } = SimulationDataExtractor.getTaxAmountsByType(data);

      cumulativeIncomeTaxAmount += annualIncomeTaxAmount;
      cumulativeCapGainsTaxAmount += annualCapGainsTaxAmount;
      cumulativeEarlyWithdrawalPenalties += annualEarlyWithdrawalPenalties;
      cumulativeTotalTaxAmount += totalAnnualTaxAmount;

      const {
        realizedGains,
        taxDeferredWithdrawals,
        earlyTaxFreeEarningsWithdrawals,
        taxableDividendIncome,
        taxableInterestIncome,
        earnedIncome,
        grossIncome,
      } = SimulationDataExtractor.getTaxableIncomeSources(data, age);

      const taxesData = data.taxes!;

      return {
        age,
        earnedIncome,
        grossIncome,
        taxDeferredWithdrawals,
        earlyTaxFreeEarningsWithdrawals,
        taxableInterestIncome,
        taxableOrdinaryIncome: taxesData.incomeTaxes.taxableOrdinaryIncome,
        annualIncomeTaxAmount,
        cumulativeIncomeTaxAmount,
        effectiveIncomeTaxRate: taxesData.incomeTaxes.effectiveIncomeTaxRate,
        topMarginalIncomeTaxRate: taxesData.incomeTaxes.topMarginalTaxRate,
        netIncome: taxesData.incomeTaxes.netIncome,
        realizedGains,
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
      const annualContributions = portfolioData.contributionsForPeriod;

      const {
        taxableBrokerageContributions: taxableBrokerage,
        taxDeferredContributions: taxDeferred,
        taxFreeContributions: taxFree,
        cashSavingsContributions: cashSavings,
      } = SimulationDataExtractor.getContributionsByTaxCategory(data);

      return {
        age: currDateYear - startDateYear + startAge,
        cumulativeContributions: portfolioData.totalContributions,
        annualContributions,
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

      const {
        taxableBrokerageWithdrawals: taxableBrokerage,
        taxDeferredWithdrawals: taxDeferred,
        taxFreeWithdrawals: taxFree,
        cashSavingsWithdrawals: cashSavings,
        earlyWithdrawals: annualEarlyWithdrawals,
      } = SimulationDataExtractor.getWithdrawalsByTaxCategory(data, age);
      cumulativeEarlyWithdrawals += annualEarlyWithdrawals;

      const taxesData = data.taxes!;
      const annualEarlyWithdrawalPenalties = taxesData.earlyWithdrawalPenalties.totalPenaltyAmount;
      cumulativeEarlyWithdrawalPenalties += annualEarlyWithdrawalPenalties;

      const withdrawalRate = SimulationDataExtractor.getWithdrawalRate(data);

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
