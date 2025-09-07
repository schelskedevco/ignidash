import { formatNumber } from '@/lib/utils';
import { useTimelinesData } from '@/lib/stores/quick-plan-store';
import { SimulationResult } from '@/lib/calc/v2/simulation-engine';

import MetricsCard from './metrics-card';

interface SingleSimulationMetricsProps {
  result: SimulationResult;
}

export default function SingleSimulationMetrics({ result }: SingleSimulationMetricsProps) {
  const timelines = useTimelinesData();
  const timeline = Object.values(timelines)[0];

  const currentAge = timeline.currentAge;
  const retirementStrategy = timeline.retirementStrategy;

  let yearsToRetirement: number | null = null;
  let retirementAge: number | null = null;
  let portfolioAtRetirement: number | null = null;

  switch (retirementStrategy.type) {
    case 'fixedAge':
      retirementAge = retirementStrategy.retirementAge;
      yearsToRetirement = retirementAge - currentAge;

      for (const dp of result.data) {
        const phase = dp.phase;
        if (phase?.name === 'retirement') {
          portfolioAtRetirement = dp.portfolio.totalValue;
          break;
        }
      }

      break;
    case 'swrTarget':
      for (const dp of result.data) {
        const phase = dp.phase;
        if (phase?.name === 'retirement') {
          const retirementDate = new Date(dp.date);

          yearsToRetirement = retirementDate.getFullYear() - new Date().getFullYear();
          retirementAge = currentAge + yearsToRetirement;
          portfolioAtRetirement = dp.portfolio.totalValue;
          break;
        }
      }
      break;
  }

  const initialPortfolio = result.data[0].portfolio.totalValue;
  const finalPortfolio = result.data[result.data.length - 1].portfolio.totalValue;

  const progressToRetirementForDisplay =
    portfolioAtRetirement !== null ? `${formatNumber(Math.min(initialPortfolio / portfolioAtRetirement, 1) * 100, 0)}%` : 'N/A';
  const retirementAgeForDisplay = retirementAge !== null ? `${formatNumber(retirementAge, 0)}` : '∞';
  const yearsToRetirementForDisplay = yearsToRetirement !== null ? `${formatNumber(yearsToRetirement, 0)}` : '∞';
  const portfolioAtRetirementForDisplay = portfolioAtRetirement !== null ? `$${formatNumber(portfolioAtRetirement, 2)}` : 'N/A';
  const finalPortfolioForDisplay = `$${formatNumber(finalPortfolio, 2)}`;

  return (
    <dl className="my-4 grid grid-cols-2 gap-2 2xl:grid-cols-3">
      <MetricsCard name="Success" stat={'Yes!'} />
      <MetricsCard name="Progress to Retirement" stat={progressToRetirementForDisplay} />
      <MetricsCard
        name="Retirement Age"
        stat={retirementAgeForDisplay}
        statContext={` (in ${yearsToRetirementForDisplay} years)`}
        className="sm:col-span-2 2xl:col-span-1"
      />
      <MetricsCard name="Required Portfolio" stat={portfolioAtRetirementForDisplay} className="2xl:col-span-2" />
      <MetricsCard name="Final Portfolio" stat={finalPortfolioForDisplay} className="col-span-2 sm:col-span-1" />
    </dl>
  );
}
