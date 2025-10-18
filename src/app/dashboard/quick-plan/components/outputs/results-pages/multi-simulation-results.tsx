'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import {
  useMultiSimulationResult,
  useKeyMetrics,
  useSimulationResult,
  useSimulationSeed,
  useCurrentAge,
} from '@/lib/stores/quick-plan-store';
import SectionContainer from '@/components/ui/section-container';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/multi-simulation-table-schema';
import type { MultiSimulationChartData } from '@/lib/types/chart-data-points';
import { useResultsState } from '@/hooks/use-results-state';
import ProgressBar from '@/components/ui/progress-bar';
import { SimulationCategory } from '@/lib/types/simulation-category';

import SimulationMetrics from '../simulation-metrics';
import MultiSimulationMainResults from './multi-simulation-main-results';

interface MultiSimulationResultsSharedProps {
  tableData: MultiSimulationTableRow[];
  yearlyTableData: YearlyAggregateTableRow[];
  chartData: MultiSimulationChartData;
  setCurrentCategory: (category: SimulationCategory) => void;
  currentCategory: SimulationCategory;
  setCurrentPercentile: (percentile: 'p10' | 'p25' | 'p50' | 'p75' | 'p90' | null) => void;
  currentPercentile: 'p10' | 'p25' | 'p50' | 'p75' | 'p90' | null;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  setSelectedSeedFromTable: (seed: number | null) => void;
  removeActiveSeed: () => void;
}

interface MultiSimulationResultsForActiveSeedProps extends MultiSimulationResultsSharedProps {
  activeSeed: number;
  activeSeedType: 'table' | 'percentile';
  simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns';
}

function MultiSimulationResultsForActiveSeed({
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

  const simulation: SimulationResult = useSimulationResult(simulationModeForActiveSeed, activeSeed)!;
  const keyMetrics = useKeyMetrics(simulation)!;

  return (
    <>
      <SectionContainer showBottomBorder className="mb-0">
        <SimulationMetrics keyMetrics={keyMetrics} />
      </SectionContainer>
      <MultiSimulationMainResults
        simulationAndKeyMetrics={{ simulation, keyMetrics }}
        activeSeed={activeSeed}
        activeSeedType={activeSeedType}
        {...sharedProps}
      />
    </>
  );
}

interface MultiSimulationResultsProps {
  simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns';
}

export default function MultiSimulationResults({ simulationMode }: MultiSimulationResultsProps) {
  const startAge = useCurrentAge()!;
  const { selectedAge, onAgeSelect, currentCategory, setCurrentCategory } = useResultsState(startAge);

  const { analysis, tableData, yearlyTableData, chartData, isLoadingOrValidating, completedSimulations } = useMultiSimulationResult(
    simulationMode,
    currentCategory
  );

  const p50KeyMetrics = useKeyMetrics(analysis?.results.p50.result);

  const [currentPercentile, setCurrentPercentile] = useState<'p10' | 'p25' | 'p50' | 'p75' | 'p90' | null>(null);
  const [selectedSeedFromTable, setSelectedSeedFromTable] = useState<number | null>(null);

  const removeActiveSeed = useCallback(() => {
    setCurrentPercentile(null);
    setSelectedSeedFromTable(null);
    setCurrentCategory(SimulationCategory.Portfolio);
  }, [setCurrentCategory]);

  const handlePercentileChange = useCallback(
    (percentile: typeof currentPercentile) => {
      setCurrentPercentile(percentile);
      setCurrentCategory(SimulationCategory.Portfolio);
    },
    [setCurrentCategory]
  );

  const handleSeedFromTableChange = useCallback(
    (seed: number | null) => {
      setSelectedSeedFromTable(seed);
      setCurrentCategory(SimulationCategory.Portfolio);
    },
    [setCurrentCategory]
  );

  const { activeSeed, activeSeedType } = useMemo(() => {
    if (selectedSeedFromTable !== null) {
      return { activeSeed: selectedSeedFromTable, activeSeedType: 'table' as const };
    } else if (currentPercentile !== null) {
      return { activeSeed: analysis?.results[currentPercentile].seed, activeSeedType: 'percentile' as const };
    } else {
      return { activeSeed: undefined };
    }
  }, [selectedSeedFromTable, currentPercentile, analysis]);

  const seed = useSimulationSeed();
  useEffect(() => setSelectedSeedFromTable(null), [seed, simulationMode]);

  if (!analysis || !p50KeyMetrics || !tableData || !yearlyTableData || !chartData || isLoadingOrValidating) {
    const progressPercent = (completedSimulations / 500) * 100;

    return (
      <div className="flex h-[calc(100vh-7.375rem)] flex-col items-center justify-center gap-8 lg:h-[calc(100vh-4.3125rem)]">
        <p className="text-muted-foreground">
          Completed <strong>{completedSimulations}</strong> / <strong>500</strong> simulations...
        </p>
        <ProgressBar progressPercent={progressPercent} />
      </div>
    );
  }

  const sharedProps: MultiSimulationResultsSharedProps = {
    tableData,
    yearlyTableData,
    chartData,
    setCurrentCategory,
    currentCategory,
    setCurrentPercentile: handlePercentileChange,
    currentPercentile,
    onAgeSelect,
    selectedAge,
    setSelectedSeedFromTable: handleSeedFromTableChange,
    removeActiveSeed,
  };

  if (activeSeed !== undefined) {
    return (
      <MultiSimulationResultsForActiveSeed
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
        <SimulationMetrics keyMetrics={{ ...p50KeyMetrics, success: analysis.success }} />
      </SectionContainer>
      <MultiSimulationMainResults simulationAndKeyMetrics={null} {...sharedProps} />
    </>
  );
}
