'use client';

import { useFixedReturnsAnalysis } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';

import ResultsChart from './results-chart';
import ResultsMetrics from '../results-metrics';

export default function FixedReturnsResultsChart() {
  const fireAnalysis = useFixedReturnsAnalysis();

  const fireAge = fireAnalysis.fireAge;
  const yearsToFIRE = fireAnalysis.yearsToFIRE;
  const requiredPortfolio = fireAnalysis.requiredPortfolio;

  return (
    <>
      <ResultsMetrics simulationMode="fixedReturns" fireAge={fireAge} yearsToFIRE={yearsToFIRE} requiredPortfolio={requiredPortfolio} />
      <Card>
        <h4 className="text-foreground mb-4 text-center text-lg font-semibold sm:text-left">Portfolio Projection</h4>
        <ResultsChart />
      </Card>
    </>
  );
}
