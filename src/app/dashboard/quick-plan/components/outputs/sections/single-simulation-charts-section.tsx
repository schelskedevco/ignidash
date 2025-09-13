'use client';

import { useState, memo } from 'react';

import SectionContainer from '@/components/ui/section-container';
import {
  type FixedReturnsKeyMetricsV2,
  useSingleSimulationPortfolioChartData,
  useSingleSimulationCashFlowChartData,
  useSingleSimulationReturnsChartData,
  useSingleSimulationTaxesChartData,
  useSingleSimulationContributionsChartData,
  useSingleSimulationWithdrawalsChartData,
} from '@/lib/stores/quick-plan-store';
import type { SimulationResult } from '@/lib/calc/v2/simulation-engine';

import { SingleSimulationCategory } from '../single-simulation-category-selector';
import SingleSimulationPortfolioAssetTypeAreaChartCard from '../cards/single-simulation/single-simulation-portfolio-asset-type-area-chart-card';
import SingleSimulationPortfolioAssetTypePieChartCard from '../cards/single-simulation/single-simulation-portfolio-asset-type-pie-chart-card';
import SingleSimulationCashFlowLineChartCard from '../cards/single-simulation/single-simulation-cash-flow-line-chart-card';
import SingleSimulationCashFlowBarChartCard from '../cards/single-simulation/single-simulation-cash-flow-bar-chart-card';
import SingleSimulationReturnsLineChartCard from '../cards/single-simulation/single-simulation-returns-line-chart-card';
import SingleSimulationReturnsBarChartCard from '../cards/single-simulation/single-simulation-returns-bar-chart-card';
import SingleSimulationTaxesLineChartCard from '../cards/single-simulation/single-simulation-taxes-line-chart-card';
import SingleSimulationTaxesBarChartCard from '../cards/single-simulation/single-simulation-taxes-bar-chart-card';
import SingleSimulationContributionsLineChartCard from '../cards/single-simulation/single-simulation-contributions-line-chart-card';
import SingleSimulationContributionsBarChartCard from '../cards/single-simulation/single-simulation-contributions-bar-chart-card';
import SingleSimulationWithdrawalsLineChartCard from '../cards/single-simulation/single-simulation-withdrawals-line-chart-card';
import SingleSimulationWithdrawalsBarChartCard from '../cards/single-simulation/single-simulation-withdrawals-bar-chart-card';

interface ChartsCategoryProps {
  simulation: SimulationResult;
  keyMetrics: FixedReturnsKeyMetricsV2;
  setSelectedAge: (age: number) => void;
  selectedAge: number;
}

function PortfolioCharts({ simulation, keyMetrics, setSelectedAge, selectedAge }: ChartsCategoryProps) {
  const startAge = simulation.context.startAge;

  const rawChartData = useSingleSimulationPortfolioChartData(simulation);

  const [dataView, setDataView] = useState<'asset' | 'account'>('asset');

  return (
    <>
      <SingleSimulationPortfolioAssetTypeAreaChartCard
        rawChartData={rawChartData}
        keyMetrics={keyMetrics}
        setSelectedAge={setSelectedAge}
        selectedAge={selectedAge}
        setDataView={setDataView}
        dataView={dataView}
        startAge={startAge}
      />
      <SingleSimulationPortfolioAssetTypePieChartCard rawChartData={rawChartData} selectedAge={selectedAge} dataView={dataView} />
    </>
  );
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
    <>
      <SingleSimulationTaxesLineChartCard
        rawChartData={rawChartData}
        setSelectedAge={setSelectedAge}
        selectedAge={selectedAge}
        dataView={dataView}
        setDataView={setDataView}
        startAge={startAge}
      />
      <SingleSimulationTaxesBarChartCard selectedAge={selectedAge} rawChartData={rawChartData} dataView={dataView} />
    </>
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

function ContributionsCharts({ simulation, keyMetrics, setSelectedAge, selectedAge }: ChartsCategoryProps) {
  const startAge = simulation.context.startAge;

  const rawChartData = useSingleSimulationContributionsChartData(simulation);

  const [dataView, setDataView] = useState<'annualAmounts' | 'totalAmounts' | 'account'>('annualAmounts');

  return (
    <>
      <SingleSimulationContributionsLineChartCard
        rawChartData={rawChartData}
        setSelectedAge={setSelectedAge}
        selectedAge={selectedAge}
        dataView={dataView}
        setDataView={setDataView}
        startAge={startAge}
      />
      <SingleSimulationContributionsBarChartCard selectedAge={selectedAge} rawChartData={rawChartData} dataView={dataView} />
    </>
  );
}

function WithdrawalsCharts({ simulation, keyMetrics, setSelectedAge, selectedAge }: ChartsCategoryProps) {
  const startAge = simulation.context.startAge;

  const rawChartData = useSingleSimulationWithdrawalsChartData(simulation);

  const [dataView, setDataView] = useState<'annualAmounts' | 'totalAmounts' | 'account'>('annualAmounts');

  return (
    <>
      <SingleSimulationWithdrawalsLineChartCard
        rawChartData={rawChartData}
        setSelectedAge={setSelectedAge}
        selectedAge={selectedAge}
        dataView={dataView}
        setDataView={setDataView}
        startAge={startAge}
      />
      <SingleSimulationWithdrawalsBarChartCard selectedAge={selectedAge} rawChartData={rawChartData} dataView={dataView} />
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
    case SingleSimulationCategory.Contributions:
      chartsComponents = (
        <ContributionsCharts simulation={simulation} keyMetrics={keyMetrics} setSelectedAge={setSelectedAge} selectedAge={selectedAge} />
      );
      break;
    case SingleSimulationCategory.Withdrawals:
      chartsComponents = (
        <WithdrawalsCharts simulation={simulation} keyMetrics={keyMetrics} setSelectedAge={setSelectedAge} selectedAge={selectedAge} />
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
