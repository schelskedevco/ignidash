/**
 * Key metrics extraction for simulation results
 *
 * Computes summary metrics (success rate, retirement age, lifetime taxes, etc.)
 * from single or multi-simulation results for display in the dashboard.
 */

import type { KeyMetrics } from '@/lib/types/key-metrics';
import { SimulationDataExtractor } from '@/lib/calc/data-extractors/simulation-data-extractor';
import { StatsUtils } from '@/lib/utils/stats-utils';

import type { SimulationResult, MultiSimulationResult } from '../simulation-engine';

/** Computes summary metrics from single or multi-simulation results */
export abstract class KeyMetricsExtractor {
  /**
   * Extracts key metrics from a single simulation run
   * @param simulation - A single simulation result
   * @returns Key metrics including success, retirement age, and lifetime taxes
   */
  static extractSingleSimulationMetrics(simulation: SimulationResult): KeyMetrics {
    const { data, context } = simulation;

    const startAge = context.startAge; // Not rounded to integer
    const retirementStrategy = context.retirementStrategy;

    const initialPortfolio = data[0].portfolio.totalValue;
    const finalPortfolio = data[data.length - 1].portfolio.totalValue;

    let retirementAge: number | null = null;
    let yearsToRetirement: number | null = null;

    const { bankruptcyAge, yearsToBankruptcy } = SimulationDataExtractor.getMilestonesData(data, startAge);

    let portfolioAtRetirement: number | null = null;
    let progressToRetirement: number | null = null;

    switch (retirementStrategy.type) {
      case 'fixedAge':
        retirementAge = retirementStrategy.retirementAge;
        yearsToRetirement = retirementAge - Math.floor(startAge);

        progressToRetirement = Math.min(startAge / retirementAge, 1);

        for (const dp of data) {
          const phase = dp.phase;
          if (phase?.name === 'retirement') {
            portfolioAtRetirement = dp.portfolio.totalValue;
            break;
          }
        }

        break;
      case 'swrTarget':
        for (const dp of data) {
          const phase = dp.phase;
          if (phase?.name === 'retirement') {
            ({ retirementAge, yearsToRetirement } = SimulationDataExtractor.getMilestonesData(data, startAge));
            portfolioAtRetirement = dp.portfolio.totalValue;
            break;
          }
        }

        if (portfolioAtRetirement !== null) {
          progressToRetirement = Math.min(initialPortfolio / portfolioAtRetirement, 1);
        }

        break;
    }

    const shortfallOccurred = data.some((dp) => dp.portfolio.shortfall > 0);
    // Success requires: reaching retirement, portfolio above $0.10 at end, and no shortfalls
    const success = Number(retirementAge !== null && finalPortfolio > 0.1 && !shortfallOccurred);

    const { lifetimeTaxesAndPenalties } = SimulationDataExtractor.getLifetimeTaxesAndPenalties(data);

    return {
      success,
      retirementAge,
      yearsToRetirement,
      bankruptcyAge,
      yearsToBankruptcy,
      portfolioAtRetirement,
      lifetimeTaxesAndPenalties,
      finalPortfolio,
      progressToRetirement,
      areValuesMeans: false,
    };
  }

  /**
   * Aggregates key metrics across multiple simulation runs using means
   * @param simulations - Multi-simulation result set (e.g., Monte Carlo)
   * @returns Averaged key metrics with success rate as proportion of successful runs
   */
  static extractMultiSimulationMetrics(simulations: MultiSimulationResult): KeyMetrics {
    const keyMetricsList: KeyMetrics[] = simulations.simulations.map(([, sim]) => this.extractSingleSimulationMetrics(sim));

    const meanOrNull = (getter: (km: KeyMetrics) => number | null): number | null => {
      const values = keyMetricsList.map(getter).filter((v): v is number => v !== null);
      const mean = StatsUtils.mean(values);
      return mean !== -1 ? mean : null;
    };

    return {
      success: keyMetricsList.reduce((sum, km) => sum + km.success, 0) / keyMetricsList.length,
      retirementAge: meanOrNull((km) => km.retirementAge),
      yearsToRetirement: meanOrNull((km) => km.yearsToRetirement),
      bankruptcyAge: meanOrNull((km) => km.bankruptcyAge),
      yearsToBankruptcy: meanOrNull((km) => km.yearsToBankruptcy),
      portfolioAtRetirement: meanOrNull((km) => km.portfolioAtRetirement),
      lifetimeTaxesAndPenalties: StatsUtils.mean(keyMetricsList.map((km) => km.lifetimeTaxesAndPenalties)),
      finalPortfolio: StatsUtils.mean(keyMetricsList.map((km) => km.finalPortfolio)),
      progressToRetirement: meanOrNull((km) => km.progressToRetirement),
      areValuesMeans: true,
    };
  }
}
