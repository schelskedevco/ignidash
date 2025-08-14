'use client';

import { useState, useMemo } from 'react';
import { ArrowsUpDownIcon, ScaleIcon } from '@heroicons/react/20/solid';

import {
  // useFixedReturnsSimulation,
  useFixedReturnsAnalysis,
  useCurrentAge,
} from '@/lib/stores/quick-plan-store';
import { useIsXSmallMobile } from '@/hooks/use-mobile';
import Card from '@/components/ui/card';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import ButtonGroup from '@/components/ui/button-group';

import FixedReturnsPortfolioAreaChartCard from '../cards/fixed-returns-portfolio-area-chart-card';
import FixedCashFlowChart from '../charts/fixed-cash-flow-bar-chart';
import FixedReturnsDataTable from '../tables/fixed-returns-data-table';
import ResultsMetrics from '../fixed-returns-metrics';

export default function FixedReturnsOverview() {
  // const simulation = useFixedReturnsSimulation();
  const analysis = useFixedReturnsAnalysis();

  const currentAge = useCurrentAge();
  const isXSmallScreen = useIsXSmallMobile();

  const [selectedAge, setSelectedAge] = useState<number>(currentAge! + 1);
  const [viewMode, setViewMode] = useState<'inflowOutflow' | 'net'>('inflowOutflow');

  const memoizedCashFlowChart = useMemo(() => <FixedCashFlowChart age={selectedAge} mode={viewMode} />, [selectedAge, viewMode]);

  const comingSoon = (
    <div className="text-muted-foreground ml-2 py-10 text-center font-semibold italic">
      <p>Coming soon...</p>
    </div>
  );

  return (
    <>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Key Metrics" desc="A snapshot of your simulation's most important results." />
        <ResultsMetrics analysis={analysis} />
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Data Visualization" desc="Interactive charts to explore your projection." />
        <div className="my-4 grid grid-cols-1 gap-2 [@media(min-width:1920px)]:grid-cols-2">
          <FixedReturnsPortfolioAreaChartCard setSelectedAge={setSelectedAge} selectedAge={selectedAge} />
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
        {comingSoon}
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Simulation Table" desc="Year-by-year progression showing portfolio value, asset allocation, and returns." />
        <FixedReturnsDataTable />
      </SectionContainer>
      <SectionContainer showBottomBorder={false}>
        <SectionHeader title="Summary" desc="AI-powered insights and recommendations based on your simulation results." />
        {comingSoon}
      </SectionContainer>
    </>
  );
}
