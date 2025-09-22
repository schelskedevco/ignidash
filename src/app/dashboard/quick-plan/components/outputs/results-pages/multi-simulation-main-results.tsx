'use client';

import type { MultiSimulationAnalysis } from '@/lib/calc/v2/multi-simulation-analyzer';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import SectionContainer from '@/components/ui/section-container';
import { useResultsState } from '@/hooks/use-results-state';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/multi-simulation-table-schema';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';

import SimulationCategorySelector from '../simulation-category-selector';
import SingleSimulationChartsSection from '../sections/single-simulation-charts-section';
import MultiSimulationDataTableSection from '../sections/multi-simulation-data-table-section';

interface MultiSimulationMainResultsProps {
  analysis: MultiSimulationAnalysis;
  simulation: SimulationResult;
  keyMetrics: KeyMetrics;
  tableData: MultiSimulationTableRow[];
  yearlyTableData: YearlyAggregateTableRow[];
  simulationMode: 'monteCarloStochasticReturns' | 'monteCarloHistoricalReturns';
  setCurrentPercentile: (percentile: 'P10' | 'P25' | 'P50' | 'P75' | 'P90') => void;
  currentPercentile: 'P10' | 'P25' | 'P50' | 'P75' | 'P90';
}

export default function MultiSimulationMainResults({
  analysis,
  simulation,
  keyMetrics,
  tableData,
  yearlyTableData,
  simulationMode,
  setCurrentPercentile,
  currentPercentile,
}: MultiSimulationMainResultsProps) {
  const startAge = simulation.context.startAge;
  const { selectedAge, onAgeSelect, currentCategory, setCurrentCategory } = useResultsState(startAge);

  return (
    <>
      <SectionContainer showBottomBorder>
        <SimulationCategorySelector
          currentCategory={currentCategory}
          setCurrentCategory={setCurrentCategory}
          currentPercentile={currentPercentile}
          setCurrentPercentile={setCurrentPercentile}
        />
      </SectionContainer>
      <SingleSimulationChartsSection
        simulation={simulation}
        keyMetrics={keyMetrics}
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        currentCategory={currentCategory}
      />
      <MultiSimulationDataTableSection
        analysis={analysis}
        tableData={tableData}
        yearlyTableData={yearlyTableData}
        currentCategory={currentCategory}
        simulationMode={simulationMode}
      />
    </>
  );
}
