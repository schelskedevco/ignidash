'use client';

import {
  useHistoricalBacktestChartData,
  useHistoricalBacktestAnalysis,
  useHistoricalBacktestSimulation,
} from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';

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
      <SectionContainer showBottomBorder>
        <SectionHeader title="Key Metrics" desc="A snapshot of your simulation's most important results." />
        <ResultsMetrics fireAnalysis={fireAnalysis} />
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Data Visualization" desc="Interactive charts to explore your financial independence projection." />
        <Card>
          <h4 className="text-foreground mb-4 text-center text-lg font-semibold sm:text-left">Portfolio Projection</h4>
          <StochasticResultsChart fireAnalysis={fireAnalysis} chartData={chartData} />
        </Card>
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Tables" desc="Detailed data tables for in-depth analysis." />
        <HistoricalBacktestDataTable simulation={simulation} />
      </SectionContainer>
    </>
  );
}
