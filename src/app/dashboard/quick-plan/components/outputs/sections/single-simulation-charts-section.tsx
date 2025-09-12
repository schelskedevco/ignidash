'use client';

import { useState, memo } from 'react';

import SectionContainer from '@/components/ui/section-container';
import {
  type FixedReturnsKeyMetricsV2,
  useSingleSimulationPortfolioAssetTypeAreaChartData,
  useSingleSimulationPortfolioAccountTypeAreaChartData,
  useSingleSimulationCashFlowChartData,
  useSingleSimulationReturnsChartData,
  useSingleSimulationTaxesChartData,
} from '@/lib/stores/quick-plan-store';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';

import { SingleSimulationCategory } from '../single-simulation-category-selector';
import SingleSimulationPortfolioAssetTypeAreaChartCard from '../cards/single-simulation/single-simulation-portfolio-asset-type-area-chart-card';
import SingleSimulationPortfolioAccountTypeAreaChartCard from '../cards/single-simulation/single-simulation-portfolio-account-type-area-chart-card';
import SingleSimulationPortfolioAssetTypePieChartCard from '../cards/single-simulation/single-simulation-portfolio-asset-type-pie-chart-card';
import SingleSimulationPortfolioAccountTypePieChartCard from '../cards/single-simulation/single-simulation-portfolio-account-type-pie-chart-card';
import SingleSimulationCashFlowLineChartCard from '../cards/single-simulation/single-simulation-cash-flow-line-chart-card';
import SingleSimulationCashFlowBarChartCard from '../cards/single-simulation/single-simulation-cash-flow-bar-chart-card';
import SingleSimulationReturnsLineChartCard from '../cards/single-simulation/single-simulation-returns-line-chart-card';
import SingleSimulationReturnsBarChartCard from '../cards/single-simulation/single-simulation-returns-bar-chart-card';
import SingleSimulationTaxesLineChartCard from '../cards/single-simulation/single-simulation-taxes-line-chart-card';

interface ChartsCategoryProps {
  simulation: SimulationResult;
  keyMetrics: FixedReturnsKeyMetricsV2;
  setSelectedAge: (age: number) => void;
  selectedAge: number;
}

function PortfolioCharts({ simulation, keyMetrics, setSelectedAge, selectedAge }: ChartsCategoryProps) {
  const startAge = simulation.context.startAge;

  const assetTypeRawChartData = useSingleSimulationPortfolioAssetTypeAreaChartData(simulation);
  const accountTypeRawChartData = useSingleSimulationPortfolioAccountTypeAreaChartData(simulation);

  const [dataView, setDataView] = useState<'asset' | 'account'>('asset');

  switch (dataView) {
    case 'asset':
      return (
        <>
          <SingleSimulationPortfolioAssetTypeAreaChartCard
            rawChartData={assetTypeRawChartData}
            keyMetrics={keyMetrics}
            setSelectedAge={setSelectedAge}
            selectedAge={selectedAge}
            setDataView={setDataView}
            dataView={dataView}
            startAge={startAge}
          />
          <SingleSimulationPortfolioAssetTypePieChartCard rawChartData={assetTypeRawChartData} selectedAge={selectedAge} />
        </>
      );
    case 'account':
      return (
        <>
          <SingleSimulationPortfolioAccountTypeAreaChartCard
            rawChartData={accountTypeRawChartData}
            keyMetrics={keyMetrics}
            setSelectedAge={setSelectedAge}
            selectedAge={selectedAge}
            setDataView={setDataView}
            dataView={dataView}
            startAge={startAge}
          />
          <SingleSimulationPortfolioAccountTypePieChartCard rawChartData={accountTypeRawChartData} selectedAge={selectedAge} />
        </>
      );
  }
}

