'use client';

import { useState, useMemo } from 'react';
import { ArrowsUpDownIcon, ScaleIcon } from '@heroicons/react/20/solid';

import {
  useFixedReturnsAnalysis,
  useCurrentAge,
  useShowReferenceLinesPreference,
  useUpdatePreferences,
} from '@/lib/stores/quick-plan-store';
import { useIsXSmallMobile } from '@/hooks/use-mobile';
import Card from '@/components/ui/card';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import ButtonGroup from '@/components/ui/button-group';
import { Switch } from '@/components/catalyst/switch';

import FixedResultsChart from '../charts/fixed-results-area-chart';
import FixedCashFlowChart from '../charts/fixed-cash-flow-bar-chart';
import FixedReturnsDataTable from '../tables/fixed-returns-data-table';
import ResultsMetrics from '../fixed-returns-metrics';

export default function FixedReturnsOverview() {
  const fireAnalysis = useFixedReturnsAnalysis();
  const currentAge = useCurrentAge();
  const isXSmallScreen = useIsXSmallMobile();

  // Track selected age for cash flow chart
  const [selectedAge, setSelectedAge] = useState<number>(currentAge! + 1);
  const [viewMode, setViewMode] = useState<'inflowOutflow' | 'net'>('inflowOutflow');

  const showReferenceLines = useShowReferenceLinesPreference();
  const updatePreferences = useUpdatePreferences();

  const memoizedCashFlowChart = useMemo(() => <FixedCashFlowChart age={selectedAge} mode={viewMode} />, [selectedAge, viewMode]);

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
            <FixedResultsChart
              onAgeSelect={(age) => {
                if (age >= currentAge! + 1) setSelectedAge(age);
              }}
              selectedAge={selectedAge}
              showReferenceLines={showReferenceLines}
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
                  firstButtonOnClick={() => setViewMode('inflowOutflow')}
                  lastButtonText="Net"
                  lastButtonIcon={<ScaleIcon />}
                  lastButtonOnClick={() => setViewMode('net')}
                  defaultActiveButton="first"
                />
              </div>
              {memoizedCashFlowChart}
            </Card>
          )}
        </div>
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Quick Stats" desc="A brief overview of your simulation's statistics." />
        <div className="text-muted-foreground ml-2 py-10 text-center font-semibold italic">
          <p>Coming soon...</p>
        </div>
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Simulation Table" desc="Year-by-year progression showing portfolio value, asset allocation, and returns." />
        <FixedReturnsDataTable />
      </SectionContainer>
    </>
  );
}
