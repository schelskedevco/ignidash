'use client';

import { useHistoricalBacktestChartData, useHistoricalBacktestAnalysis } from '@/lib/stores/quick-plan-store';

import StochasticResultsChart from './stochastic-results-chart';

export default function HistoricalBacktestResultsChart() {
  const chartData = useHistoricalBacktestChartData();
  const fireAnalysis = useHistoricalBacktestAnalysis();

  if (chartData.length === 0) {
    return null;
  }

  return <StochasticResultsChart fireAnalysis={fireAnalysis} chartData={chartData} />;
}
