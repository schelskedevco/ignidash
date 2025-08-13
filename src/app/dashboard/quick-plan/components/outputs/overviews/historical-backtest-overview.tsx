'use client';

import { useState, useMemo } from 'react';
import { ReceiptPercentIcon, DocumentCurrencyDollarIcon } from '@heroicons/react/20/solid';

import {
  useCurrentAge,
  useHistoricalBacktestChartData,
  useHistoricalBacktestAnalysis,
  useHistoricalBacktestSimulation,
  useHistoricalBacktestCashFlowChartData,
  useHistoricalBacktestPhasePercentAreaChartData,
  useHistoricalBacktestReturnsChartData,
  useHistoricalBacktestWithdrawalsChartData,
} from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import ButtonGroup from '@/components/ui/button-group';

import StochasticReturnsChart from '../charts/stochastic-returns-bar-chart';
import StochasticReturnsLineChart from '../charts/stochastic-returns-line-chart';
import StochasticWithdrawalsChart from '../charts/stochastic-withdrawals-bar-chart';
import StochasticWithdrawalsLineChart from '../charts/stochastic-withdrawals-line-chart';
import ResultsMetrics from '../stochastic-metrics';
import StochasticPortfolioAreaChartCard from '../cards/stochastic-portfolio-area-chart-card';
import StochasticPortfolioBarChartCard from '../cards/stochastic-portfolio-bar-chart-card';
import StochasticCashFlowBarChartCard from '../cards/stochastic-cash-flow-bar-chart-card';
import StochasticCashFlowLineChartCard from '../cards/stochastic-cash-flow-line-chart-card';
import StochasticPhasePercentAreaChartCard from '../cards/stochastic-phase-percent-area-chart-card';
import StochasticDataTableSection from '../sections/stochastic-data-table-section';

export default function HistoricalBacktestOverview() {
  const currentAge = useCurrentAge();

  const [selectedAge, setSelectedAge] = useState<number>(currentAge! + 1);

  const [returnsViewMode, setReturnsViewMode] = useState<'amounts' | 'rates'>('rates');
  const [withdrawalsViewMode, setWithdrawalsViewMode] = useState<'amounts' | 'rates'>('rates');

  const simulation = useHistoricalBacktestSimulation();
  const chartData = useHistoricalBacktestChartData(simulation);
  const fireAnalysis = useHistoricalBacktestAnalysis(simulation);
  const cashFlowChartData = useHistoricalBacktestCashFlowChartData(simulation);
  const phasePercentChartData = useHistoricalBacktestPhasePercentAreaChartData(simulation);
  const returnsChartData = useHistoricalBacktestReturnsChartData(simulation);
  const withdrawalsChartData = useHistoricalBacktestWithdrawalsChartData(simulation);

  const memoizedReturnsChart = useMemo(
    () => <StochasticReturnsChart age={selectedAge} mode={returnsViewMode} rawChartData={returnsChartData} />,
    [returnsChartData, selectedAge, returnsViewMode]
  );
  const memoizedReturnsLineChart = useMemo(
    () => (
      <StochasticReturnsLineChart
        onAgeSelect={(age) => {
          if (age >= currentAge! + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
        rawChartData={returnsChartData}
      />
    ),
    [returnsChartData, selectedAge, currentAge]
  );
  const memoizedWithdrawalsChart = useMemo(
    () => <StochasticWithdrawalsChart age={selectedAge} mode={withdrawalsViewMode} rawChartData={withdrawalsChartData} />,
    [withdrawalsChartData, selectedAge, withdrawalsViewMode]
  );
  const memoizedWithdrawalsLineChart = useMemo(
    () => (
      <StochasticWithdrawalsLineChart
        onAgeSelect={(age) => {
          if (age >= currentAge! + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
        rawChartData={withdrawalsChartData}
      />
    ),
    [withdrawalsChartData, selectedAge, currentAge]
  );

  if (chartData.length === 0) {
    return null;
  }

  return (
    <>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Key Metrics" desc="A snapshot of your simulation's most important results." />
        <ResultsMetrics fireAnalysis={fireAnalysis} />
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Data Visualization" desc="Interactive charts to explore your projection." />
        <div className="my-4 grid grid-cols-1 gap-2 [@media(min-width:1920px)]:grid-cols-2">
          <StochasticPortfolioAreaChartCard
            fireAnalysis={fireAnalysis}
            chartData={chartData}
            setSelectedAge={setSelectedAge}
            selectedAge={selectedAge}
          />
          <StochasticPortfolioBarChartCard
            simulation={simulation}
            simulationType="historicalBacktest"
            setSelectedAge={setSelectedAge}
            selectedAge={selectedAge}
          />
          <StochasticCashFlowBarChartCard selectedAge={selectedAge} rawChartData={cashFlowChartData} />
          <StochasticCashFlowLineChartCard setSelectedAge={setSelectedAge} selectedAge={selectedAge} rawChartData={cashFlowChartData} />
          <StochasticPhasePercentAreaChartCard
            setSelectedAge={setSelectedAge}
            selectedAge={selectedAge}
            rawChartData={phasePercentChartData}
          />
          <Card className="my-0">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-foreground flex items-center text-lg font-semibold">
                <span className="mr-2">Returns</span>
                <span className="text-muted-foreground">Age {selectedAge}</span>
              </h4>
              <ButtonGroup
                firstButtonText="Rates"
                firstButtonIcon={<ReceiptPercentIcon />}
                firstButtonOnClick={() => setReturnsViewMode('rates')}
                lastButtonText="Amounts"
                lastButtonIcon={<DocumentCurrencyDollarIcon />}
                lastButtonOnClick={() => setReturnsViewMode('amounts')}
                defaultActiveButton="first"
              />
            </div>
            {memoizedReturnsChart}
          </Card>
          <Card className="my-0">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-foreground flex items-center text-lg font-semibold">
                <span className="mr-2">Returns</span>
                <span className="text-muted-foreground">Time Series</span>
              </h4>
            </div>
            {memoizedReturnsLineChart}
          </Card>
          <Card className="my-0">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-foreground flex items-center text-lg font-semibold">
                <span className="mr-2">Withdrawals</span>
                <span className="text-muted-foreground">Age {selectedAge}</span>
              </h4>
              <ButtonGroup
                firstButtonText="Rates"
                firstButtonIcon={<ReceiptPercentIcon />}
                firstButtonOnClick={() => setWithdrawalsViewMode('rates')}
                lastButtonText="Amounts"
                lastButtonIcon={<DocumentCurrencyDollarIcon />}
                lastButtonOnClick={() => setWithdrawalsViewMode('amounts')}
                defaultActiveButton="first"
              />
            </div>
            {memoizedWithdrawalsChart}
          </Card>
          <Card className="my-0">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-foreground flex items-center text-lg font-semibold">
                <span className="mr-2">Withdrawal Rate</span>
                <span className="text-muted-foreground">Time Series</span>
              </h4>
            </div>
            {memoizedWithdrawalsLineChart}
          </Card>
        </div>
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Quick Stats" desc="A brief overview of your simulation's statistics." />
        <div className="text-muted-foreground ml-2 py-10 text-center font-semibold italic">
          <p>Coming soon...</p>
        </div>
      </SectionContainer>
      <StochasticDataTableSection simulation={simulation} simulationType="historicalBacktest" />
    </>
  );
}
