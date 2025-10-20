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

  static extractMultiSimulation(simulations: MultiSimulationResult, mode: 'average' | 'percentiles'): KeyMetrics {
    const keyMetricsList: KeyMetrics[] = simulations.simulations.map(([, sim]) => this.extractSingleSimulation(sim));

    const sortedRetirementAgesAndYears = keyMetricsList
      .filter((km) => km.retirementAge !== null && km.yearsToRetirement !== null)
      .map((km) => ({ retirementAge: km.retirementAge!, yearsToRetirement: km.yearsToRetirement! }))
      .sort((a, b) => a.retirementAge - b.retirementAge);
    const retirementAgesAndYearsPercentiles = StatsUtils.calculatePercentilesFromValues(sortedRetirementAgesAndYears);

    const sortedBankruptcyAgesAndYears = keyMetricsList
      .filter((km) => km.bankruptcyAge !== null && km.yearsToBankruptcy !== null)
      .map((km) => ({ bankruptcyAge: km.bankruptcyAge!, yearsToBankruptcy: km.yearsToBankruptcy! }))
      .sort((a, b) => a.bankruptcyAge - b.bankruptcyAge);
    const bankruptcyAgesAndYearsPercentiles = StatsUtils.calculatePercentilesFromValues(sortedBankruptcyAgesAndYears);

    const sortedPortfoliosAtRetirement = keyMetricsList
      .filter((km) => km.portfolioAtRetirement !== null)
      .map((km) => km.portfolioAtRetirement!)
      .sort((a, b) => a - b);
    const portfoliosAtRetirementPercentiles = StatsUtils.calculatePercentilesFromValues(sortedPortfoliosAtRetirement);

    const sortedLifetimeTaxesAndPenalties = keyMetricsList.map((km) => km.lifetimeTaxesAndPenalties).sort((a, b) => a - b);
    const lifetimeTaxesAndPenaltiesPercentiles = StatsUtils.calculatePercentilesFromValues(sortedLifetimeTaxesAndPenalties);

    const sortedFinalPortfolios = keyMetricsList.map((km) => km.finalPortfolio).sort((a, b) => a - b);
    const finalPortfoliosPercentiles = StatsUtils.calculatePercentilesFromValues(sortedFinalPortfolios);

    const sortedProgressToRetirement = keyMetricsList
      .filter((km) => km.progressToRetirement !== null)
      .map((km) => km.progressToRetirement!)
      .sort((a, b) => a - b);
    const progressToRetirementPercentiles = StatsUtils.calculatePercentilesFromValues(sortedProgressToRetirement);

    const aggregatedMetrics: KeyMetrics = {
      success: keyMetricsList.reduce((sum, km) => sum + km.success, 0) / keyMetricsList.length,
      startAge: keyMetricsList[0].startAge,
      retirementAge: retirementAgesAndYearsPercentiles.p50.retirementAge,
      yearsToRetirement: retirementAgesAndYearsPercentiles.p50.yearsToRetirement,
      bankruptcyAge: bankruptcyAgesAndYearsPercentiles.p50.bankruptcyAge,
      yearsToBankruptcy: bankruptcyAgesAndYearsPercentiles.p50.yearsToBankruptcy,
      portfolioAtRetirement: portfoliosAtRetirementPercentiles.p50,
      lifetimeTaxesAndPenalties: lifetimeTaxesAndPenaltiesPercentiles.p50,
      finalPortfolio: finalPortfoliosPercentiles.p50,
      progressToRetirement: progressToRetirementPercentiles.p50,
    };

    return aggregatedMetrics;
  }

  private static extractMultiSimulationByPercentile(simulations: MultiSimulationResult): KeyMetrics {
    const keyMetricsList: KeyMetrics[] = simulations.simulations.map(([, sim]) => this.extractSingleSimulation(sim));

    const sortedRetirementAgesAndYears = keyMetricsList
      .filter((km) => km.retirementAge !== null && km.yearsToRetirement !== null)
      .map((km) => ({ retirementAge: km.retirementAge!, yearsToRetirement: km.yearsToRetirement! }))
      .sort((a, b) => a.retirementAge - b.retirementAge);
    const retirementAgesAndYearsPercentiles = StatsUtils.calculatePercentilesFromValues(sortedRetirementAgesAndYears);

    const sortedBankruptcyAgesAndYears = keyMetricsList
      .filter((km) => km.bankruptcyAge !== null && km.yearsToBankruptcy !== null)
      .map((km) => ({ bankruptcyAge: km.bankruptcyAge!, yearsToBankruptcy: km.yearsToBankruptcy! }))
      .sort((a, b) => a.bankruptcyAge - b.bankruptcyAge);
    const bankruptcyAgesAndYearsPercentiles = StatsUtils.calculatePercentilesFromValues(sortedBankruptcyAgesAndYears);

    const sortedPortfoliosAtRetirement = keyMetricsList
      .filter((km) => km.portfolioAtRetirement !== null)
      .map((km) => km.portfolioAtRetirement!)
      .sort((a, b) => a - b);
    const portfoliosAtRetirementPercentiles = StatsUtils.calculatePercentilesFromValues(sortedPortfoliosAtRetirement);

    const sortedLifetimeTaxesAndPenalties = keyMetricsList.map((km) => km.lifetimeTaxesAndPenalties).sort((a, b) => a - b);
    const lifetimeTaxesAndPenaltiesPercentiles = StatsUtils.calculatePercentilesFromValues(sortedLifetimeTaxesAndPenalties);

    const sortedFinalPortfolios = keyMetricsList.map((km) => km.finalPortfolio).sort((a, b) => a - b);
    const finalPortfoliosPercentiles = StatsUtils.calculatePercentilesFromValues(sortedFinalPortfolios);

    const sortedProgressToRetirement = keyMetricsList
      .filter((km) => km.progressToRetirement !== null)
      .map((km) => km.progressToRetirement!)
      .sort((a, b) => a - b);
    const progressToRetirementPercentiles = StatsUtils.calculatePercentilesFromValues(sortedProgressToRetirement);

    const aggregatedMetrics: KeyMetrics = {
      success: keyMetricsList.reduce((sum, km) => sum + km.success, 0) / keyMetricsList.length,
      startAge: keyMetricsList[0].startAge,
      retirementAge: retirementAgesAndYearsPercentiles.p50.retirementAge,
      yearsToRetirement: retirementAgesAndYearsPercentiles.p50.yearsToRetirement,
      bankruptcyAge: bankruptcyAgesAndYearsPercentiles.p50.bankruptcyAge,
      yearsToBankruptcy: bankruptcyAgesAndYearsPercentiles.p50.yearsToBankruptcy,
      portfolioAtRetirement: portfoliosAtRetirementPercentiles.p50,
      lifetimeTaxesAndPenalties: lifetimeTaxesAndPenaltiesPercentiles.p50,
      finalPortfolio: finalPortfoliosPercentiles.p50,
      progressToRetirement: progressToRetirementPercentiles.p50,
    };

    return aggregatedMetrics;
  }

  private static extractMultiSimulationByAverage(simulations: MultiSimulationResult): KeyMetrics {
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
