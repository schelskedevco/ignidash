'use client';

import { useIsCalculationReady } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';

import ResultsMetrics from './results-metrics';
import { ResultsChart } from './charts/results-chart';

export default function ResultsSections() {
  const isCalculationReady = useIsCalculationReady();
  if (isCalculationReady) {
    return (
      <SectionContainer showBottomBorder>
        <SectionHeader title="Overview" desc="Timeline, milestones, and portfolio projections in one view." />
        <ResultsMetrics />
        <Card>
          <h4 className="text-foreground mb-4 text-center text-lg font-semibold sm:text-left">Portfolio Projection</h4>
          <ResultsChart />
        </Card>
      </SectionContainer>
    );
  }

  return (
    <div className="text-muted-foreground text-center">
      <p>Results content will be displayed here</p>
    </div>
  );
}
