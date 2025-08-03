import { formatNumber } from '@/lib/utils';
import { FixedReturnsAnalysis } from '@/lib/stores/quick-plan-store';

import MetricsCard from './metrics-card';

interface ResultsMetricsProps {
  fireAnalysis: FixedReturnsAnalysis;
}

export default function ResultsMetrics({ fireAnalysis }: ResultsMetricsProps) {
  return (
    <dl className="mt-4 mb-8 grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-3">
      <MetricsCard name="Progress to FIRE" stat={`${formatNumber(fireAnalysis.progressToFIRE * 100, 0)}%`} />
      <MetricsCard name="FIRE Age" stat={fireAnalysis.fireAge !== null ? `${formatNumber(fireAnalysis.fireAge, 0)}` : '∞'} />
      <MetricsCard name="Years to FIRE" stat={fireAnalysis.yearsToFIRE !== null ? `${formatNumber(fireAnalysis.yearsToFIRE, 0)}` : '∞'} />
      <MetricsCard name="Required Portfolio" stat={`$${formatNumber(fireAnalysis.requiredPortfolio, 2)}`} />
      <MetricsCard name="Final Portfolio" stat={`$${formatNumber(fireAnalysis.finalPortfolio, 2)}`} />
      <MetricsCard name="Return on Investment" stat={`${((fireAnalysis.performance ?? 0) * 100).toFixed(1)}%`} />
    </dl>
  );
}
