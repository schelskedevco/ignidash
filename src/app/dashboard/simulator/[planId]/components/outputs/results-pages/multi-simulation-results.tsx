'use client';

import { useEffect, useCallback } from 'react';

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';
import {
  useMultiSimulationResult,
  useKeyMetrics,
  useSimulationResult,
  useUpdateQuickSelectPercentile,
  useUpdateSelectedSeedFromTable,
  type QuickSelectPercentile,
} from '@/lib/stores/simulator-store';
import SectionContainer from '@/components/ui/section-container';
import type { SimulationResult } from '@/lib/calc/simulation-engine';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/tables/multi-simulation-table-schema';
import type { MultiSimulationChartData } from '@/lib/types/chart-data-points';
import { useResultsState } from '@/hooks/use-results-state';
import { useActiveSeed, useRemoveActiveSeed } from '@/hooks/use-active-seed';
import ProgressBar from '@/components/ui/progress-bar';

import SimulationMetrics from '../simulation-metrics';
import MultiSimulationMainResults from './multi-simulation-main-results';
import FooterDisclaimer from './footer-disclaimer';

interface MultiSimulationResultsSharedProps {
  startAge: number;
  tableData: MultiSimulationTableRow[];
  yearlyTableData: YearlyAggregateTableRow[];
  chartData: MultiSimulationChartData;
  handlePercentileChange: (percentile: 'p10' | 'p25' | 'p50' | 'p75' | 'p90' | null) => void;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  handleSeedFromTableChange: (seed: number | null) => void;
  removeActiveSeed: () => void;
}

interface MultiSimulationResultsForActiveSeedProps extends MultiSimulationResultsSharedProps {
  inputs: SimulatorInputs;
  activeSeed: number;
  activeSeedType: 'table' | 'percentile';
  simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns';
}

function MultiSimulationResultsForActiveSeed({
  inputs,
  activeSeed,
  activeSeedType,
  simulationMode,
  ...sharedProps
}: MultiSimulationResultsForActiveSeedProps) {
  let simulationModeForActiveSeed: 'stochasticReturns' | 'historicalReturns';
  switch (simulationMode) {
    case 'monteCarloStochasticReturns':
      simulationModeForActiveSeed = 'stochasticReturns';
      break;
    case 'monteCarloHistoricalReturns':
      simulationModeForActiveSeed = 'historicalReturns';
      break;
  }

  const simulation: SimulationResult = useSimulationResult(inputs, simulationModeForActiveSeed, activeSeed)!;
  const keyMetrics = useKeyMetrics(simulation)!;

  return (
    <>
      <SectionContainer showBottomBorder className="mb-0">
        <SimulationMetrics keyMetrics={keyMetrics} />
      </SectionContainer>
      <MultiSimulationMainResults
        simulation={simulation}
        keyMetrics={keyMetrics}
        activeSeed={activeSeed}
        activeSeedType={activeSeedType}
        {...sharedProps}
      />
      <FooterDisclaimer />
    </>
  );
}

interface MultiSimulationResultsProps {
  inputs: SimulatorInputs;
  simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns';
}

export default function MultiSimulationResults({ inputs, simulationMode }: MultiSimulationResultsProps) {
  const startAge = inputs.timeline!.currentAge;
  const { selectedAge, onAgeSelect } = useResultsState(startAge);

  const { analysis, tableData, yearlyTableData, chartData, keyMetrics, isLoadingOrValidating, completedSimulations } =
    useMultiSimulationResult(inputs, simulationMode);

  const updateQuickSelectPercentile = useUpdateQuickSelectPercentile();
  const updateSelectedSeedFromTable = useUpdateSelectedSeedFromTable();

  const removeActiveSeed = useRemoveActiveSeed();

  const handlePercentileChange = useCallback(
    (percentile: QuickSelectPercentile) => {
      updateQuickSelectPercentile(percentile);
    },
    [updateQuickSelectPercentile]
  );

  const handleSeedFromTableChange = useCallback(
    (seed: number | null) => {
      updateSelectedSeedFromTable(seed);
    },
    [updateSelectedSeedFromTable]
  );

  const { activeSeed, activeSeedType } = useActiveSeed();

  const seed = inputs.simulationSettings.simulationSeed;
  useEffect(() => removeActiveSeed(), [seed, simulationMode, removeActiveSeed]);

  if (!analysis || !keyMetrics || !tableData || !yearlyTableData || !chartData || isLoadingOrValidating) {
    const progressPercent = (completedSimulations / 500) * 100;

    return (
      <div
        key={`loading-${seed}-${simulationMode}`}
        className="flex h-[calc(100vh-7.375rem)] flex-col items-center justify-center gap-8 lg:h-[calc(100vh-4.3125rem)]"
      >
        <p className="text-muted-foreground">
          Completed <strong>{completedSimulations}</strong> / <strong>500</strong> simulations...
        </p>
        <ProgressBar progressPercent={progressPercent} />
      </div>
    );
  }

  const sharedProps: MultiSimulationResultsSharedProps = {
    startAge,
    tableData,
    yearlyTableData,
    chartData,
    handlePercentileChange,
    onAgeSelect,
    selectedAge,
    handleSeedFromTableChange,
    removeActiveSeed,
  };

  if (activeSeed !== undefined) {
    return (
      <MultiSimulationResultsForActiveSeed
        inputs={inputs}
        activeSeed={activeSeed}
        activeSeedType={activeSeedType}
        simulationMode={simulationMode}
        {...sharedProps}
      />
    );
  }

  return (
    <>
      <SectionContainer showBottomBorder className="mb-0">
        <SimulationMetrics keyMetrics={keyMetrics} />
      </SectionContainer>
      <MultiSimulationMainResults simulation={null} keyMetrics={keyMetrics} {...sharedProps} />
      <FooterDisclaimer />
    </>
  );
}
