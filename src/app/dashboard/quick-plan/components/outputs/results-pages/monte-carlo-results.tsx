'use client';

import { useMonteCarloAnalysisWithWorker, useStochasticAnalysis } from '@/lib/stores/quick-plan-store';
import type { AggregateSimulationStats } from '@/lib/calc/simulation-analyzer';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';

import ResultsMetrics from '../stochastic-metrics';
import StochasticDataTableSection from '../sections/stochastic-data-table-section';
import StochasticChartsSection from '../sections/stochastic-charts-section';

interface MonteCarloResultsImplProps {
  simStats: AggregateSimulationStats;
}

function MonteCarloResultsImpl({ simStats }: MonteCarloResultsImplProps) {
  const analysis = useStochasticAnalysis(simStats);

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
      <StochasticChartsSection analysis={analysis} simStats={simStats} />
      <SectionContainer showBottomBorder>
        <SectionHeader title="Quick Stats" desc="A brief overview of your simulation's statistics." />
        {comingSoon}
      </SectionContainer>
      <StochasticDataTableSection simulationType="monteCarlo" simStats={simStats} />
      <SectionContainer showBottomBorder={false}>
        <SectionHeader title="Summary" desc="AI-powered insights and recommendations based on your simulation results." />
        {comingSoon}
      </SectionContainer>
    </>
  );
}

export default function MonteCarloResults() {
  const { data, isLoading } = useMonteCarloAnalysisWithWorker();

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-center">
        <p>Results content is loading...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-muted-foreground text-center">
        <p>Results content is unavailable</p>
      </div>
    );
  }

  return <MonteCarloResultsImpl simStats={data} />;
}
