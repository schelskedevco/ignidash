'use client';

import { useState } from 'react';

import { useMultiSimulationResult, useMultiSimulationKeyMetrics } from '@/lib/stores/quick-plan-store';
import SectionContainer from '@/components/ui/section-container';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';

import SimulationMetrics from '../simulation-metrics';
import MultiSimulationMainResults from './multi-simulation-main-results';

interface MultiSimulationResultsProps {
  simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns';
}

export default function MultiSimulationResults({ simulationMode }: MultiSimulationResultsProps) {
  const { data: { analysis, tableData, yearlyTableData } = {} } = useMultiSimulationResult(simulationMode);

  const [currentPercentile, setCurrentPercentile] = useState<'P10' | 'P25' | 'P50' | 'P75' | 'P90'>('P50');

  let simulation: SimulationResult | undefined = undefined;
  switch (currentPercentile) {
    case 'P10':
      simulation = analysis?.results.p10;
      break;
    case 'P25':
      simulation = analysis?.results.p25;
      break;
    case 'P50':
      simulation = analysis?.results.p50;
      break;
    case 'P75':
      simulation = analysis?.results.p75;
      break;
    case 'P90':
      simulation = analysis?.results.p90;
      break;
  }

  const keyMetrics = useMultiSimulationKeyMetrics(analysis ?? null, simulation ?? null);

  if (!analysis || !keyMetrics || !tableData || !yearlyTableData || !simulation) {
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
      <MultiSimulationMainResults
        analysis={analysis}
        simulation={simulation}
        keyMetrics={keyMetrics}
        tableData={tableData}
        yearlyTableData={yearlyTableData}
        simulationMode={simulationMode}
        setCurrentPercentile={setCurrentPercentile}
        currentPercentile={currentPercentile}
      />
    </>
  );
}
