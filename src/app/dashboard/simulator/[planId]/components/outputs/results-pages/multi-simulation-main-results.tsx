'use client';

import type { KeyMetrics } from '@/lib/types/key-metrics';
import SectionContainer from '@/components/ui/section-container';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/tables/multi-simulation-table-schema';
import type { SimulationResult } from '@/lib/calc/simulation-engine';
import { SingleSimulationCategory, MultiSimulationCategory } from '@/lib/types/simulation-category';
import { MultiSimulationChartData } from '@/lib/types/chart-data-points';

import SimulationCategorySelector from '../simulation-category-selector';
import SingleSimulationChartsSection from '../sections/single-simulation-charts-section';
import MultiSimulationChartsSection from '../sections/multi-simulation-charts-section';
import MultiSimulationDataTableSection from '../sections/multi-simulation-data-table-section';

interface MultiSimulationMainResultsProps {
  simulation: SimulationResult | null;
  keyMetrics: KeyMetrics;
  startAge: number;
  tableData: MultiSimulationTableRow[];
  yearlyTableData: YearlyAggregateTableRow[];
  chartData: MultiSimulationChartData;
  handlePercentileChange: (percentile: 'p10' | 'p25' | 'p50' | 'p75' | 'p90' | null) => void;
  removeActiveSeed: () => void;
  activeSeed?: number | undefined;
  activeSeedType?: 'table' | 'percentile' | undefined;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  handleSeedFromTableChange: (seed: number | null) => void;
}

export default function MultiSimulationMainResults({
  simulation,
  keyMetrics,
  startAge,
  tableData,
  yearlyTableData,
  chartData,
  handlePercentileChange,
  removeActiveSeed,
  activeSeed,
  activeSeedType,
  onAgeSelect,
  selectedAge,
  handleSeedFromTableChange,
}: MultiSimulationMainResultsProps) {
  const availableCategories =
    simulation !== null
      ? { mode: 'single' as const, categories: Object.values(SingleSimulationCategory) }
      : { mode: 'multi' as const, categories: Object.values(MultiSimulationCategory) };

  return (
    <>
      <SectionContainer
        showBottomBorder
        className="from-emphasized-background to-background bg-gradient-to-r py-0 xl:sticky xl:top-[4.3125rem] xl:z-10"
      >
        <SimulationCategorySelector
          availableCategories={availableCategories}
          handlePercentileChange={handlePercentileChange}
          removeActiveSeed={removeActiveSeed}
          activeSeed={activeSeed}
          activeSeedType={activeSeedType}
        />
      </SectionContainer>
      {simulation !== null ? (
        <SingleSimulationChartsSection
          simulation={simulation}
          keyMetrics={keyMetrics}
          onAgeSelect={onAgeSelect}
          selectedAge={selectedAge}
        />
      ) : (
        <MultiSimulationChartsSection
          startAge={startAge}
          chartData={chartData}
          keyMetrics={keyMetrics}
          onAgeSelect={onAgeSelect}
          selectedAge={selectedAge}
        />
      )}
      <MultiSimulationDataTableSection
        simulation={simulation}
        tableData={tableData}
        yearlyTableData={yearlyTableData}
        activeSeed={activeSeed}
        handleSeedFromTableChange={handleSeedFromTableChange}
      />
    </>
  );
}
