import { SimulationCategory } from '@/lib/types/simulation-category';
import type {
  SingleSimulationTableRow,
  SingleSimulationCashFlowTableRow,
  SingleSimulationTaxesTableRow,
  SingleSimulationReturnsTableRow,
  SingleSimulationContributionsTableRow,
  SingleSimulationWithdrawalsTableRow,
} from '@/lib/schemas/single-simulation-table-schema';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/multi-simulation-table-schema';
import { SimulationDataExtractor } from '@/lib/utils/simulation-data-extractor';

import type { MultiSimulationAnalysis } from './multi-simulation-analyzer';
import type { SimulationResult, MultiSimulationResult } from './simulation-engine';

export class TableDataExtractor {
  extractSingleSimulationData(
    simulation: SimulationResult,
    category: SimulationCategory
  ): (
    | SingleSimulationTableRow
    | SingleSimulationCashFlowTableRow
    | SingleSimulationTaxesTableRow
    | SingleSimulationReturnsTableRow
    | SingleSimulationContributionsTableRow
    | SingleSimulationWithdrawalsTableRow
  )[] {
    switch (category) {
      case SimulationCategory.Portfolio:
        return this.extractSingleSimulationPortfolioData(simulation);
      case SimulationCategory.CashFlow:
        return this.extractSingleSimulationCashFlowData(simulation);
      case SimulationCategory.Taxes:
        return this.extractSingleSimulationTaxesData(simulation);
      case SimulationCategory.Returns:
        return this.extractSingleSimulationReturnsData(simulation);
      case SimulationCategory.Contributions:
        return this.extractSingleSimulationContributionsData(simulation);
      case SimulationCategory.Withdrawals:
        return this.extractSingleSimulationWithdrawalsData(simulation);
      default:
        throw new Error(`Unsupported simulation category: ${category}`);
    }
  }

  private extractSingleSimulationPortfolioData(simulation: SimulationResult): SingleSimulationTableRow[] {
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

  private extractSingleSimulationCashFlowData(simulation: SimulationResult): SingleSimulationCashFlowTableRow[] {
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

      const incomesData = data.incomes!;
      const expensesData = data.expenses!;
      const taxesData = data.taxes!;

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

  private extractSingleSimulationTaxesData(simulation: SimulationResult): SingleSimulationTaxesTableRow[] {
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
      const annualRealizedCapGains = portfolioData.realizedGainsForPeriod;
      const grossIncome = ordinaryIncome + annualTaxDeferredWithdrawals + annualRealizedCapGains;

      return {
        year: idx,
        age: currDateYear - startDateYear + startAge,
        phaseName: formattedPhaseName,
        grossIncome,
        netIncome: taxesData?.incomeTaxes.netIncome ?? null,
        realizedCapGains: annualRealizedCapGains,
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

  private extractSingleSimulationReturnsData(simulation: SimulationResult): SingleSimulationReturnsTableRow[] {
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
        stockAmount: returnsData?.returnAmountsForPeriod.stocks ?? null,
        stockHoldings: totalPortfolioValue * stocksAllocation,
        bondRate: returnsData?.annualReturnRates.bonds ?? null,
        cumulativeBondAmount: returnsData?.totalReturnAmounts.bonds ?? null,
        bondAmount: returnsData?.returnAmountsForPeriod.bonds ?? null,
        bondHoldings: totalPortfolioValue * bondsAllocation,
        cashRate: returnsData?.annualReturnRates.cash ?? null,
        cumulativeCashAmount: returnsData?.totalReturnAmounts.cash ?? null,
        cashAmount: returnsData?.returnAmountsForPeriod.cash ?? null,
        cashHoldings: totalPortfolioValue * cashAllocation,
        inflationRate: returnsData?.annualInflationRate ?? null,
        historicalYear,
      };
    });
  }

  private extractSingleSimulationContributionsData(simulation: SimulationResult): SingleSimulationContributionsTableRow[] {
    throw new Error('Method not implemented.');
  }

  private extractSingleSimulationWithdrawalsData(simulation: SimulationResult): SingleSimulationWithdrawalsTableRow[] {
    throw new Error('Method not implemented.');
  }

  extractMultiSimulationData(simulations: MultiSimulationResult, category: SimulationCategory): MultiSimulationTableRow[] {
    return simulations.simulations.map(([seed, result]) => {
      const { data, context } = result;

      const startAge = context.startAge;

      const { retirementAge, bankruptcyAge } = SimulationDataExtractor.getMilestonesData(data, startAge);
      const { averageStockReturn, averageBondReturn, averageCashReturn, averageInflationRate } =
        SimulationDataExtractor.getAverageReturns(data);

      const lastDp = data[data.length - 1];
      const success = retirementAge !== null && lastDp.portfolio.totalValue > 0.1;
      const historicalRanges = context.historicalRanges ?? null;

      const finalPhaseName = lastDp.phase?.name ?? null;
      const formattedFinalPhaseName = finalPhaseName !== null ? finalPhaseName.charAt(0).toUpperCase() + finalPhaseName.slice(1) : null;

      return {
        seed,
        success,
        retirementAge,
        bankruptcyAge,
        finalPhaseName: formattedFinalPhaseName,
        finalPortfolioValue: lastDp.portfolio.totalValue,
        averageStockReturn,
        averageBondReturn,
        averageCashReturn,
        averageInflationRate,
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

    const startAge = simulations.simulations[0][1].context.startAge;
    const startDateYear = new Date().getFullYear();

    for (let i = 0; i < simulationLength; i++) {
      if (simulations.simulations[i][1].data.length !== simulationLength) {
        throw new Error('All simulations must have the same length for yearly aggregate data extraction.');
      }

      const currDateYear = new Date(simulations.simulations[i][1].data[0].date).getFullYear();

      res.push({
        year: i,
        age: currDateYear - startDateYear + startAge,
        percentAccumulation: 0,
        percentRetirement: 0,
        percentBankrupt: 0,
        p10Portfolio: analysis.results.p10.data[i]?.portfolio.totalValue ?? null,
        p25Portfolio: analysis.results.p25.data[i]?.portfolio.totalValue ?? null,
        p50Portfolio: analysis.results.p50.data[i]?.portfolio.totalValue ?? null,
        p75Portfolio: analysis.results.p75.data[i]?.portfolio.totalValue ?? null,
        p90Portfolio: analysis.results.p90.data[i]?.portfolio.totalValue ?? null,
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
