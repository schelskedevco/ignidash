'use client';

import { useFixedReturnsAnalysis } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';

import FixedResultsChart from './fixed-results-chart';
import FixedReturnsDataTable from '../tables/fixed-returns-data-table';
import ResultsMetrics from '../fixed-returns-metrics';

export default function FixedReturnsOverview() {
  const fireAnalysis = useFixedReturnsAnalysis();

  return (
    <>
      <ResultsMetrics fireAnalysis={fireAnalysis} />
      <Card>
        <h4 className="text-foreground mb-4 text-center text-lg font-semibold sm:text-left">Portfolio Projection</h4>
        <FixedResultsChart />
      </Card>
      <FixedReturnsDataTable />
    </>
  );
}
