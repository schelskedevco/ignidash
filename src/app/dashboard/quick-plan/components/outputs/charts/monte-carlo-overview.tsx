'use client';

import { useMonteCarloChartData, useMonteCarloAnalysis } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';

import StochasticResultsChart from './stochastic-results-chart';
import ResultsMetrics from '../stochastic-metrics';
import MonteCarloDataTable from '../tables/monte-carlo-data-table';

export default function MonteCarloOverview() {
  const chartData = useMonteCarloChartData();
  const fireAnalysis = useMonteCarloAnalysis();

  if (chartData.length === 0) {
    return null;
  }

  return (
    <>
      <ResultsMetrics fireAnalysis={fireAnalysis} />
      <Card>
        <h4 className="text-foreground mb-4 text-center text-lg font-semibold sm:text-left">Portfolio Projection</h4>
        <StochasticResultsChart fireAnalysis={fireAnalysis} chartData={chartData} />
      </Card>
      <MonteCarloDataTable />
    </>
  );
}
