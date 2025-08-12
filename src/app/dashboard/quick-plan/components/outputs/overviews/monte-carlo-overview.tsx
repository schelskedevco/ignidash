'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeftIcon,
  TableCellsIcon,
  CalendarDaysIcon,
  ArrowsUpDownIcon,
  ScaleIcon,
  ReceiptPercentIcon,
  DocumentCurrencyDollarIcon,
} from '@heroicons/react/20/solid';

import { Button } from '@/components/catalyst/button';
import {
  useCurrentAge,
  useMonteCarloChartData,
  useMonteCarloAnalysis,
  useMonteCarloSimulation,
  useMonteCarloCashFlowChartData,
  useMonteCarloPhasePercentAreaChartData,
  useMonteCarloReturnsChartData,
  useShowReferenceLinesPreference,
  useUpdatePreferences,
} from '@/lib/stores/quick-plan-store';
import { useIsXSmallMobile } from '@/hooks/use-mobile';
import Card from '@/components/ui/card';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import ButtonGroup from '@/components/ui/button-group';
import { Switch } from '@/components/catalyst/switch';

import StochasticResultsChart from '../charts/stochastic-results-area-chart';
import StochasticCashFlowChart from '../charts/stochastic-cash-flow-bar-chart';
import StochasticCashFlowLineChart from '../charts/stochastic-cash-flow-line-chart';
import StochasticPhasePercentAreaChart from '../charts/stochastic-phase-percent-area-chart';
import StochasticReturnsChart from '../charts/stochastic-returns-bar-chart';
import ResultsMetrics from '../stochastic-metrics';
import MonteCarloDataTable from '../tables/monte-carlo-data-table';

export default function MonteCarloOverview() {
  const [selectedSeed, setSelectedSeed] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'yearly'>('all');

  const currentAge = useCurrentAge();
  const isXSmallScreen = useIsXSmallMobile();

  const [selectedAge, setSelectedAge] = useState<number>(currentAge! + 1);
  const [cashFlowViewMode, setCashFlowViewMode] = useState<'inflowOutflow' | 'net'>('inflowOutflow');

  const [returnsViewMode, setReturnsViewMode] = useState<'amounts' | 'rates'>('rates');

  const showReferenceLines = useShowReferenceLinesPreference();
  const updatePreferences = useUpdatePreferences();

  const simulation = useMonteCarloSimulation();
  const chartData = useMonteCarloChartData();
  const fireAnalysis = useMonteCarloAnalysis();
  const cashFlowChartData = useMonteCarloCashFlowChartData();
  const phasePercentChartData = useMonteCarloPhasePercentAreaChartData();
  const returnsChartData = useMonteCarloReturnsChartData();

  // Reset selectedSeed when simulation changes
  useEffect(() => setSelectedSeed(null), [simulation, viewMode]);

  const memoizedCashFlowChart = useMemo(
    () => <StochasticCashFlowChart age={selectedAge} mode={cashFlowViewMode} rawChartData={cashFlowChartData} />,
    [selectedAge, cashFlowViewMode, cashFlowChartData]
  );
  const memoizedCashFlowLineChart = useMemo(
    () => (
      <StochasticCashFlowLineChart
        onAgeSelect={(age) => {
          if (age >= currentAge! + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
        rawChartData={cashFlowChartData}
      />
    ),
    [cashFlowChartData, currentAge, selectedAge]
  );
  const memoizedPhasePercentChart = useMemo(
    () => (
      <StochasticPhasePercentAreaChart
        onAgeSelect={(age) => {
          if (age >= currentAge! + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
        chartData={phasePercentChartData}
      />
    ),
    [selectedAge, phasePercentChartData, currentAge]
  );
  const memoizedReturnsChart = useMemo(
    () => <StochasticReturnsChart age={selectedAge} mode={returnsViewMode} rawChartData={returnsChartData} />,
    [returnsChartData, selectedAge, returnsViewMode]
  );

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
        <div className="my-4 grid grid-cols-1 gap-2 [@media(min-width:1920px)]:grid-cols-2">
          <Card className="my-0">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-foreground text-center text-lg font-semibold sm:text-left">Portfolio Projection</h4>
              <Switch
                className="focus-outline"
                color="rose"
                checked={showReferenceLines}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') updatePreferences('showReferenceLines', !showReferenceLines);
                }}
                onChange={() => updatePreferences('showReferenceLines', !showReferenceLines)}
                aria-label="Toggle reference lines"
              />
            </div>
            <StochasticResultsChart
              fireAnalysis={fireAnalysis}
              chartData={chartData}
              showReferenceLines={showReferenceLines}
              onAgeSelect={(age) => {
                if (age >= currentAge! + 1) setSelectedAge(age);
              }}
              selectedAge={selectedAge}
            />
          </Card>
          {!isXSmallScreen && (
            <Card className="my-0">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-foreground flex items-center text-lg font-semibold">
                  <span className="mr-2">Cash Flow</span>
                  <span className="text-muted-foreground">Age {selectedAge}</span>
                </h4>
                <ButtonGroup
                  firstButtonText="All Flows"
                  firstButtonIcon={<ArrowsUpDownIcon />}
                  firstButtonOnClick={() => setCashFlowViewMode('inflowOutflow')}
                  lastButtonText="Net"
                  lastButtonIcon={<ScaleIcon />}
                  lastButtonOnClick={() => setCashFlowViewMode('net')}
                  defaultActiveButton="first"
                />
              </div>
              {memoizedCashFlowChart}
            </Card>
          )}
          <Card className="my-0">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-foreground flex items-center text-lg font-semibold">
                <span className="mr-2">Net Cash Flow</span>
                <span className="text-muted-foreground">Time Series</span>
              </h4>
            </div>
            {memoizedCashFlowLineChart}
          </Card>
          <Card className="my-0">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-foreground flex items-center text-lg font-semibold">
                <span className="mr-2">Phase Percent</span>
                <span className="text-muted-foreground">Time Series</span>
              </h4>
            </div>
            {memoizedPhasePercentChart}
          </Card>
          <Card className="my-0">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-foreground flex items-center text-lg font-semibold">
                <span className="mr-2">Returns</span>
                <span className="text-muted-foreground">Age {selectedAge}</span>
              </h4>
              <ButtonGroup
                firstButtonText="Rates"
                firstButtonIcon={<ReceiptPercentIcon />}
                firstButtonOnClick={() => setReturnsViewMode('rates')}
                lastButtonText="Amounts"
                lastButtonIcon={<DocumentCurrencyDollarIcon />}
                lastButtonOnClick={() => setReturnsViewMode('amounts')}
                defaultActiveButton="first"
              />
            </div>
            {memoizedReturnsChart}
          </Card>
        </div>
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
