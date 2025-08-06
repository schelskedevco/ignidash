'use client';

import { useState, useEffect } from 'react';
import { ArrowLongLeftIcon } from '@heroicons/react/20/solid';

import { Button } from '@/components/catalyst/button';
import {
  useHistoricalBacktestChartData,
  useHistoricalBacktestAnalysis,
  useHistoricalBacktestSimulation,
} from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import SectionControls from '@/components/ui/section-controls';
import ButtonGroup from '@/components/ui/button-group';

import StochasticResultsChart from './stochastic-results-chart';
import ResultsMetrics from '../stochastic-metrics';
import HistoricalBacktestDataTable from '../tables/historical-backtest-data-table';

export default function HistoricalBacktestOverview() {
  const [selectedSeed, setSelectedSeed] = useState<number | null>(null);

  const simulation = useHistoricalBacktestSimulation();
  const chartData = useHistoricalBacktestChartData();
  const fireAnalysis = useHistoricalBacktestAnalysis();

  // Reset selectedSeed when simulation changes
  useEffect(() => setSelectedSeed(null), [simulation]);

  if (chartData.length === 0) {
    return null;
  }

  const headerText = selectedSeed !== null ? `Simulation #${selectedSeed} Details` : 'Simulations Table';
  const headerDesc =
    selectedSeed !== null
      ? 'Year-by-year progression and outcomes for this specific simulation.'
      : 'Browse all simulation runs and select one to explore further.';

  return (
    <>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Key Metrics" desc="A snapshot of your simulation's most important results." />
        <ResultsMetrics fireAnalysis={fireAnalysis} />
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Data Visualization" desc="Interactive charts to explore your projection." />
        <Card>
          <h4 className="text-foreground mb-4 text-center text-lg font-semibold sm:text-left">Portfolio Projection</h4>
          <StochasticResultsChart fireAnalysis={fireAnalysis} chartData={chartData} />
        </Card>
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <SectionHeader title={headerText} desc={headerDesc} />
        <SectionControls
          leftAddOn={
            <Button disabled={selectedSeed === null} onClick={() => setSelectedSeed(null)} plain>
              <ArrowLongLeftIcon className="h-5 w-5" />
              <span>Return</span>
            </Button>
          }
          rightAddOn={<ButtonGroup />}
        />
        <HistoricalBacktestDataTable simulation={simulation} selectedSeed={selectedSeed} setSelectedSeed={setSelectedSeed} />
      </SectionContainer>
    </>
  );
}
