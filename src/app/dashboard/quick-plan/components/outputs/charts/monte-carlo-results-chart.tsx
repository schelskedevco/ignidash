'use client';

import { useMonteCarloChartData, useMonteCarloAnalysis } from '@/lib/stores/quick-plan-store';

import StochasticResultsChart from './stochastic-results-chart';

export default function MonteCarloResultsChart() {
  const chartData = useMonteCarloChartData();
  const fireAnalysis = useMonteCarloAnalysis();

  if (chartData.length === 0) {
    return null;
  }

  return <StochasticResultsChart fireAnalysis={fireAnalysis} chartData={chartData} />;
}
