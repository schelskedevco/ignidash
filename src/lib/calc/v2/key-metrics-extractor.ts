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
    };
  }

  static extractMultiSimulation(simulations: MultiSimulationResult): KeyMetrics {
    const keyMetricsList: KeyMetrics[] = simulations.simulations.map(([, sim]) => this.extractSingleSimulation(sim));

    const retirementAges = keyMetricsList.map((km) => km.retirementAge).filter((v): v is number => v !== null);
    const yearsToRetirement = keyMetricsList.map((km) => km.yearsToRetirement).filter((v): v is number => v !== null);
    const bankruptcyAges = keyMetricsList.map((km) => km.bankruptcyAge).filter((v): v is number => v !== null);
    const yearsToBankruptcy = keyMetricsList.map((km) => km.yearsToBankruptcy).filter((v): v is number => v !== null);
    const portfoliosAtRetirement = keyMetricsList.map((km) => km.portfolioAtRetirement).filter((v): v is number => v !== null);
    const lifetimeTaxesAndPenalties = keyMetricsList.map((km) => km.lifetimeTaxesAndPenalties);
    const finalPortfolios = keyMetricsList.map((km) => km.finalPortfolio);
    const progressToRetirement = keyMetricsList.map((km) => km.progressToRetirement).filter((v): v is number => v !== null);

    const aggregatedMetrics: KeyMetrics = {
      success: keyMetricsList.reduce((sum, km) => sum + km.success, 0) / keyMetricsList.length,
      startAge: keyMetricsList[0].startAge,
      retirementAge: StatsUtils.average(retirementAges),
      yearsToRetirement: StatsUtils.average(yearsToRetirement),
      bankruptcyAge: StatsUtils.average(bankruptcyAges),
      yearsToBankruptcy: StatsUtils.average(yearsToBankruptcy),
      portfolioAtRetirement: StatsUtils.average(portfoliosAtRetirement),
      lifetimeTaxesAndPenalties: StatsUtils.average(lifetimeTaxesAndPenalties),
      finalPortfolio: StatsUtils.average(finalPortfolios),
      progressToRetirement: StatsUtils.average(progressToRetirement),
    };

    return aggregatedMetrics;
  }
}