function CashFlowCharts({ simulation, keyMetrics, setSelectedAge, selectedAge }: ChartsCategoryProps) {
  const startAge = simulation.context.startAge;

  const rawChartData = useSingleSimulationCashFlowChartData(simulation);

  const [dataView, setDataView] = useState<'net' | 'incomes' | 'expenses' | 'custom'>('net');
  const [customDataName, setCustomDataName] = useState<string>('');

  return (
    <>
      <SingleSimulationCashFlowLineChartCard
        setSelectedAge={setSelectedAge}
        selectedAge={selectedAge}
        setDataView={setDataView}
        dataView={dataView}
        setCustomDataName={setCustomDataName}
        customDataName={customDataName}
        rawChartData={rawChartData}
        startAge={startAge}
      />
      <SingleSimulationCashFlowBarChartCard
        selectedAge={selectedAge}
        rawChartData={rawChartData}
        dataView={dataView}
        customDataName={customDataName}
      />
    </>
  );
}

function TaxesCharts({ simulation, keyMetrics, setSelectedAge, selectedAge }: ChartsCategoryProps) {
  const startAge = simulation.context.startAge;

  const rawChartData = useSingleSimulationTaxesChartData(simulation);

  const [dataView, setDataView] = useState<'marginalRates' | 'effectiveRates' | 'amounts' | 'net' | 'taxableIncome'>('effectiveRates');

  return (
    <SingleSimulationTaxesLineChartCard
      rawChartData={rawChartData}
      setSelectedAge={setSelectedAge}
      selectedAge={selectedAge}
      dataView={dataView}
      setDataView={setDataView}
      startAge={startAge}
    />
  );
}

function ReturnsCharts({ simulation, keyMetrics, setSelectedAge, selectedAge }: ChartsCategoryProps) {
  const startAge = simulation.context.startAge;

  const rawChartData = useSingleSimulationReturnsChartData(simulation);

  const [dataView, setDataView] = useState<'rates' | 'annualAmounts' | 'totalAmounts'>('rates');

  return (
    <>
      <SingleSimulationReturnsLineChartCard
        rawChartData={rawChartData}
        setSelectedAge={setSelectedAge}
        selectedAge={selectedAge}
        dataView={dataView}
        setDataView={setDataView}
        startAge={startAge}
      />
      <SingleSimulationReturnsBarChartCard selectedAge={selectedAge} rawChartData={rawChartData} dataView={dataView} />
    </>
  );
}

interface SingleSimulationChartsSectionProps {
  simulation: SimulationResult;
  keyMetrics: FixedReturnsKeyMetricsV2;
  setSelectedAge: (age: number) => void;
  selectedAge: number;
  currentCategory: SingleSimulationCategory;
}

function SingleSimulationChartsSection({
  simulation,
  keyMetrics,
  setSelectedAge,
  selectedAge,
  currentCategory,
}: SingleSimulationChartsSectionProps) {
  let chartsComponents = null;
  switch (currentCategory) {
    case SingleSimulationCategory.Portfolio:
      chartsComponents = (
        <PortfolioCharts simulation={simulation} keyMetrics={keyMetrics} setSelectedAge={setSelectedAge} selectedAge={selectedAge} />
      );
      break;
    case SingleSimulationCategory.CashFlow:
      chartsComponents = (
        <CashFlowCharts simulation={simulation} keyMetrics={keyMetrics} setSelectedAge={setSelectedAge} selectedAge={selectedAge} />
      );
      break;
    case SingleSimulationCategory.Taxes:
      chartsComponents = (
        <TaxesCharts simulation={simulation} keyMetrics={keyMetrics} setSelectedAge={setSelectedAge} selectedAge={selectedAge} />
      );
      break;
    case SingleSimulationCategory.Returns:
      chartsComponents = (
        <ReturnsCharts simulation={simulation} keyMetrics={keyMetrics} setSelectedAge={setSelectedAge} selectedAge={selectedAge} />
      );
      break;
    default:
      chartsComponents = (
        <div className="text-muted-foreground ml-2 py-10 text-center font-semibold italic">
          <p>Coming soon...</p>
        </div>
      );
      break;
  }

  return (
    <SectionContainer showBottomBorder>
      <div className="mb-4 grid grid-cols-1 gap-2">{chartsComponents}</div>
    </SectionContainer>
  );
}

// Memoize the entire section to prevent re-renders when props haven't changed
export default memo(SingleSimulationChartsSection);
