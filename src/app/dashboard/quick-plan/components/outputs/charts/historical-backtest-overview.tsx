'use client';

import {
  useHistoricalBacktestChartData,
  useHistoricalBacktestAnalysis,
  useHistoricalBacktestSimulation,
} from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';

import StochasticResultsChart from './stochastic-results-chart';
import ResultsMetrics from '../stochastic-metrics';
import HistoricalBacktestDataTable from '../tables/historical-backtest-data-table';

export default function HistoricalBacktestOverview() {
  const simulation = useHistoricalBacktestSimulation();
  const chartData = useHistoricalBacktestChartData();
  const fireAnalysis = useHistoricalBacktestAnalysis();

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
      <HistoricalBacktestDataTable simulation={simulation} />
    </>
  );
}
