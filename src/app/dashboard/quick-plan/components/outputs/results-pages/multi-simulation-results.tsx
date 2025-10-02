'use client';

import { useState, useEffect } from 'react';

import {
  useMultiSimulationResult,
  useKeyMetrics,
  useSimulationResult,
  useSimulationSeed,
  useCurrentAge,
} from '@/lib/stores/quick-plan-store';
import SectionContainer from '@/components/ui/section-container';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import { useResultsState } from '@/hooks/use-results-state';
import ProgressBar from '@/components/ui/progress-bar';

import SimulationMetrics from '../simulation-metrics';
import MultiSimulationMainResults from './multi-simulation-main-results';

interface MultiSimulationResultsProps {
  simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns';
}

export default function MultiSimulationResults({ simulationMode }: MultiSimulationResultsProps) {
  const startAge = useCurrentAge()!;
  const { selectedAge, onAgeSelect, currentCategory, setCurrentCategory } = useResultsState(startAge);
  const { analysis, tableData, yearlyTableData, isLoading, completedSimulations } = useMultiSimulationResult(
    simulationMode,
    currentCategory
  );

  const [currentPercentile, setCurrentPercentile] = useState<'P10' | 'P25' | 'P50' | 'P75' | 'P90'>('P50');
  const [selectedSeed, setSelectedSeed] = useState<number | null>(null);

  let simulationModeForSelectedSeed: 'stochasticReturns' | 'historicalReturns';
  switch (simulationMode) {
    case 'monteCarloStochasticReturns':
      simulationModeForSelectedSeed = 'stochasticReturns';
      break;
    case 'monteCarloHistoricalReturns':
      simulationModeForSelectedSeed = 'historicalReturns';
      break;
  }

  let simulation: SimulationResult | null | undefined = useSimulationResult(simulationModeForSelectedSeed, selectedSeed);
  if (!selectedSeed) {
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
  }

  const seed = useSimulationSeed();
  useEffect(() => setSelectedSeed(null), [seed, simulationMode]);

  const baseMetrics = useKeyMetrics(simulation);
  const keyMetrics = baseMetrics && {
    ...baseMetrics,
    success: selectedSeed === null ? (analysis?.success ?? 0) : baseMetrics.success,
  };

  if (!analysis || !keyMetrics || !tableData || !yearlyTableData || !simulation || isLoading) {
    const roundedSimulations = Math.floor(completedSimulations / 10) * 10;
    const progressPercent = (roundedSimulations / 1000) * 100;

    return (
      <div className="flex h-[calc(100vh-7.375rem)] flex-col items-center justify-center gap-8 lg:h-[calc(100vh-4.3125rem)]">
        <p className="text-muted-foreground">
          Completed <strong>{roundedSimulations}</strong> / <strong>1000</strong> simulations...
        </p>
        <ProgressBar progressPercent={progressPercent} />
      </div>
    );
  }

  return (
    <>
      <SectionContainer showBottomBorder className="mb-0">
        <SimulationMetrics keyMetrics={keyMetrics} />
      </SectionContainer>
      <MultiSimulationMainResults
        simulation={simulation}
        keyMetrics={keyMetrics}
        tableData={tableData}
        yearlyTableData={yearlyTableData}
        setCurrentCategory={setCurrentCategory}
        currentCategory={currentCategory}
        setCurrentPercentile={setCurrentPercentile}
        currentPercentile={currentPercentile}
        setSelectedSeed={setSelectedSeed}
        selectedSeed={selectedSeed}
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
      />
    </>
  );
}
