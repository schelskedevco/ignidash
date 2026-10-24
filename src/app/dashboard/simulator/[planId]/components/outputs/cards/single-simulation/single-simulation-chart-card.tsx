'use client';

import { useState } from 'react';

import type { KeyMetrics } from '@/lib/types/key-metrics';
import type { TaxableIncomeReferenceLineMode, AgiReferenceLineMode } from '@/lib/types/reference-line-modes';
import { TAXABLE_INCOME_REFERENCE_LINE_MODES, AGI_REFERENCE_LINE_MODES } from '@/lib/types/reference-line-modes';
import {
  useSingleSimulationNetWorthChartData,
  useSingleSimulationCashFlowChartData,
  useSingleSimulationReturnsChartData,
  useSingleSimulationTaxesChartData,
  useSingleSimulationContributionsChartData,
  useSingleSimulationWithdrawalsChartData,
  useSingleSimulationCategory,
  useDataView,
  useUpdateDataView,
} from '@/lib/stores/simulator-store';
import type { SimulationResult } from '@/lib/calc/simulation-engine';
import { SingleSimulationCategory } from '@/lib/types/simulation-category';

import SingleSimulationNetWorthAreaChartCard from './single-simulation-net-worth-area-chart-card';
import SingleSimulationNetWorthPieChartCard from './single-simulation-net-worth-pie-chart-card';
import SingleSimulationCashFlowLineChartCard from './single-simulation-cash-flow-line-chart-card';
import SingleSimulationCashFlowBarChartCard from './single-simulation-cash-flow-bar-chart-card';
import SingleSimulationCashFlowSankeyCard from './single-simulation-cash-flow-sankey-card';
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

function NetWorthCharts({ simulation, keyMetrics, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  const rawChartData = useSingleSimulationNetWorthChartData(simulation);

  const { dataView, customDataID } = useDataView('netWorth');
  const updateDataView = useUpdateDataView();
  const setDataView = (view: typeof dataView) => updateDataView('netWorth', { dataView: view });
  const setCustomDataID = (id: string) => updateDataView('netWorth', { customDataID: id });

  return (
    <>
      <SingleSimulationNetWorthAreaChartCard
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
      <SingleSimulationNetWorthPieChartCard
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

  const { dataView, customDataID } = useDataView('cashFlow');
  const updateDataView = useUpdateDataView();
  const setDataView = (view: typeof dataView) => updateDataView('cashFlow', { dataView: view });
  const setCustomDataID = (id: string) => updateDataView('cashFlow', { customDataID: id });

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
      <SingleSimulationCashFlowSankeyCard
        simulation={simulation}
        selectedAge={selectedAge}
        rawChartData={rawChartData}
        dataView={dataView}
      />
    </>
  );
}

function TaxesCharts({ simulation, keyMetrics, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  const rawChartData = useSingleSimulationTaxesChartData(simulation);

  const { dataView } = useDataView('taxes');
  const updateDataView = useUpdateDataView();
  const setDataView = (view: typeof dataView) => updateDataView('taxes', { dataView: view });

  const [referenceLineMode, setReferenceLineMode] = useState<TaxableIncomeReferenceLineMode>(TAXABLE_INCOME_REFERENCE_LINE_MODES[0]);
  const [agiReferenceLineMode, setAgiReferenceLineMode] = useState<AgiReferenceLineMode>(AGI_REFERENCE_LINE_MODES[0]);

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
        referenceLineModes={TAXABLE_INCOME_REFERENCE_LINE_MODES}
        setAgiReferenceLineMode={setAgiReferenceLineMode}
        agiReferenceLineMode={agiReferenceLineMode}
        agiReferenceLineModes={AGI_REFERENCE_LINE_MODES}
      />
    </>
  );
}

function ReturnsCharts({ simulation, keyMetrics, onAgeSelect, selectedAge, startAge }: ChartsCategoryProps) {
  const rawChartData = useSingleSimulationReturnsChartData(simulation);

  const { dataView, customDataID } = useDataView('returns');
  const updateDataView = useUpdateDataView();
  const setDataView = (view: typeof dataView) => updateDataView('returns', { dataView: view });
  const setCustomDataID = (id: string) => updateDataView('returns', { customDataID: id });

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

  const { dataView, customDataID } = useDataView('contributions');
  const updateDataView = useUpdateDataView();
  const setDataView = (view: typeof dataView) => updateDataView('contributions', { dataView: view });
  const setCustomDataID = (id: string) => updateDataView('contributions', { customDataID: id });

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

  const { dataView, customDataID } = useDataView('withdrawals');
  const updateDataView = useUpdateDataView();
  const setDataView = (view: typeof dataView) => updateDataView('withdrawals', { dataView: view });
  const setCustomDataID = (id: string) => updateDataView('withdrawals', { customDataID: id });

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
    case SingleSimulationCategory.NetWorth:
      return <NetWorthCharts {...props} />;
    case SingleSimulationCategory.CashFlow:
      return <CashFlowCharts {...props} />;
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
