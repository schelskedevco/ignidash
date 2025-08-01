'use client';

import { useMonteCarloChartData, useMonteCarloAnalysis } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';

import StochasticResultsChart from './stochastic-results-chart';
import ResultsMetrics from '../results-metrics';

export default function MonteCarloResultsChart() {
  const chartData = useMonteCarloChartData();
  const fireAnalysis = useMonteCarloAnalysis();

  if (chartData.length === 0) {
    return null;
  }

  const fireAge = fireAnalysis?.p50FireAge;
  const yearsToFIRE = fireAnalysis?.p50YearsToFIRE;
  const requiredPortfolio = fireAnalysis?.requiredPortfolio;

  return (
    <>
      <ResultsMetrics simulationMode="monteCarlo" fireAge={fireAge} yearsToFIRE={yearsToFIRE} requiredPortfolio={requiredPortfolio} />
      <Card>
        <h4 className="text-foreground mb-4 text-center text-lg font-semibold sm:text-left">Portfolio Projection</h4>
        <StochasticResultsChart fireAnalysis={fireAnalysis} chartData={chartData} />
      </Card>
    </>
  );
}
