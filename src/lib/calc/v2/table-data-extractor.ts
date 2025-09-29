import { SimulationCategory } from '@/lib/types/simulation-category';
import type { SingleSimulationTableRow } from '@/lib/schemas/single-simulation-table-schema';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/multi-simulation-table-schema';
import { SimulationDataExtractor } from '@/lib/utils/simulation-data-extractor';

import type { MultiSimulationAnalysis } from './multi-simulation-analyzer';
import type { SimulationResult, MultiSimulationResult } from './simulation-engine';

export class TableDataExtractor {
  extractSingleSimulationData(simulation: SimulationResult, category: SimulationCategory): SingleSimulationTableRow[] {
    return simulation.data.map((data, idx) => {
      const startAge = simulation.context.startAge;

      const historicalRanges = simulation.context.historicalRanges ?? null;
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);

      const startDateYear = new Date().getFullYear();
      const currDateYear = new Date(data.date).getFullYear();

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      const portfolioData = data.portfolio;
      const portfolioValue = portfolioData.totalValue;

      const assetAllocation = portfolioData.assetAllocation ?? { stocks: 0, bonds: 0, cash: 0 };
      const stocksAllocation = assetAllocation.stocks;
      const bondsAllocation = assetAllocation.bonds;
      const cashAllocation = assetAllocation.cash;

      const returnsData = data.returns;
      const stockReturn = returnsData?.annualReturnRates.stocks ?? null;
      const bondReturn = returnsData?.annualReturnRates.bonds ?? null;
      const cashReturn = returnsData?.annualReturnRates.cash ?? null;
      const inflationRate = returnsData?.annualInflationRate ?? null;

      return {
        year: idx,
        age: currDateYear - startDateYear + startAge,
        phaseName: formattedPhaseName,
        portfolioValue,
        stockValue: portfolioValue * stocksAllocation,
        stockReturn,
        bondValue: portfolioValue * bondsAllocation,
        bondReturn,
        cashValue: portfolioValue * cashAllocation,
        cashReturn,
        inflationRate,
        historicalYear,
      };
    });
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
