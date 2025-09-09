'use client';

import { useState } from 'react';

import { useFixedReturnsSimulation, useFixedReturnsAnalysis, useCurrentAge } from '@/lib/stores/quick-plan-store';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';

import FixedReturnsPortfolioAreaChartCard from '../cards/legacy/fixed-returns-portfolio-area-chart-card';
import FixedReturnsCashFlowBarChartCard from '../cards/legacy/fixed-returns-cash-flow-bar-chart-card';
import FixedReturnsDataTable from '../tables/fixed-returns-data-table';
import ResultsMetrics from '../fixed-returns-metrics';

export default function FixedReturnsResults() {
  const simulation = useFixedReturnsSimulation();
  const analysis = useFixedReturnsAnalysis(simulation);

  const currentAge = useCurrentAge();
  const [selectedAge, setSelectedAge] = useState<number>(currentAge! + 1);

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
          <FixedReturnsPortfolioAreaChartCard simulation={simulation} setSelectedAge={setSelectedAge} selectedAge={selectedAge} />
          <FixedReturnsCashFlowBarChartCard simulation={simulation} selectedAge={selectedAge} />
        </div>
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Quick Stats" desc="A brief overview of your simulation's statistics." />
        {comingSoon}
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Simulation Table" desc="Year-by-year progression showing portfolio value, asset allocation, and returns." />
        <FixedReturnsDataTable simulation={simulation} />
      </SectionContainer>
      <SectionContainer showBottomBorder={false}>
        <SectionHeader title="Summary" desc="AI-powered insights and recommendations based on your simulation results." />
        {comingSoon}
      </SectionContainer>
    </>
  );
}
