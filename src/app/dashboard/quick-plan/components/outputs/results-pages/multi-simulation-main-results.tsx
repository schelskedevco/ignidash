'use client';

import type { MultiSimulationAnalysis } from '@/lib/calc/v2/multi-simulation-analyzer';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import SectionContainer from '@/components/ui/section-container';
import { useResultsState } from '@/hooks/use-results-state';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/multi-simulation-table-schema';

import SimulationCategorySelector from '../single-simulation-category-selector';
import SingleSimulationChartsSection from '../sections/single-simulation-charts-section';
import MultiSimulationDataTableSection from '../sections/multi-simulation-data-table-section';

interface MultiSimulationMainResultsProps {
  analysis: MultiSimulationAnalysis;
  keyMetrics: KeyMetrics;
  tableData: MultiSimulationTableRow[];
  yearlyTableData: YearlyAggregateTableRow[];
}

export default function MultiSimulationMainResults({ analysis, keyMetrics, tableData, yearlyTableData }: MultiSimulationMainResultsProps) {
  const simulation = analysis.p50Result;
  const startAge = simulation.context.startAge;

  const { selectedAge, onAgeSelect, currentCategory, setCurrentCategory } = useResultsState(startAge);

  return (
    <>
      <SectionContainer showBottomBorder>
        <SimulationCategorySelector currentCategory={currentCategory} setCurrentCategory={setCurrentCategory} />
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
      />
    </>
  );
}
