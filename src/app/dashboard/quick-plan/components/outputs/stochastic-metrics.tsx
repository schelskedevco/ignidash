import { formatNumber } from '@/lib/utils';
import { StochasticAnalysis } from '@/lib/stores/quick-plan-store';

import MetricsCard from './metrics-card';

interface ResultsMetricsProps {
  fireAnalysis: StochasticAnalysis | null;
}

export default function ResultsMetrics({ fireAnalysis }: ResultsMetricsProps) {
  if (!fireAnalysis) {
    return <div className="text-muted-foreground text-center">No analysis data available</div>;
  }

  const successRate = `${formatNumber((fireAnalysis.successRate ?? 0) * 100, 0)}%`;
  const progressToFIRE = `${formatNumber(fireAnalysis.progressToFIRE * 100, 0)}%`;
  const p50FireAge = fireAnalysis.p50FireAge !== null ? `${formatNumber(fireAnalysis.p50FireAge, 0)}` : '∞';
  const p50YearsToFIRE = fireAnalysis.p50YearsToFIRE !== null ? `${formatNumber(fireAnalysis.p50YearsToFIRE, 0)}` : '∞';
  const requiredPortfolio = `$${formatNumber(fireAnalysis.requiredPortfolio)}`;
  const finalPortfolio = `$${formatNumber(fireAnalysis.finalPortfolio)}`;

  return (
    <>
      <dl className="mt-4 mb-8 grid grid-cols-2 gap-2 2xl:grid-cols-3">
        <MetricsCard name="Success Rate" stat={successRate} />
        <MetricsCard name="Progress to FIRE" stat={progressToFIRE} />
        <MetricsCard name="P50 FIRE Age" stat={p50FireAge} />
        <MetricsCard name="P50 Years to FIRE" stat={p50YearsToFIRE} />
        <MetricsCard name="Required Portfolio" stat={requiredPortfolio} />
        <MetricsCard name="P50 Final Portfolio" stat={finalPortfolio} />
      </dl>
    </>
  );
}
