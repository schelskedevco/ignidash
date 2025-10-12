import { SimulationCategory } from '@/lib/types/simulation-category';
import type {
  SingleSimulationPortfolioTableRow,
  SingleSimulationCashFlowTableRow,
  SingleSimulationTaxesTableRow,
  SingleSimulationReturnsTableRow,
  SingleSimulationContributionsTableRow,
  SingleSimulationWithdrawalsTableRow,
} from '@/lib/schemas/single-simulation-table-schema';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/multi-simulation-table-schema';
import { SimulationDataExtractor } from '@/lib/utils/simulation-data-extractor';
import { type Percentiles, StatsUtils } from '@/lib/utils/stats-utils';

import type { MultiSimulationAnalysis } from './multi-simulation-analyzer';
import type { SimulationResult, MultiSimulationResult } from './simulation-engine';

export class TableDataExtractor {
  // ================================
  // SINGLE SIMULATION DATA EXTRACTION
  // ================================

  extractSingleSimulationPortfolioData(simulation: SimulationResult): SingleSimulationPortfolioTableRow[] {
    const startAge = simulation.context.startAge;
    const historicalRanges = simulation.context.historicalRanges ?? null;
    const startDateYear = new Date().getFullYear();

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const currDateYear = new Date(data.date).getFullYear();

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      const portfolioData = data.portfolio;
      const totalPortfolioValue = portfolioData.totalValue;
      const annualWithdrawals = portfolioData.withdrawalsForPeriod;
      const annualContributions = portfolioData.contributionsForPeriod;

      let cashSavings = 0;
      let taxableBrokerageHoldings = 0;
      let taxDeferredHoldings = 0;
      let taxFreeHoldings = 0;

      for (const account of Object.values(portfolioData.perAccountData)) {
        switch (account.type) {
          case 'savings':
            cashSavings += account.totalValue;
            break;
          case 'taxableBrokerage':
            taxableBrokerageHoldings += account.totalValue;
            break;
          case '401k':
          case 'ira':
          case 'hsa':
            taxDeferredHoldings += account.totalValue;
            break;
          case 'roth401k':
          case 'rothIra':
            taxFreeHoldings += account.totalValue;
            break;
        }
      }

      const assetAllocation = portfolioData.assetAllocation ?? { stocks: 0, bonds: 0, cash: 0 };
      const stocksAllocation = assetAllocation.stocks;
      const bondsAllocation = assetAllocation.bonds;
      const cashAllocation = assetAllocation.cash;

      const returnsData = data.returns;
      const {
        stocks: stockAmount,
        bonds: bondAmount,
        cash: cashAmount,
      } = returnsData?.returnAmountsForPeriod ?? { stocks: 0, bonds: 0, cash: 0 };

      return {
        year: idx,
        age: currDateYear - startDateYear + startAge,
        phaseName: formattedPhaseName,
        totalPortfolioValue,
        annualReturns: stockAmount + bondAmount + cashAmount,
        annualWithdrawals,
        annualContributions,
        netPortfolioChange: stockAmount + bondAmount + cashAmount + annualContributions - annualWithdrawals,
        stockHoldings: totalPortfolioValue * stocksAllocation,
        bondHoldings: totalPortfolioValue * bondsAllocation,
        cashHoldings: totalPortfolioValue * cashAllocation,
        taxableBrokerageHoldings,
        taxDeferredHoldings,
        taxFreeHoldings,
        cashSavings,
        historicalYear,
      };
    });
  }

  extractSingleSimulationCashFlowData(simulation: SimulationResult): SingleSimulationCashFlowTableRow[] {
    const startAge = simulation.context.startAge;
    const historicalRanges = simulation.context.historicalRanges ?? null;
    const startDateYear = new Date().getFullYear();

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const currDateYear = new Date(data.date).getFullYear();

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

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

      const incomesData = data.incomes;
      const expensesData = data.expenses;
      const taxesData = data.taxes;

      const ordinaryIncome = incomesData?.totalGrossIncome ?? 0;
      const grossIncome = ordinaryIncome + taxDeferredWithdrawals;
      const incomeTax = taxesData?.incomeTaxes.incomeTaxAmount ?? 0;
      const expenses = expensesData?.totalExpenses ?? 0;
      const netIncome = grossIncome - incomeTax;
      const netCashFlow = netIncome - expenses;
      const savingsRate = netIncome > 0 ? (netCashFlow / netIncome) * 100 : null;

      return {
        year: idx,
        age: currDateYear - startDateYear + startAge,
        phaseName: formattedPhaseName,
        ordinaryIncome,
        taxDeferredWithdrawals,
        grossIncome,
        incomeTax,
        netIncome,
        expenses,
        netCashFlow,
        savingsRate,
        historicalYear,
      };
    });
  }

  extractSingleSimulationTaxesData(simulation: SimulationResult): SingleSimulationTaxesTableRow[] {
    const startAge = simulation.context.startAge;
    const historicalRanges = simulation.context.historicalRanges ?? null;
    const startDateYear = new Date().getFullYear();

    let cumulativeIncomeTaxAmount = 0;
    let cumulativeCapGainsTaxAmount = 0;
    let cumulativeTaxAmount = 0;

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const currDateYear = new Date(data.date).getFullYear();

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      const taxesData = data.taxes;

      const annualIncomeTaxAmount = taxesData?.incomeTaxes.incomeTaxAmount ?? 0;
      const annualCapGainsTaxAmount = taxesData?.capitalGainsTaxes.capitalGainsTaxAmount ?? 0;
      const totalAnnualTaxAmount = annualIncomeTaxAmount + annualCapGainsTaxAmount;

      cumulativeIncomeTaxAmount += annualIncomeTaxAmount;
      cumulativeCapGainsTaxAmount += annualCapGainsTaxAmount;
      cumulativeTaxAmount += totalAnnualTaxAmount;

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

      const incomesData = data.incomes;

      const ordinaryIncome = incomesData?.totalGrossIncome ?? 0;
      const realizedCapGains = portfolioData.realizedGainsForPeriod;
      const grossIncome = ordinaryIncome + taxDeferredWithdrawals + realizedCapGains;

      return {
        year: idx,
        age: currDateYear - startDateYear + startAge,
        phaseName: formattedPhaseName,
        grossIncome,
        netIncome: taxesData?.incomeTaxes.netIncome ?? null,
        realizedCapGains,
        netCapGains: taxesData?.capitalGainsTaxes.netCapitalGains ?? null,
        taxableOrdinaryIncome: taxesData?.incomeTaxes.taxableOrdinaryIncome ?? null,
        taxableCapGains: taxesData?.capitalGainsTaxes.taxableCapitalGains ?? null,
        totalTaxableIncome: taxesData?.totalTaxableIncome ?? null,
        annualIncomeTaxAmount,
        cumulativeIncomeTaxAmount,
        annualCapGainsTaxAmount,
        cumulativeCapGainsTaxAmount,
        totalAnnualTaxAmount,
        cumulativeTaxAmount,
        effectiveIncomeTaxRate: taxesData?.incomeTaxes.effectiveIncomeTaxRate ?? null,
        topMarginalIncomeTaxRate: taxesData?.incomeTaxes.topMarginalTaxRate ?? null,
        effectiveCapGainsTaxRate: taxesData?.capitalGainsTaxes.effectiveCapitalGainsTaxRate ?? null,
        topMarginalCapGainsTaxRate: taxesData?.capitalGainsTaxes.topMarginalCapitalGainsTaxRate ?? null,
        capitalLossDeduction: taxesData?.incomeTaxes.capitalLossDeduction ?? null,
        historicalYear,
      };
    });
  }

  extractSingleSimulationReturnsData(simulation: SimulationResult): SingleSimulationReturnsTableRow[] {
    const startAge = simulation.context.startAge;
    const historicalRanges = simulation.context.historicalRanges ?? null;
    const startDateYear = new Date().getFullYear();

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const currDateYear = new Date(data.date).getFullYear();

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      const portfolioData = data.portfolio;
      const totalPortfolioValue = portfolioData.totalValue;

      const assetAllocation = portfolioData.assetAllocation ?? { stocks: 0, bonds: 0, cash: 0 };
      const stocksAllocation = assetAllocation.stocks;
      const bondsAllocation = assetAllocation.bonds;
      const cashAllocation = assetAllocation.cash;

      const returnsData = data.returns;

      return {
        year: idx,
        age: currDateYear - startDateYear + startAge,
        phaseName: formattedPhaseName,
        totalPortfolioValue,
        stockRate: returnsData?.annualReturnRates.stocks ?? null,
        cumulativeStockAmount: returnsData?.totalReturnAmounts.stocks ?? null,
        annualStockAmount: returnsData?.returnAmountsForPeriod.stocks ?? null,
        stockHoldings: totalPortfolioValue * stocksAllocation,
        bondRate: returnsData?.annualReturnRates.bonds ?? null,
        cumulativeBondAmount: returnsData?.totalReturnAmounts.bonds ?? null,
        annualBondAmount: returnsData?.returnAmountsForPeriod.bonds ?? null,
        bondHoldings: totalPortfolioValue * bondsAllocation,
        cashRate: returnsData?.annualReturnRates.cash ?? null,
        cumulativeCashAmount: returnsData?.totalReturnAmounts.cash ?? null,
        annualCashAmount: returnsData?.returnAmountsForPeriod.cash ?? null,
        cashHoldings: totalPortfolioValue * cashAllocation,
        inflationRate: returnsData?.annualInflationRate ?? null,
        historicalYear,
      };
    });
  }

  extractSingleSimulationContributionsData(simulation: SimulationResult): SingleSimulationContributionsTableRow[] {
    const startAge = simulation.context.startAge;
    const historicalRanges = simulation.context.historicalRanges ?? null;
    const startDateYear = new Date().getFullYear();

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const currDateYear = new Date(data.date).getFullYear();

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      const portfolioData = data.portfolio;
      const totalPortfolioValue = portfolioData.totalValue;
      const annualContributions = portfolioData.contributionsForPeriod;

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

      const taxesData = data.taxes;

      const incomeTax = taxesData?.incomeTaxes.incomeTaxAmount ?? 0;
      const capGainsTax = taxesData?.capitalGainsTaxes.capitalGainsTaxAmount ?? 0;
      const earlyWithdrawalPenalties = taxesData?.earlyWithdrawalPenalties.totalPenaltyAmount ?? 0;
      const totalTaxesAndPenalties = incomeTax + capGainsTax + earlyWithdrawalPenalties;

      const incomesData = data.incomes;
      const expensesData = data.expenses;

      const earnedIncome = incomesData?.totalGrossIncome ?? 0;
      const earnedIncomeAfterTax = earnedIncome - totalTaxesAndPenalties;
      const totalExpenses = expensesData?.totalExpenses ?? 0;
      const operatingCashFlow = earnedIncomeAfterTax - totalExpenses;

      return {
        year: idx,
        age: currDateYear - startDateYear + startAge,
        phaseName: formattedPhaseName,
        cumulativeContributions: portfolioData.totalContributions,
        annualContributions,
        taxableBrokerage,
        taxDeferred,
        taxFree,
        cashSavings,
        totalPortfolioValue,
        operatingCashFlow,
        historicalYear,
      };
    });
  }

  extractSingleSimulationWithdrawalsData(simulation: SimulationResult): SingleSimulationWithdrawalsTableRow[] {
    const startAge = simulation.context.startAge;
    const historicalRanges = simulation.context.historicalRanges ?? null;
    const startDateYear = new Date().getFullYear();

    let cumulativeEarlyWithdrawals = 0;
    let cumulativeEarlyWithdrawalPenalties = 0;

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const currDateYear = new Date(data.date).getFullYear();
      const age = currDateYear - startDateYear + startAge;

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      const portfolioData = data.portfolio;
      const totalPortfolioValue = portfolioData.totalValue;
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
            if (age < 59.5) annualEarlyWithdrawals += account.earningsWithdrawnForPeriod;
            break;
        }
      }

      const taxesData = data.taxes;

      const incomeTax = taxesData?.incomeTaxes.incomeTaxAmount ?? 0;
      const capGainsTax = taxesData?.capitalGainsTaxes.capitalGainsTaxAmount ?? 0;
      const earlyWithdrawalPenalties = taxesData?.earlyWithdrawalPenalties.totalPenaltyAmount ?? 0;
      const totalTaxesAndPenalties = incomeTax + capGainsTax + earlyWithdrawalPenalties;

      cumulativeEarlyWithdrawalPenalties += earlyWithdrawalPenalties;
      cumulativeEarlyWithdrawals += annualEarlyWithdrawals;

      const incomesData = data.incomes;
      const expensesData = data.expenses;

      const earnedIncome = incomesData?.totalGrossIncome ?? 0;
      const earnedIncomeAfterTax = earnedIncome - totalTaxesAndPenalties;
      const totalExpenses = expensesData?.totalExpenses ?? 0;
      const operatingCashFlow = earnedIncomeAfterTax - totalExpenses;
      const withdrawalRate =
        totalPortfolioValue + annualWithdrawals > 0 ? (annualWithdrawals / (totalPortfolioValue + annualWithdrawals)) * 100 : null;

      return {
        year: idx,
        age,
        phaseName: formattedPhaseName,
        cumulativeWithdrawals: portfolioData.totalWithdrawals,
        annualWithdrawals: portfolioData.withdrawalsForPeriod,
        cumulativeRealizedGains: portfolioData.totalRealizedGains,
        annualRealizedGains: portfolioData.realizedGainsForPeriod,
        cumulativeRequiredMinimumDistributions: portfolioData.totalRmds,
        annualRequiredMinimumDistributions: portfolioData.rmdsForPeriod,
        cumulativeEarlyWithdrawals,
        annualEarlyWithdrawals,
        cumulativeRothEarningsWithdrawals: portfolioData.totalEarningsWithdrawn,
        annualRothEarningsWithdrawals: portfolioData.earningsWithdrawnForPeriod,
        cumulativeEarlyWithdrawalPenalties,
        annualEarlyWithdrawalPenalties: earlyWithdrawalPenalties,
        taxableBrokerage,
        taxDeferred,
        taxFree,
        cashSavings,
        totalPortfolioValue,
        operatingCashFlow,
        withdrawalRate,
        historicalYear,
      };
    });
  }

  // ================================
  // MULTI SIMULATION DATA EXTRACTION
  // ================================

  extractMultiSimulationData(simulations: MultiSimulationResult, category: SimulationCategory): MultiSimulationTableRow[] {
    return simulations.simulations.map(([seed, result]) => {
      const { data, context } = result;

      const startAge = context.startAge;

      const { retirementAge, bankruptcyAge } = SimulationDataExtractor.getMilestonesData(data, startAge);
      const {
        averageStockReturn,
        averageBondReturn,
        averageCashReturn,
        averageInflationRate,
        minStockReturn,
        maxStockReturn,
        earlyRetirementStockReturn,
      } = SimulationDataExtractor.getAverageReturns(result, retirementAge);

      const lastDp = data[data.length - 1];
      const success = retirementAge !== null && lastDp.portfolio.totalValue > 0.1;
      const historicalRanges = context.historicalRanges ?? null;

      const finalPhaseName = lastDp.phase?.name ?? null;
      const formattedFinalPhaseName = finalPhaseName !== null ? finalPhaseName.charAt(0).toUpperCase() + finalPhaseName.slice(1) : null;

      const { lifetimeIncomeTaxes, lifetimeCapGainsTaxes } = data.reduce(
        (acc, dp) => {
          const incomeTax = dp.taxes?.incomeTaxes.incomeTaxAmount ?? 0;
          const capGainsTax = dp.taxes?.capitalGainsTaxes.capitalGainsTaxAmount ?? 0;

          return {
            lifetimeIncomeTaxes: acc.lifetimeIncomeTaxes + incomeTax,
            lifetimeCapGainsTaxes: acc.lifetimeCapGainsTaxes + capGainsTax,
          };
        },
        { lifetimeIncomeTaxes: 0, lifetimeCapGainsTaxes: 0 }
      );

      const lifetimeTaxes = lifetimeIncomeTaxes + lifetimeCapGainsTaxes;

      return {
        seed,
        success,
        retirementAge,
        bankruptcyAge,
        finalPhaseName: formattedFinalPhaseName,
        finalPortfolioValue: lastDp.portfolio.totalValue,
        minStockReturn,
        maxStockReturn,
        averageStockReturn,
        earlyRetirementStockReturn,
        averageBondReturn,
        averageCashReturn,
        averageInflationRate,
        lifetimeIncomeTaxes,
        lifetimeCapGainsTaxes,
        lifetimeTaxes,
        lifetimeContributions: lastDp.portfolio.totalContributions,
        lifetimeWithdrawals: lastDp.portfolio.totalWithdrawals,
        lifetimeRealizedGains: lastDp.portfolio.totalRealizedGains,
        historicalRanges,
      };
    });
  }

  extractMultiSimulationYearlyAggregateData(
    simulations: MultiSimulationResult,
    analysis: MultiSimulationAnalysis,
    category: SimulationCategory
  ): YearlyAggregateTableRow[] {
    const res: YearlyAggregateTableRow[] = [];

    const simulationLength = simulations.simulations[0][1].data.length;
    const numSimulations = simulations.simulations.length;

    const startAge = simulations.simulations[0][1].context.startAge;
    const startDateYear = new Date().getFullYear();

    for (let i = 0; i < simulationLength; i++) {
      if (simulations.simulations[i][1].data.length !== simulationLength) {
        throw new Error('All simulations must have the same length for yearly aggregate data extraction.');
      }

      const currDateYear = new Date(simulations.simulations[i][1].data[0].date).getFullYear();

      const totalPortfolioValues = simulations.simulations.map(([, sim]) => sim.data[i].portfolio.totalValue);
      const percentiles: Percentiles<number> = StatsUtils.calculatePercentilesFromValues(totalPortfolioValues.sort((a, b) => a - b));

      let accumulationCount = 0;
      let retirementCount = 0;
      let bankruptCount = 0;

      for (const [, sim] of simulations.simulations) {
        const phaseName = sim.data[i].phase?.name;

        if (sim.data[i].portfolio.totalValue <= 0.1) {
          bankruptCount++;
        } else if (!phaseName || phaseName === 'accumulation') {
          accumulationCount++;
        } else if (phaseName === 'retirement') {
          retirementCount++;
        }
      }

      const percentAccumulation = accumulationCount / numSimulations;
      const percentRetirement = retirementCount / numSimulations;
      const percentBankrupt = bankruptCount / numSimulations;

      res.push({
        year: i,
        age: currDateYear - startDateYear + startAge,
        percentAccumulation,
        percentRetirement,
        percentBankrupt,
        p10PortfolioValue: percentiles.p10,
        p25PortfolioValue: percentiles.p25,
        p50PortfolioValue: percentiles.p50,
        p75PortfolioValue: percentiles.p75,
        p90PortfolioValue: percentiles.p90,
      });
    }

    return res;
  }

  private getHistoricalYear(historicalRanges: { startYear: number; endYear: number }[] | null, yearsSinceStart: number): number | null {
    if (!historicalRanges?.length) return null;

    let historicalYear: number | null = null;

    let cumulativeYears = 0;
    for (const range of historicalRanges) {
      const rangeLength = range.endYear - range.startYear + 1;

      if (yearsSinceStart < cumulativeYears + rangeLength) {
        const yearsIntoRange = yearsSinceStart - cumulativeYears;
        historicalYear = range.startYear + yearsIntoRange;
        break;
      }

      cumulativeYears += rangeLength;
    }

    if (historicalYear === null && historicalRanges.length > 0) {
      historicalYear = historicalRanges[historicalRanges.length - 1].endYear;
    }

    return historicalYear;
  }
}
