import type { KeyMetrics } from '@/lib/types/key-metrics';
import { SimulationDataExtractor } from '@/lib/utils/simulation-data-extractor';
import { StatsUtils } from '@/lib/utils/stats-utils';

import type { SimulationResult, MultiSimulationResult } from './simulation-engine';

export class KeyMetricsExtractor {
  static extractSingleSimulation(simulation: SimulationResult): KeyMetrics {
    const { data, context } = simulation;

    const startAge = context.startAge;
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
        yearsToRetirement = retirementAge - startAge;

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

    const success = Number(retirementAge !== null && finalPortfolio > 0.1);

    const { lifetimeTaxesAndPenalties } = SimulationDataExtractor.getLifetimeTaxesAndPenalties(data);

    return {
      success,
      startAge,
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

  static extractMultiSimulation(simulations: MultiSimulationResult): KeyMetrics {
    const keyMetricsList: KeyMetrics[] = simulations.simulations.map(([, sim]) => this.extractSingleSimulation(sim));

    const avgOrNull = (getter: (km: KeyMetrics) => number | null): number | null => {
      const values = keyMetricsList.map(getter).filter((v): v is number => v !== null);
      const avg = StatsUtils.mean(values);
      return avg !== -1 ? avg : null;
    };

    return {
      success: keyMetricsList.reduce((sum, km) => sum + km.success, 0) / keyMetricsList.length,
      startAge: keyMetricsList[0].startAge,
      retirementAge: avgOrNull((km) => km.retirementAge),
      yearsToRetirement: avgOrNull((km) => km.yearsToRetirement),
      bankruptcyAge: avgOrNull((km) => km.bankruptcyAge),
      yearsToBankruptcy: avgOrNull((km) => km.yearsToBankruptcy),
      portfolioAtRetirement: avgOrNull((km) => km.portfolioAtRetirement),
      lifetimeTaxesAndPenalties: StatsUtils.mean(keyMetricsList.map((km) => km.lifetimeTaxesAndPenalties)),
      finalPortfolio: StatsUtils.mean(keyMetricsList.map((km) => km.finalPortfolio)),
      progressToRetirement: avgOrNull((km) => km.progressToRetirement),
      areValuesMeans: true,
    };
  }
}
