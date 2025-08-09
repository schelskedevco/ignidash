'use client';

import { useState } from 'react';

import { useFixedReturnsAnalysis, useCurrentAge } from '@/lib/stores/quick-plan-store';
import { useIsXSmallMobile } from '@/hooks/use-mobile';
import Card from '@/components/ui/card';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';

import FixedResultsChart from './fixed-results-chart';
import FixedCashFlowChart from './fixed-cash-flow-chart';
import FixedReturnsDataTable from '../tables/fixed-returns-data-table';
import ResultsMetrics from '../fixed-returns-metrics';

export default function FixedReturnsOverview() {
  const fireAnalysis = useFixedReturnsAnalysis();
  const currentAge = useCurrentAge();
  const isXSmallScreen = useIsXSmallMobile();

  // Track selected age for cash flow chart
  const [selectedAge, setSelectedAge] = useState<number>(currentAge! + 1);

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
          <FixedResultsChart
            selectedAge={selectedAge}
            onAgeSelect={(age) => {
              // Prevent selecting current age or lower
              if (age >= currentAge! + 1) setSelectedAge(age);
            }}
          />
        </Card>
        {!isXSmallScreen && (
          <Card>
            <h4 className="text-foreground mb-4 flex items-center justify-center text-lg font-semibold sm:justify-between">
              <span className="mr-2">Cash Flow</span>
              <span className="text-muted-foreground">Age {selectedAge}</span>
            </h4>
            <FixedCashFlowChart age={selectedAge} />
          </Card>
        )}
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
