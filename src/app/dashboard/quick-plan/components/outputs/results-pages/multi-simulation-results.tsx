'use client';

import { useMultiSimulationResult, useMultiSimulationKeyMetrics } from '@/lib/stores/quick-plan-store';
import SectionContainer from '@/components/ui/section-container';

import SimulationMetrics from '../simulation-metrics';
import MultiSimulationMainResults from './multi-simulation-main-results';

interface MultiSimulationResultsProps {
  simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns';
}

export default function MultiSimulationResults({ simulationMode }: MultiSimulationResultsProps) {
  const { data: { analysis, tableData, yearlyTableData } = {} } = useMultiSimulationResult(simulationMode);
  const keyMetrics = useMultiSimulationKeyMetrics(analysis ?? null);

  if (!analysis || !keyMetrics || !tableData || !yearlyTableData) {
    return (
      <div className="text-muted-foreground text-center">
        <p>Results content will be displayed here...</p>
      </div>
    );
  }

  return (
    <>
      <SectionContainer showBottomBorder className="mb-0">
        <SimulationMetrics keyMetrics={keyMetrics} />
      </SectionContainer>
      <MultiSimulationMainResults analysis={analysis} keyMetrics={keyMetrics} tableData={tableData} yearlyTableData={yearlyTableData} />
    </>
  );
}
