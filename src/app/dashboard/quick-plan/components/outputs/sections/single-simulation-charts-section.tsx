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
import SingleSimulationPortfolioAreaChartCard from '../cards/single-simulation/single-simulation-portfolio-area-chart-card';
import SingleSimulationPortfolioPieChartCard from '../cards/single-simulation/single-simulation-portfolio-pie-chart-card';
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
  startAge: number;
  simulation: SimulationResult;
  keyMetrics: FixedReturnsKeyMetricsV2;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
}

function PortfolioCharts({ simulation, keyMetrics, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  const rawChartData = useSingleSimulationPortfolioChartData(simulation);

  const [dataView, setDataView] = useState<'assetClass' | 'taxTreatment' | 'custom'>('assetClass');
  const [customDataID, setCustomDataID] = useState<string>('');

  return (
    <>
      <SingleSimulationPortfolioAreaChartCard
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        keyMetrics={keyMetrics}
        setDataView={setDataView}
        dataView={dataView}
        setCustomDataID={setCustomDataID}
        customDataID={customDataID}
        rawChartData={rawChartData}
        startAge={startAge}
      />
      <SingleSimulationPortfolioPieChartCard
        rawChartData={rawChartData}
        selectedAge={selectedAge}
        dataView={dataView}
        customDataID={customDataID}
      />
    </>
  );
}

function CashFlowCharts({ simulation, keyMetrics, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  const rawChartData = useSingleSimulationCashFlowChartData(simulation);

  const [dataView, setDataView] = useState<'net' | 'incomes' | 'expenses' | 'custom'>('net');
  const [customDataID, setCustomDataID] = useState<string>('');

  return (
    <>
      <SingleSimulationCashFlowLineChartCard
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        setDataView={setDataView}
        dataView={dataView}
        setCustomDataID={setCustomDataID}
        customDataID={customDataID}
        rawChartData={rawChartData}
        keyMetrics={keyMetrics}
        startAge={startAge}
      />
      <SingleSimulationCashFlowBarChartCard
        rawChartData={rawChartData}
        selectedAge={selectedAge}
        dataView={dataView}
        customDataID={customDataID}
      />
    </>
  );
}

function TaxesCharts({ simulation, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  const rawChartData = useSingleSimulationTaxesChartData(simulation);

  const [dataView, setDataView] = useState<'marginalRates' | 'effectiveRates' | 'amounts' | 'net' | 'taxableIncome'>('effectiveRates');

  return (
    <>
      <SingleSimulationTaxesLineChartCard
        rawChartData={rawChartData}
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        dataView={dataView}
        setDataView={setDataView}
        startAge={startAge}
      />
      <SingleSimulationTaxesBarChartCard selectedAge={selectedAge} rawChartData={rawChartData} dataView={dataView} />
    </>
  );
}

function ReturnsCharts({ simulation, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  const rawChartData = useSingleSimulationReturnsChartData(simulation);

  const [dataView, setDataView] = useState<'rates' | 'annualAmounts' | 'totalAmounts'>('rates');

  return (
    <>
      <SingleSimulationReturnsLineChartCard
        rawChartData={rawChartData}
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        dataView={dataView}
        setDataView={setDataView}
        startAge={startAge}
      />
      <SingleSimulationReturnsBarChartCard selectedAge={selectedAge} rawChartData={rawChartData} dataView={dataView} />
    </>
  );
}

function ContributionsCharts({ simulation, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  const rawChartData = useSingleSimulationContributionsChartData(simulation);

  const [dataView, setDataView] = useState<'annualAmounts' | 'totalAmounts' | 'account'>('annualAmounts');

  return (
    <>
      <SingleSimulationContributionsLineChartCard
        rawChartData={rawChartData}
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        dataView={dataView}
        setDataView={setDataView}
        startAge={startAge}
      />
      <SingleSimulationContributionsBarChartCard selectedAge={selectedAge} rawChartData={rawChartData} dataView={dataView} />
    </>
  );
}

function WithdrawalsCharts({ simulation, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  const rawChartData = useSingleSimulationWithdrawalsChartData(simulation);

  const [dataView, setDataView] = useState<'annualAmounts' | 'totalAmounts' | 'account'>('annualAmounts');

  return (
    <>
      <SingleSimulationWithdrawalsLineChartCard
        rawChartData={rawChartData}
        onAgeSelect={onAgeSelect}
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
  onAgeSelect: (age: number) => void;
  selectedAge: number;
  currentCategory: SingleSimulationCategory;
}

function SingleSimulationChartsSection({
  simulation,
  keyMetrics,
  onAgeSelect,
  selectedAge,
  currentCategory,
}: SingleSimulationChartsSectionProps) {
  const startAge = simulation.context.startAge;
  const props: ChartsCategoryProps = { simulation, keyMetrics, onAgeSelect, selectedAge, startAge };

  let chartsComponents = null;
  switch (currentCategory) {
    case SingleSimulationCategory.Portfolio:
      chartsComponents = <PortfolioCharts {...props} />;
      break;
    case SingleSimulationCategory.CashFlow:
      chartsComponents = <CashFlowCharts {...props} />;
      break;
    case SingleSimulationCategory.Taxes:
      chartsComponents = <TaxesCharts {...props} />;
      break;
    case SingleSimulationCategory.Returns:
      chartsComponents = <ReturnsCharts {...props} />;
      break;
    case SingleSimulationCategory.Contributions:
      chartsComponents = <ContributionsCharts {...props} />;
      break;
    case SingleSimulationCategory.Withdrawals:
      chartsComponents = <WithdrawalsCharts {...props} />;
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
