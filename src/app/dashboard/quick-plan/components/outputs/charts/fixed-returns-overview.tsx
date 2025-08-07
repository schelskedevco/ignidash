'use client';

import { useFixedReturnsAnalysis } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';

import FixedResultsChart from './fixed-results-chart';
import FixedReturnsDataTable from '../tables/fixed-returns-data-table';
import ResultsMetrics from '../fixed-returns-metrics';

export default function FixedReturnsOverview() {
  const fireAnalysis = useFixedReturnsAnalysis();

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
          <FixedResultsChart />
        </Card>
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
