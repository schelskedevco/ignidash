import { SimulationCategory } from '@/lib/types/simulation-category';
import { SimulationDataExtractor } from '@/lib/utils/simulation-data-extractor';
import { type Percentiles, StatsUtils } from '@/lib/utils/stats-utils';
import type { MonteCarloSortMode } from '@/lib/stores/quick-plan-store';

import type { MultiSimulationResult, SimulationResult } from './simulation-engine';
import { TableDataExtractor } from './table-data-extractor';

export interface MultiSimulationAnalysis {
  success: number;
  results: Percentiles<SimulationResult>;
}

type NormalizedValues = Record<MonteCarloSortMode, number>;

export class MultiSimulationAnalyzer {
  private static buildWeights(sortMode: MonteCarloSortMode) {
    const base: Record<MonteCarloSortMode, number> = {
      finalPortfolioValue: 0,
      retirementAge: 0,
      bankruptcyAge: 0,
      averageStockReturn: 0,
      earlyRetirementStockReturn: 0,
    };

    switch (sortMode) {
      case 'finalPortfolioValue':
        return { ...base, finalPortfolioValue: 1 };
      case 'retirementAge':
        return { ...base, retirementAge: 1 };
      case 'bankruptcyAge':
        return { ...base, bankruptcyAge: 1 };
      case 'averageStockReturn':
        return { ...base, averageStockReturn: 1 };
      case 'earlyRetirementStockReturn':
        return { ...base, earlyRetirementStockReturn: 1 };
    }
  }

  analyzeV2(multiSimulationResult: MultiSimulationResult, sortMode: MonteCarloSortMode): MultiSimulationAnalysis {
    const simulations = multiSimulationResult.simulations;

    const numDataPoints = simulations[0][1]?.data.length;
    if (!numDataPoints) throw new Error('No data points in simulations');

    const extractor = new TableDataExtractor();
    const tableData = extractor.extractMultiSimulationData(multiSimulationResult, SimulationCategory.Portfolio);

    const { min: minFinalPortfolioValue, range: finalPortfolioValueRange } = StatsUtils.getRange(
      tableData,
      (row) => row.finalPortfolioValue
    );
    const { min: minRetirementAge, range: retirementAgeRange } = StatsUtils.getRange(tableData, (row) => row.retirementAge);
    const { min: minBankruptcyAge, range: bankruptcyAgeRange } = StatsUtils.getRange(tableData, (row) => row.bankruptcyAge);
    const { min: minAverageStockReturn, range: averageStockReturnRange } = StatsUtils.getRange(tableData, (row) => row.averageStockReturn);
    const { min: minEarlyRetirementStockReturn, range: earlyRetirementStockReturnRange } = StatsUtils.getRange(
      tableData,
      (row) => row.earlyRetirementStockReturn
    );

    const weights = MultiSimulationAnalyzer.buildWeights(sortMode);

    const sortedSimulations = [...simulations].sort((a, b) => {
      const {
        data: dataA,
        context: { startAge },
      } = a[1];
      const { data: dataB } = b[1];

      const dataALength = dataA.length;
      const dataBLength = dataB.length;

      if (dataALength !== dataBLength) console.warn('Simulations have different lengths');

      const { retirementAge: retirementAgeA, bankruptcyAge: bankruptcyAgeA } = SimulationDataExtractor.getMilestonesData(dataA, startAge);
      const { retirementAge: retirementAgeB, bankruptcyAge: bankruptcyAgeB } = SimulationDataExtractor.getMilestonesData(dataB, startAge);

      const normalizedRetirementAgeA = StatsUtils.normalize(retirementAgeA, minRetirementAge, retirementAgeRange, 0, true);
      const normalizedRetirementAgeB = StatsUtils.normalize(retirementAgeB, minRetirementAge, retirementAgeRange, 0, true);

      const normalizedBankruptcyAgeA = StatsUtils.normalize(bankruptcyAgeA, minBankruptcyAge, bankruptcyAgeRange, 1);
      const normalizedBankruptcyAgeB = StatsUtils.normalize(bankruptcyAgeB, minBankruptcyAge, bankruptcyAgeRange, 1);

      const returnsA = SimulationDataExtractor.getAverageReturns(a[1], retirementAgeA);
      const returnsB = SimulationDataExtractor.getAverageReturns(b[1], retirementAgeB);

      const normalizedAverageStockReturnA = StatsUtils.normalize(
        returnsA.averageStockReturn,
        minAverageStockReturn,
        averageStockReturnRange,
        0
      );
      const normalizedAverageStockReturnB = StatsUtils.normalize(
        returnsB.averageStockReturn,
        minAverageStockReturn,
        averageStockReturnRange,
        0
      );

      const normalizedEarlyRetirementStockReturnA = StatsUtils.normalize(
        returnsA.earlyRetirementStockReturn,
        minEarlyRetirementStockReturn,
        earlyRetirementStockReturnRange,
        0
      );
      const normalizedEarlyRetirementStockReturnB = StatsUtils.normalize(
        returnsB.earlyRetirementStockReturn,
        minEarlyRetirementStockReturn,
        earlyRetirementStockReturnRange,
        0
      );

      const lastDpA = dataA[dataALength - 1];
      const lastDpB = dataB[dataBLength - 1];

      const normalizedFinalPortfolioValueA = StatsUtils.normalize(
        lastDpA.portfolio.totalValue,
        minFinalPortfolioValue,
        finalPortfolioValueRange
      );
      const normalizedFinalPortfolioValueB = StatsUtils.normalize(
        lastDpB.portfolio.totalValue,
        minFinalPortfolioValue,
        finalPortfolioValueRange
      );

      const _successA = Number(retirementAgeA !== null && lastDpA.portfolio.totalValue > 0.1);
      const _successB = Number(retirementAgeB !== null && lastDpB.portfolio.totalValue > 0.1);

      const valuesA: NormalizedValues = {
        finalPortfolioValue: normalizedFinalPortfolioValueA,
        retirementAge: normalizedRetirementAgeA,
        bankruptcyAge: normalizedBankruptcyAgeA,
        averageStockReturn: normalizedAverageStockReturnA,
        earlyRetirementStockReturn: normalizedEarlyRetirementStockReturnA,
      };

      const valuesB: NormalizedValues = {
        finalPortfolioValue: normalizedFinalPortfolioValueB,
        retirementAge: normalizedRetirementAgeB,
        bankruptcyAge: normalizedBankruptcyAgeB,
        averageStockReturn: normalizedAverageStockReturnB,
        earlyRetirementStockReturn: normalizedEarlyRetirementStockReturnB,
      };

      const scoreA = this.calculateScore(valuesA, weights);
      const scoreB = this.calculateScore(valuesB, weights);

      return scoreA - scoreB;
    });

    let successCount = 0;
    for (const [, simResult] of simulations) {
      const finalDp = simResult.data[simResult.data.length - 1];
      if (finalDp.portfolio.totalValue > 0.1 && finalDp.phase?.name === 'retirement') successCount++;
    }

    const results = StatsUtils.calculatePercentilesFromValues(sortedSimulations.map((s) => s[1]));

    return { success: successCount / simulations.length, results };
  }

  private calculateScore(values: NormalizedValues, weights: Record<MonteCarloSortMode, number>): number {
    return (Object.keys(weights) as MonteCarloSortMode[]).reduce((sum, key) => sum + weights[key] * values[key], 0);
  }
}
