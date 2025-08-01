'use client';

import { useHistoricalBacktestChartData, useHistoricalBacktestAnalysis } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';

import StochasticResultsChart from './stochastic-results-chart';
import ResultsMetrics from '../results-metrics';

export default function HistoricalBacktestOverview() {
  const chartData = useHistoricalBacktestChartData();
  const fireAnalysis = useHistoricalBacktestAnalysis();

  if (chartData.length === 0) {
    return null;
  }

  const fireAge = fireAnalysis?.p50FireAge;
  const yearsToFIRE = fireAnalysis?.p50YearsToFIRE;
  const requiredPortfolio = fireAnalysis?.requiredPortfolio;

  return (
    <>
      <ResultsMetrics
        simulationMode="historicalBacktest"
        fireAge={fireAge}
        yearsToFIRE={yearsToFIRE}
        requiredPortfolio={requiredPortfolio}
      />
      <Card>
        <h4 className="text-foreground mb-4 text-center text-lg font-semibold sm:text-left">Portfolio Projection</h4>
        <StochasticResultsChart fireAnalysis={fireAnalysis} chartData={chartData} />
      </Card>
    </>
  );
}
