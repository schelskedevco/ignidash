'use client';

import { useState, useEffect } from 'react';
import { ChevronLeftIcon, TableCellsIcon, CalendarDaysIcon } from '@heroicons/react/20/solid';

import { Button } from '@/components/catalyst/button';
import { useMonteCarloChartData, useMonteCarloAnalysis, useMonteCarloSimulation } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import ButtonGroup from '@/components/ui/button-group';
import { Switch } from '@/components/catalyst/switch';

import StochasticResultsChart from '../charts/stochastic-results-chart';
import ResultsMetrics from '../stochastic-metrics';
import MonteCarloDataTable from '../tables/monte-carlo-data-table';

export default function MonteCarloOverview() {
  const [selectedSeed, setSelectedSeed] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'yearly'>('all');
  const [showReferenceLines, setShowReferenceLines] = useState<boolean>(true);

  const simulation = useMonteCarloSimulation();
  const chartData = useMonteCarloChartData();
  const fireAnalysis = useMonteCarloAnalysis();

  // Reset selectedSeed when simulation changes
  useEffect(() => setSelectedSeed(null), [simulation, viewMode]);

  if (chartData.length === 0) {
    return null;
  }

  let headerText: string;
  let headerDesc: string;

  if (selectedSeed !== null) {
    headerText = `Simulation #${selectedSeed} Details`;
    headerDesc = 'Year-by-year progression and outcome for this specific simulation.';
  } else if (viewMode === 'yearly') {
    headerText = 'Yearly Results';
    headerDesc = 'Aggregated statistics across all simulations by year.';
  } else {
    headerText = 'Simulations Table';
    headerDesc = 'Browse all simulation runs. Select one to explore further.';
  }

  return (
    <>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Key Metrics" desc="A snapshot of your simulation's most important results." />
        <ResultsMetrics fireAnalysis={fireAnalysis} />
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Data Visualization" desc="Interactive charts to explore your projection." />
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-foreground text-center text-lg font-semibold sm:text-left">Portfolio Projection</h4>
            <Switch
              color="rose"
              checked={showReferenceLines}
              onChange={() => setShowReferenceLines(!showReferenceLines)}
              aria-label="Toggle reference lines"
            />
          </div>
          <StochasticResultsChart fireAnalysis={fireAnalysis} chartData={chartData} showReferenceLines={showReferenceLines} />
        </Card>
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Quick Stats" desc="A brief overview of your simulation's statistics." />
        <div className="text-muted-foreground ml-2 py-10 text-center font-semibold italic">
          <p>Coming soon...</p>
        </div>
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <SectionHeader
          title={headerText}
          desc={headerDesc}
          rightAddOn={
            selectedSeed !== null ? (
              <Button disabled={selectedSeed === null} onClick={() => setSelectedSeed(null)} plain>
                <ChevronLeftIcon className="h-5 w-5" />
                <span>Return</span>
              </Button>
            ) : (
              <ButtonGroup
                firstButtonText="Simulations"
                firstButtonIcon={<TableCellsIcon />}
                firstButtonOnClick={() => setViewMode('all')}
                lastButtonText="Yearly results"
                lastButtonIcon={<CalendarDaysIcon />}
                lastButtonOnClick={() => setViewMode('yearly')}
                defaultActiveButton="first"
              />
            )
          }
        />
        <MonteCarloDataTable simulation={simulation} selectedSeed={selectedSeed} setSelectedSeed={setSelectedSeed} viewMode={viewMode} />
      </SectionContainer>
    </>
  );
}
