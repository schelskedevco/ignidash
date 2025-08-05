import { formatNumber } from '@/lib/utils';
import { FixedReturnsAnalysis } from '@/lib/stores/quick-plan-store';

import MetricsCard from './metrics-card';

interface ResultsMetricsProps {
  fireAnalysis: FixedReturnsAnalysis;
}

export default function ResultsMetrics({ fireAnalysis }: ResultsMetricsProps) {
  const progressToFIRE = `${formatNumber(fireAnalysis.progressToFIRE * 100, 0)}%`;
  const fireAge = fireAnalysis.fireAge !== null ? `${formatNumber(fireAnalysis.fireAge, 0)}` : '∞';
  const yearsToFIRE = fireAnalysis.yearsToFIRE !== null ? `${formatNumber(fireAnalysis.yearsToFIRE, 0)}` : '∞';
  const requiredPortfolio = `$${formatNumber(fireAnalysis.requiredPortfolio, 2)}`;
  const finalPortfolio = `$${formatNumber(fireAnalysis.finalPortfolio, 2)}`;

  return (
    <dl className="my-4 grid grid-cols-2 gap-2 2xl:grid-cols-3">
      <MetricsCard name="Success" stat={fireAnalysis.success ? 'Yes!' : 'No'} />
      <MetricsCard name="Progress to FIRE" stat={progressToFIRE} />
      <MetricsCard name="FIRE Age" stat={fireAge} statContext={` (in ${yearsToFIRE} years)`} className="sm:col-span-2 2xl:col-span-1" />
      <MetricsCard name="Required Portfolio" stat={requiredPortfolio} className="2xl:col-span-2" />
      <MetricsCard name="Final Portfolio" stat={finalPortfolio} className="col-span-2 sm:col-span-1" />
    </dl>
  );
}
