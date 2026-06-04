'use client';

import { useMemo } from 'react';

import type { SingleSimulationCashFlowChartDataPoint } from '@/lib/types/chart-data-points';
import type { CashFlowDataView } from '@/lib/types/chart-data-views';
import { SankeyDataExtractor } from '@/lib/calc/data-extractors/sankey-data-extractor';
import type { SimulationResult } from '@/lib/calc/simulation-engine';

import SankeyDiagram from '../../charts/single-simulation/single-simulation-cash-flow-sankey-chart';
import ChartCard from '../chart-card';

interface SingleSimulationCashFlowSankeyCardProps {
  simulation: SimulationResult;
  selectedAge: number;
  rawChartData: SingleSimulationCashFlowChartDataPoint[];
  dataView: CashFlowDataView;
}

export default function SingleSimulationCashFlowSankeyCard({
  simulation,
  selectedAge,
  rawChartData,
  dataView,
}: SingleSimulationCashFlowSankeyCardProps) {
  // Find the data point closest to the selected age
  const sankeyData = useMemo(() => {
    const allYears = SankeyDataExtractor.extractForAllYears(simulation.data);
    // Find the index matching selectedAge
    const targetIndex = allYears.findIndex((d) => d.label === `Age ${selectedAge}`);
    if (targetIndex === -1 && allYears.length > 0) {
      // Fallback to last year
      return allYears[allYears.length - 1];
    }
    return targetIndex !== -1 ? allYears[targetIndex] : null;
  }, [simulation.data, selectedAge]);

  if (!sankeyData || !sankeyData.nodes.length) {
    return null;
  }

  return (
    <ChartCard
      title="Cash Flow Sankey"
      subtitle={`Age ${selectedAge}`}
      truncateTitle
    >
      <SankeyDiagram data={sankeyData} />
    </ChartCard>
  );
}