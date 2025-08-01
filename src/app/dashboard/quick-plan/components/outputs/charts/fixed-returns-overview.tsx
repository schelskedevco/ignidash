'use client';

import { useFixedReturnsAnalysis } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';

import ResultsChart from './results-chart';
import ResultsMetrics from '../fixed-returns-metrics';

export default function FixedReturnsOverview() {
  const fireAnalysis = useFixedReturnsAnalysis();

  return (
    <>
      <ResultsMetrics fireAnalysis={fireAnalysis} />
      <Card>
        <h4 className="text-foreground mb-4 text-center text-lg font-semibold sm:text-left">Portfolio Projection</h4>
        <ResultsChart />
      </Card>
    </>
  );
}
