'use client';

import { useState } from 'react';

import type { KeyMetrics } from '@/lib/types/key-metrics';
import {
  useSingleSimulationPortfolioChartData,
  useSingleSimulationIncomeExpensesChartData,
  useSingleSimulationReturnsChartData,
  useSingleSimulationTaxesChartData,
  useSingleSimulationContributionsChartData,
  useSingleSimulationWithdrawalsChartData,
  useSingleSimulationCategory,
} from '@/lib/stores/simulator-store';
import type { SimulationResult } from '@/lib/calc/simulation-engine';
import { SingleSimulationCategory } from '@/lib/types/simulation-category';

import SingleSimulationPortfolioAreaChartCard from './single-simulation-portfolio-area-chart-card';
import SingleSimulationPortfolioPieChartCard from './single-simulation-portfolio-pie-chart-card';
import SingleSimulationIncomeExpensesLineChartCard from './single-simulation-income-expenses-line-chart-card';
import SingleSimulationIncomeExpensesBarChartCard from './single-simulation-income-expenses-bar-chart-card';
import SingleSimulationReturnsLineChartCard from './single-simulation-returns-line-chart-card';
import SingleSimulationReturnsBarChartCard from './single-simulation-returns-bar-chart-card';
import SingleSimulationTaxesLineChartCard from './single-simulation-taxes-line-chart-card';
import SingleSimulationTaxesBarChartCard from './single-simulation-taxes-bar-chart-card';
import SingleSimulationContributionsLineChartCard from './single-simulation-contributions-line-chart-card';
import SingleSimulationContributionsBarChartCard from './single-simulation-contributions-bar-chart-card';
import SingleSimulationWithdrawalsLineChartCard from './single-simulation-withdrawals-line-chart-card';
import SingleSimulationWithdrawalsBarChartCard from './single-simulation-withdrawals-bar-chart-card';

interface ChartsCategoryProps {
  startAge: number;
  simulation: SimulationResult;
  keyMetrics: KeyMetrics;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
}

function PortfolioCharts({ simulation, keyMetrics, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  const rawChartData = useSingleSimulationPortfolioChartData(simulation);

  const [dataView, setDataView] = useState<'assetClass' | 'taxCategory' | 'netChange' | 'custom'>('taxCategory');
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

function IncomeExpensesCharts({ simulation, keyMetrics, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  const rawChartData = useSingleSimulationIncomeExpensesChartData(simulation);

  const [dataView, setDataView] = useState<'surplusDeficit' | 'cashFlow' | 'incomes' | 'expenses' | 'custom' | 'savingsRate'>(
    'surplusDeficit'
  );
  const [customDataID, setCustomDataID] = useState<string>('');

  return (
    <>
      <SingleSimulationIncomeExpensesLineChartCard
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
      <SingleSimulationIncomeExpensesBarChartCard
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
    | 'nonTaxableIncome'
    | 'ordinaryIncome'
    | 'capGainsAndDividends'
    | 'earlyWithdrawalPenalties'
    | 'adjustmentsAndDeductions'
    | 'socialSecurityIncome'
    | 'socialSecurityTaxablePercentage'
  >('annualAmounts');

  const referenceLineModes = ['marginalIncomeTaxRates', 'marginalCapGainsTaxRates', 'hideReferenceLines'] as const;
  const [referenceLineMode, setReferenceLineMode] = useState<(typeof referenceLineModes)[number]>(referenceLineModes[0]);

  const agiReferenceLineModes = ['niitThreshold', 'hideReferenceLines'] as const;
  const [agiReferenceLineMode, setAgiReferenceLineMode] = useState<(typeof agiReferenceLineModes)[number]>(agiReferenceLineModes[0]);

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
        setAgiReferenceLineMode={setAgiReferenceLineMode}
        agiReferenceLineMode={agiReferenceLineMode}
        agiReferenceLineModes={agiReferenceLineModes}
      />
    </>
  );
}

function ReturnsCharts({ simulation, keyMetrics, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  const rawChartData = useSingleSimulationReturnsChartData(simulation);

  const [dataView, setDataView] = useState<'rates' | 'annualAmounts' | 'cumulativeAmounts' | 'taxCategory' | 'custom'>('rates');
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

  const [dataView, setDataView] = useState<
    'annualAmounts' | 'cumulativeAmounts' | 'taxCategory' | 'custom' | 'employerMatch' | 'shortfall'
  >('taxCategory');
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
    | 'earlyWithdrawals'
    | 'shortfall'
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

interface SingleSimulationChartProps {
  simulation: SimulationResult;
  keyMetrics: KeyMetrics;
  onAgeSelect: (age: number) => void;
  selectedAge: number;
}

export default function SingleSimulationChartCard({ simulation, keyMetrics, onAgeSelect, selectedAge }: SingleSimulationChartProps) {
  const resultsCategory = useSingleSimulationCategory();

  const startAge = simulation.context.startAge;
  const props: ChartsCategoryProps = { simulation, keyMetrics, onAgeSelect, selectedAge, startAge };

  switch (resultsCategory) {
    case SingleSimulationCategory.Portfolio:
      return <PortfolioCharts {...props} />;
    case SingleSimulationCategory.CashFlow:
      return <IncomeExpensesCharts {...props} />;
    case SingleSimulationCategory.Taxes:
      return <TaxesCharts {...props} />;
    case SingleSimulationCategory.Returns:
      return <ReturnsCharts {...props} />;
    case SingleSimulationCategory.Contributions:
      return <ContributionsCharts {...props} />;
    case SingleSimulationCategory.Withdrawals:
      return <WithdrawalsCharts {...props} />;
    default:
      return (
        <div className="text-muted-foreground ml-2 py-10 text-center font-semibold italic">
          <p>Coming soon...</p>
        </div>
      );
  }
}
