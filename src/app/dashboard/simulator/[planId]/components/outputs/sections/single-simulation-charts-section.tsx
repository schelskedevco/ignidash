'use client';

import { useState, memo } from 'react';

import SectionContainer from '@/components/ui/section-container';
import type { KeyMetrics } from '@/lib/types/key-metrics';
import {
  useSingleSimulationPortfolioChartData,
  useSingleSimulationCashFlowChartData,
  useSingleSimulationReturnsChartData,
  useSingleSimulationTaxesChartData,
  useSingleSimulationContributionsChartData,
  useSingleSimulationWithdrawalsChartData,
  useResultsCategory,
} from '@/lib/stores/simulator-store';
import type { SimulationResult } from '@/lib/calc/simulation-engine';
import { SimulationCategory } from '@/lib/types/simulation-category';

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
import SingleSimulationDataListSection from './single-simulation-data-list-section';

interface ChartsCategoryProps {
  startAge: number;
  simulation: SimulationResult;
  keyMetrics: KeyMetrics;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
}

function PortfolioCharts({ simulation, keyMetrics, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  const rawChartData = useSingleSimulationPortfolioChartData(simulation);

  const [dataView, setDataView] = useState<'assetClass' | 'taxCategory' | 'custom'>('taxCategory');
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

  const [dataView, setDataView] = useState<'net' | 'incomes' | 'expenses' | 'custom' | 'savingsRate'>('net');
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

function TaxesCharts({ simulation, keyMetrics, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  const rawChartData = useSingleSimulationTaxesChartData(simulation);

  const [dataView, setDataView] = useState<
    | 'marginalRates'
    | 'effectiveRates'
    | 'annualAmounts'
    | 'cumulativeAmounts'
    | 'taxableIncome'
    | 'adjustedGrossIncome'
    | 'investmentIncome'
    | 'retirementDistributions'
    | 'taxExemptIncome'
    | 'ordinaryIncome'
    | 'capGainsAndDividends'
    | 'earlyWithdrawalPenalties'
    | 'adjustmentsAndDeductions'
  >('annualAmounts');

  const referenceLineModes = ['marginalIncomeTaxRates', 'marginalCapGainsTaxRates', 'hideReferenceLines'] as const;
  const [referenceLineMode, setReferenceLineMode] = useState<(typeof referenceLineModes)[number]>(referenceLineModes[0]);

  return (
    <>
      <SingleSimulationTaxesLineChartCard
        rawChartData={rawChartData}
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        dataView={dataView}
        setDataView={setDataView}
        keyMetrics={keyMetrics}
        startAge={startAge}
      />
      <SingleSimulationTaxesBarChartCard
        selectedAge={selectedAge}
        rawChartData={rawChartData}
        dataView={dataView}
        setReferenceLineMode={setReferenceLineMode}
        referenceLineMode={referenceLineMode}
        referenceLineModes={referenceLineModes}
        startAge={startAge}
      />
    </>
  );
}

function ReturnsCharts({ simulation, keyMetrics, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  const rawChartData = useSingleSimulationReturnsChartData(simulation);

  const [dataView, setDataView] = useState<'rates' | 'annualAmounts' | 'cumulativeAmounts' | 'custom'>('rates');
  const [customDataID, setCustomDataID] = useState<string>('');

  return (
    <>
      <SingleSimulationReturnsLineChartCard
        rawChartData={rawChartData}
        keyMetrics={keyMetrics}
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        dataView={dataView}
        setDataView={setDataView}
        customDataID={customDataID}
        setCustomDataID={setCustomDataID}
        startAge={startAge}
      />
      <SingleSimulationReturnsBarChartCard
        selectedAge={selectedAge}
        rawChartData={rawChartData}
        dataView={dataView}
        customDataID={customDataID}
      />
    </>
  );
}

function ContributionsCharts({ simulation, keyMetrics, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  const rawChartData = useSingleSimulationContributionsChartData(simulation);

  const [dataView, setDataView] = useState<'annualAmounts' | 'cumulativeAmounts' | 'taxCategory' | 'custom' | 'employerMatch'>(
    'taxCategory'
  );
  const [customDataID, setCustomDataID] = useState<string>('');

  return (
    <>
      <SingleSimulationContributionsLineChartCard
        rawChartData={rawChartData}
        keyMetrics={keyMetrics}
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        setDataView={setDataView}
        dataView={dataView}
        setCustomDataID={setCustomDataID}
        customDataID={customDataID}
        startAge={startAge}
      />
      <SingleSimulationContributionsBarChartCard
        selectedAge={selectedAge}
        rawChartData={rawChartData}
        dataView={dataView}
        customDataID={customDataID}
      />
    </>
  );
}

function WithdrawalsCharts({ simulation, keyMetrics, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  const rawChartData = useSingleSimulationWithdrawalsChartData(simulation);

  const [dataView, setDataView] = useState<
    | 'annualAmounts'
    | 'cumulativeAmounts'
    | 'taxCategory'
    | 'realizedGains'
    | 'requiredMinimumDistributions'
    | 'earlyWithdrawalPenalties'
    | 'earlyWithdrawals'
    | 'withdrawalRate'
    | 'custom'
  >('taxCategory');
  const [customDataID, setCustomDataID] = useState<string>('');

  return (
    <>
      <SingleSimulationWithdrawalsLineChartCard
        rawChartData={rawChartData}
        keyMetrics={keyMetrics}
        onAgeSelect={onAgeSelect}
        selectedAge={selectedAge}
        setDataView={setDataView}
        dataView={dataView}
        setCustomDataID={setCustomDataID}
        customDataID={customDataID}
        startAge={startAge}
      />
      <SingleSimulationWithdrawalsBarChartCard
        selectedAge={selectedAge}
        rawChartData={rawChartData}
        dataView={dataView}
        customDataID={customDataID}
      />
    </>
  );
}

interface SingleSimulationChartsSectionProps {
  simulation: SimulationResult;
  keyMetrics: KeyMetrics;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
}

function SingleSimulationChartsSection({ simulation, keyMetrics, onAgeSelect, selectedAge }: SingleSimulationChartsSectionProps) {
  const resultsCategory = useResultsCategory();

  const startAge = simulation.context.startAge;
  const props: ChartsCategoryProps = { simulation, keyMetrics, onAgeSelect, selectedAge, startAge };

  let chartsComponents = null;
  switch (resultsCategory) {
    case SimulationCategory.Portfolio:
      chartsComponents = <PortfolioCharts {...props} />;
      break;
    case SimulationCategory.CashFlow:
      chartsComponents = <CashFlowCharts {...props} />;
      break;
    case SimulationCategory.Taxes:
      chartsComponents = <TaxesCharts {...props} />;
      break;
    case SimulationCategory.Returns:
      chartsComponents = <ReturnsCharts {...props} />;
      break;
    case SimulationCategory.Contributions:
      chartsComponents = <ContributionsCharts {...props} />;
      break;
    case SimulationCategory.Withdrawals:
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
      <div className="grid grid-cols-1 gap-2 @[96rem]:grid-cols-2">
        {chartsComponents}
        <div className="@[96rem]:col-span-2">
          <SingleSimulationDataListSection simulation={simulation} selectedAge={selectedAge} />
        </div>
      </div>
    </SectionContainer>
  );
}

// Memoize the entire section to prevent re-renders when props haven't changed
export default memo(SingleSimulationChartsSection);
