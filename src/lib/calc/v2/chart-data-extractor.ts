import type {
  SingleSimulationPortfolioChartDataPoint,
  SingleSimulationCashFlowChartDataPoint,
  SingleSimulationTaxesChartDataPoint,
  SingleSimulationReturnsChartDataPoint,
  SingleSimulationContributionsChartDataPoint,
  SingleSimulationWithdrawalsChartDataPoint,
  MultiSimulationPortfolioChartDataPoint,
  MultiSimulationPhasesChartDataPoint,
} from '@/lib/types/chart-data-points';
import { SimulationDataExtractor } from '@/lib/utils/simulation-data-extractor';
import { type Percentiles, StatsUtils } from '@/lib/utils/stats-utils';

import type { SimulationResult, MultiSimulationResult } from './simulation-engine';

export class ChartDataExtractor {
  // ================================
  // SINGLE SIMULATION DATA EXTRACTION
  // ================================

  extractSingleSimulationPortfolioChartData(simulation: SimulationResult): SingleSimulationPortfolioChartDataPoint[] {
    const startAge = simulation.context.startAge;
    const startDateYear = new Date().getFullYear();

    return simulation.data.map((data) => {
      const currDateYear = new Date(data.date).getFullYear();
      const age = currDateYear - startDateYear + startAge;

      const portfolioData = data.portfolio;

      const { stockHoldings, bondHoldings, cashHoldings } = SimulationDataExtractor.getHoldingsByAssetClass(data);
      const {
        taxableBrokerageValue: taxableValue,
        taxDeferredValue,
        taxFreeValue,
        cashSavings,
      } = SimulationDataExtractor.getPortfolioValueByTaxCategory(data);

      return {
        age,
        stockHoldings,
        bondHoldings,
        cashHoldings,
        taxableValue,
        taxDeferredValue,
        taxFreeValue,
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
      const age = currDateYear - startDateYear + startAge;

      const { incomeTax, capGainsTax, earlyWithdrawalPenalties } = SimulationDataExtractor.getTaxAmountsByType(data);
      const { earnedIncome, totalExpenses: expenses, operatingCashFlow } = SimulationDataExtractor.getOperatingCashFlowData(data);
      const savingsRate = SimulationDataExtractor.getSavingsRate(data);

      return {
        age,
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

    let cumulativeIncomeTax = 0;
    let cumulativeCapGainsTax = 0;
    let cumulativeEarlyWithdrawalPenalties = 0;
    let cumulativeTotalTaxesAndPenalties = 0;

    return simulation.data.slice(1).map((data) => {
      const currDateYear = new Date(data.date).getFullYear();
      const age = currDateYear - startDateYear + startAge;

      const {
        incomeTax: annualIncomeTax,
        capGainsTax: annualCapGainsTax,
        earlyWithdrawalPenalties: annualEarlyWithdrawalPenalties,
        totalTaxesAndPenalties: annualTotalTaxesAndPenalties,
      } = SimulationDataExtractor.getTaxAmountsByType(data);

      cumulativeIncomeTax += annualIncomeTax;
      cumulativeCapGainsTax += annualCapGainsTax;
      cumulativeEarlyWithdrawalPenalties += annualEarlyWithdrawalPenalties;
      cumulativeTotalTaxesAndPenalties += annualTotalTaxesAndPenalties;

      const {
        realizedGains,
        taxDeferredWithdrawals,
        earlyRothEarningsWithdrawals,
        totalRetirementDistributions: retirementDistributions,
        dividendIncome,
        interestIncome,
        earnedIncome,
        grossIncome,
        grossOrdinaryIncome,
        grossCapGains,
      } = SimulationDataExtractor.getTaxableIncomeSources(data, age);

      const taxesData = data.taxes!;

      return {
        age,
        grossIncome,
        adjustedGrossIncome: taxesData.adjustedGrossIncome,
        earnedIncome,
        taxDeferredWithdrawals,
        earlyRothEarningsWithdrawals,
        retirementDistributions,
        interestIncome,
        grossOrdinaryIncome,
        taxableOrdinaryIncome: taxesData.incomeTaxes.taxableOrdinaryIncome,
        annualIncomeTax,
        cumulativeIncomeTax,
        effectiveIncomeTaxRate: taxesData.incomeTaxes.effectiveIncomeTaxRate,
        topMarginalIncomeTaxRate: taxesData.incomeTaxes.topMarginalTaxRate,
        realizedGains,
        dividendIncome,
        grossCapGains,
        taxableCapGains: taxesData.capitalGainsTaxes.taxableCapitalGains,
        annualCapGainsTax,
        cumulativeCapGainsTax,
        effectiveCapGainsTaxRate: taxesData.capitalGainsTaxes.effectiveCapitalGainsTaxRate,
        topMarginalCapGainsTaxRate: taxesData.capitalGainsTaxes.topMarginalCapitalGainsTaxRate,
        annualEarlyWithdrawalPenalties,
        cumulativeEarlyWithdrawalPenalties,
        totalTaxableIncome: taxesData.totalTaxableIncome,
        annualTotalTaxesAndPenalties,
        cumulativeTotalTaxesAndPenalties,
        adjustments: taxesData.adjustments,
        deductions: taxesData.deductions,
        taxDeferredContributions: taxesData.adjustments.taxDeferredContributions ?? 0,
        standardDeduction: taxesData.deductions.standardDeduction ?? 0,
        capitalLossDeduction: taxesData.incomeTaxes.capitalLossDeduction ?? 0,
      };
    });
  }

  extractSingleSimulationReturnsChartData(simulation: SimulationResult): SingleSimulationReturnsChartDataPoint[] {
    const startAge = simulation.context.startAge;
    const startDateYear = new Date().getFullYear();

    return simulation.data.slice(1).map((data) => {
      const currDateYear = new Date(data.date).getFullYear();
      const age = currDateYear - startDateYear + startAge;

      const returnsData = data.returns!;

      return {
        age,
        realStockReturn: returnsData.annualReturnRates.stocks,
        realBondReturn: returnsData.annualReturnRates.bonds,
        realCashReturn: returnsData.annualReturnRates.cash,
        inflationRate: returnsData.annualInflationRate,
        cumulativeStockGrowth: returnsData.totalReturnAmounts.stocks,
        cumulativeBondGrowth: returnsData.totalReturnAmounts.bonds,
        cumulativeCashGrowth: returnsData.totalReturnAmounts.cash,
        annualStockGrowth: returnsData.returnAmountsForPeriod.stocks,
        annualBondGrowth: returnsData.returnAmountsForPeriod.bonds,
        annualCashGrowth: returnsData.returnAmountsForPeriod.cash,
        perAccountData: Object.values(returnsData.perAccountData),
      };
    });
  }

  extractSingleSimulationContributionsChartData(simulation: SimulationResult): SingleSimulationContributionsChartDataPoint[] {
    const startAge = simulation.context.startAge;
    const startDateYear = new Date().getFullYear();

    return simulation.data.slice(1).map((data) => {
      const currDateYear = new Date(data.date).getFullYear();
      const age = currDateYear - startDateYear + startAge;

      const portfolioData = data.portfolio;
      const annualContributions = portfolioData.contributionsForPeriod;

      const {
        taxableBrokerageContributions: taxableContributions,
        taxDeferredContributions,
        taxFreeContributions,
        cashSavingsContributions: cashContributions,
      } = SimulationDataExtractor.getContributionsByTaxCategory(data);

      return {
        age,
        cumulativeContributions: portfolioData.totalContributions,
        annualContributions,
        perAccountData: Object.values(portfolioData.perAccountData),
        taxableContributions,
        taxDeferredContributions,
        taxFreeContributions,
        cashContributions,
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
      const annualWithdrawals = portfolioData.withdrawalsForPeriod;

      const {
        taxableBrokerageWithdrawals: taxableWithdrawals,
        taxDeferredWithdrawals,
        taxFreeWithdrawals,
        cashSavingsWithdrawals: cashWithdrawals,
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
        annualWithdrawals,
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
        taxableWithdrawals,
        taxDeferredWithdrawals,
        taxFreeWithdrawals,
        cashWithdrawals,
        withdrawalRate,
      };
    });
  }

  // ================================
  // MULTI SIMULATION DATA EXTRACTION
  // ================================

  extractMultiSimulationPortfolioChartData(simulations: MultiSimulationResult): MultiSimulationPortfolioChartDataPoint[] {
    const res: MultiSimulationPortfolioChartDataPoint[] = [];

    const simulationLength = simulations.simulations[0][1].data.length;

    const startAge = simulations.simulations[0][1].context.startAge;
    const startDateYear = new Date().getFullYear();

    for (let i = 0; i < simulationLength; i++) {
      if (simulations.simulations[i][1].data.length !== simulationLength) {
        throw new Error('All simulations must have the same length for yearly aggregate data extraction.');
      }

      const currDateYear = new Date(simulations.simulations[0][1].data[i].date).getFullYear();

      const totalPortfolioValues = simulations.simulations.map(([, sim]) => sim.data[i].portfolio.totalValue);
      const sortedValues = totalPortfolioValues.sort((a, b) => a - b);
      const percentiles: Percentiles<number> = StatsUtils.calculatePercentilesFromValues(sortedValues);

      res.push({
        age: currDateYear - startDateYear + startAge,
        averageTotalPortfolioValue: StatsUtils.average(totalPortfolioValues),
        minTotalPortfolioValue: StatsUtils.minFromSorted(sortedValues),
        maxTotalPortfolioValue: StatsUtils.maxFromSorted(sortedValues),
        stdDevTotalPortfolioValue: StatsUtils.standardDeviation(totalPortfolioValues),
        p10TotalPortfolioValue: percentiles.p10,
        p25TotalPortfolioValue: percentiles.p25,
        p50TotalPortfolioValue: percentiles.p50,
        p75TotalPortfolioValue: percentiles.p75,
        p90TotalPortfolioValue: percentiles.p90,
      });
    }

    return res;
  }

  extractMultiSimulationPhasesChartData(simulations: MultiSimulationResult): MultiSimulationPhasesChartDataPoint[] {
    const res: MultiSimulationPhasesChartDataPoint[] = [];

    const simulationLength = simulations.simulations[0][1].data.length;

    const startAge = simulations.simulations[0][1].context.startAge;
    const startDateYear = new Date().getFullYear();

    for (let i = 0; i < simulationLength; i++) {
      if (simulations.simulations[i][1].data.length !== simulationLength) {
        throw new Error('All simulations must have the same length for yearly aggregate data extraction.');
      }

      const currDateYear = new Date(simulations.simulations[0][1].data[i].date).getFullYear();

      const { percentAccumulation, percentRetirement, percentBankrupt } = SimulationDataExtractor.getPercentInPhaseForYear(simulations, i);

      res.push({
        age: currDateYear - startDateYear + startAge,
        percentAccumulation,
        percentRetirement,
        percentBankrupt,
      });
    }

    return res;
  }
}
