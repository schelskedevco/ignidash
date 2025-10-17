'use client';

import type { KeyMetrics } from '@/lib/types/key-metrics';
import SectionContainer from '@/components/ui/section-container';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/multi-simulation-table-schema';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';
import { SimulationCategory } from '@/lib/types/simulation-category';
import { MultiSimulationChartData } from '@/lib/types/chart-data-points';

import SimulationCategorySelector from '../simulation-category-selector';
import SingleSimulationChartsSection from '../sections/single-simulation-charts-section';
import MultiSimulationChartsSection from '../sections/multi-simulation-charts-section';
import MultiSimulationDataTableSection from '../sections/multi-simulation-data-table-section';

interface MultiSimulationMainResultsProps {
  simulationAndKeyMetrics: { simulation: SimulationResult; keyMetrics: KeyMetrics } | null;
  tableData: MultiSimulationTableRow[];
  yearlyTableData: YearlyAggregateTableRow[];
  chartData: MultiSimulationChartData;
  setCurrentCategory: (category: SimulationCategory) => void;
  currentCategory: SimulationCategory;
  setCurrentPercentile: (percentile: 'p10' | 'p25' | 'p50' | 'p75' | 'p90' | null) => void;
  currentPercentile: 'p10' | 'p25' | 'p50' | 'p75' | 'p90' | null;
  removeActiveSeed: () => void;
  activeSeed?: number | undefined;
  activeSeedType?: 'table' | 'percentile' | undefined;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  setSelectedSeedFromTable: (seed: number | null) => void;
}

export default function MultiSimulationMainResults({
  simulationAndKeyMetrics,
  tableData,
  yearlyTableData,
  chartData,
  setCurrentCategory,
  currentCategory,
  setCurrentPercentile,
  currentPercentile,
  removeActiveSeed,
  activeSeed,
  activeSeedType,
  onAgeSelect,
  selectedAge,
  setSelectedSeedFromTable,
}: MultiSimulationMainResultsProps) {
  const availableCategories =
    simulationAndKeyMetrics !== null
      ? Object.values(SimulationCategory).filter((category) => category !== 'Phases')
      : [SimulationCategory.Portfolio, SimulationCategory.Phases];

  return (
    <>
      <SectionContainer
        showBottomBorder
        className="from-emphasized-background to-background bg-gradient-to-l py-0 xl:sticky xl:top-[4.3125rem] xl:z-10"
      >
        <SimulationCategorySelector
          availableCategories={availableCategories}
          setCurrentCategory={setCurrentCategory}
          currentCategory={currentCategory}
          currentPercentile={currentPercentile}
          setCurrentPercentile={setCurrentPercentile}
          removeActiveSeed={removeActiveSeed}
          activeSeed={activeSeed}
          activeSeedType={activeSeedType}
        />
      </SectionContainer>
      {simulationAndKeyMetrics !== null ? (
        <SingleSimulationChartsSection
          {...simulationAndKeyMetrics}
          onAgeSelect={onAgeSelect}
          selectedAge={selectedAge}
          currentCategory={currentCategory}
        />
      ) : (
        <MultiSimulationChartsSection
          chartData={chartData}
          onAgeSelect={onAgeSelect}
          selectedAge={selectedAge}
          currentCategory={currentCategory}
        />
      )}
      <MultiSimulationDataTableSection
        simulation={simulationAndKeyMetrics?.simulation}
        tableData={tableData}
        yearlyTableData={yearlyTableData}
        currentCategory={currentCategory}
        activeSeed={activeSeed}
        setSelectedSeedFromTable={setSelectedSeedFromTable}
      />
    </>
  );
}
