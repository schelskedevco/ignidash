import { formatNumber } from '@/lib/utils';
import { StochasticAnalysis } from '@/lib/stores/quick-plan-store';

import MetricsCard from './metrics-card';

interface ResultsMetricsProps {
  analysis: StochasticAnalysis | null;
}

export default function ResultsMetrics({ analysis }: ResultsMetricsProps) {
  if (!analysis) {
    return <div className="text-muted-foreground text-center">No analysis data available</div>;
  }

  const successRate = `${formatNumber((analysis.successRate ?? 0) * 100, 0)}%`;
  const progressToFIRE = `${formatNumber(analysis.progressToFIRE * 100, 0)}%`;
  const p50FireAge = analysis.p50FireAge !== null ? `${formatNumber(analysis.p50FireAge, 0)}` : '∞';
  const p50YearsToFIRE = analysis.p50YearsToFIRE !== null ? `${formatNumber(analysis.p50YearsToFIRE, 0)}` : '∞';
  const requiredPortfolio = `$${formatNumber(analysis.requiredPortfolio)}`;
  const finalPortfolio = `$${formatNumber(analysis.finalPortfolio)}`;

  return (
    <>
      <dl className="my-4 grid grid-cols-2 gap-2 2xl:grid-cols-3">
        <MetricsCard name="Success Rate" stat={successRate} />
        <MetricsCard name="Progress to FIRE" stat={progressToFIRE} />
        <MetricsCard
          name="Median FIRE Age"
          stat={p50FireAge}
          statContext={` (in ${p50YearsToFIRE} years)`}
          className="sm:col-span-2 2xl:col-span-1"
        />
        <MetricsCard name="Required Portfolio" stat={requiredPortfolio} className="2xl:col-span-2" />
        <MetricsCard name="Median Final Portfolio" stat={finalPortfolio} className="col-span-2 sm:col-span-1" />
      </dl>
    </>
  );
}
