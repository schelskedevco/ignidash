'use client';

import { useState, useMemo } from 'react';
import { ArrowsUpDownIcon, ScaleIcon, ReceiptPercentIcon, DocumentCurrencyDollarIcon, ChartBarSquareIcon } from '@heroicons/react/20/solid';

import {
  useCurrentAge,
  useHistoricalBacktestChartData,
  useHistoricalBacktestPortfolioHistogramData,
  useHistoricalBacktestPortfolioDistributionHistogramData,
  useHistoricalBacktestAnalysis,
  useHistoricalBacktestSimulation,
  useHistoricalBacktestCashFlowChartData,
  useHistoricalBacktestPhasePercentAreaChartData,
  useHistoricalBacktestReturnsChartData,
  useHistoricalBacktestWithdrawalsChartData,
  useShowReferenceLinesPreference,
  useUpdatePreferences,
} from '@/lib/stores/quick-plan-store';
import { useIsXSmallMobile } from '@/hooks/use-mobile';
import Card from '@/components/ui/card';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import ButtonGroup from '@/components/ui/button-group';
import { Switch } from '@/components/catalyst/switch';

import StochasticResultsChart from '../charts/stochastic-results-area-chart';
import StochasticPortfolioChart from '../charts/stochastic-portfolio-bar-chart';
import StochasticCashFlowChart from '../charts/stochastic-cash-flow-bar-chart';
import StochasticCashFlowLineChart from '../charts/stochastic-cash-flow-line-chart';
import StochasticPhasePercentAreaChart from '../charts/stochastic-phase-percent-area-chart';
import StochasticReturnsChart from '../charts/stochastic-returns-bar-chart';
import StochasticReturnsLineChart from '../charts/stochastic-returns-line-chart';
import StochasticWithdrawalsChart from '../charts/stochastic-withdrawals-bar-chart';
import StochasticWithdrawalsLineChart from '../charts/stochastic-withdrawals-line-chart';
import ResultsMetrics from '../stochastic-metrics';
import StochasticDataTableSection from '../sections/stochastic-data-table-section';

export default function HistoricalBacktestOverview() {
  const currentAge = useCurrentAge();
  const isXSmallScreen = useIsXSmallMobile();

  const [selectedAge, setSelectedAge] = useState<number>(currentAge! + 1);
  const [cashFlowViewMode, setCashFlowViewMode] = useState<'inflowOutflow' | 'net'>('inflowOutflow');

  const [returnsViewMode, setReturnsViewMode] = useState<'amounts' | 'rates'>('rates');
  const [withdrawalsViewMode, setWithdrawalsViewMode] = useState<'amounts' | 'rates'>('rates');
  const [portfolioDistributionViewMode, setPortfolioDistributionViewMode] = useState<'percentiles' | 'counts'>('percentiles');

  const showReferenceLines = useShowReferenceLinesPreference();
  const updatePreferences = useUpdatePreferences();

  const simulation = useHistoricalBacktestSimulation();
  const chartData = useHistoricalBacktestChartData();
  const portfolioHistogramData = useHistoricalBacktestPortfolioHistogramData();
  const portfolioDistributionHistogramData = useHistoricalBacktestPortfolioDistributionHistogramData();
  const fireAnalysis = useHistoricalBacktestAnalysis();
  const cashFlowChartData = useHistoricalBacktestCashFlowChartData();
  const phasePercentChartData = useHistoricalBacktestPhasePercentAreaChartData();
  const returnsChartData = useHistoricalBacktestReturnsChartData();
  const withdrawalsChartData = useHistoricalBacktestWithdrawalsChartData();

  const rawPortfolioChartData =
    portfolioDistributionViewMode === 'percentiles' ? portfolioHistogramData : portfolioDistributionHistogramData;
  const memoizedPortfolioChart = useMemo(
    () => <StochasticPortfolioChart age={selectedAge} mode={portfolioDistributionViewMode} rawChartData={rawPortfolioChartData} />,
    [selectedAge, portfolioDistributionViewMode, rawPortfolioChartData]
  );
  const memoizedCashFlowChart = useMemo(
    () => <StochasticCashFlowChart age={selectedAge} mode={cashFlowViewMode} rawChartData={cashFlowChartData} />,
    [selectedAge, cashFlowViewMode, cashFlowChartData]
  );
  const memoizedCashFlowLineChart = useMemo(
    () => (
      <StochasticCashFlowLineChart
        onAgeSelect={(age) => {
          if (age >= currentAge! + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
        rawChartData={cashFlowChartData}
      />
    ),
    [cashFlowChartData, currentAge, selectedAge]
  );
  const memoizedPhasePercentChart = useMemo(
    () => (
      <StochasticPhasePercentAreaChart
        onAgeSelect={(age) => {
          if (age >= currentAge! + 1) setSelectedAge(age);
        }}
        selectedAge={selectedAge}
        chartData={phasePercentChartData}
      />
    ),
    [selectedAge, phasePercentChartData, currentAge]
  );
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
          <Card className="my-0">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-foreground text-center text-lg font-semibold sm:text-left">Portfolio Projection</h4>
              <Switch
                className="focus-outline"
                color="rose"
                checked={showReferenceLines}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') updatePreferences('showReferenceLines', !showReferenceLines);
                }}
                onChange={() => updatePreferences('showReferenceLines', !showReferenceLines)}
                aria-label="Toggle reference lines"
              />
            </div>
            <StochasticResultsChart
              fireAnalysis={fireAnalysis}
              chartData={chartData}
              showReferenceLines={showReferenceLines}
              onAgeSelect={(age) => {
                if (age >= currentAge! + 1) setSelectedAge(age);
              }}
              selectedAge={selectedAge}
            />
          </Card>
          <Card className="my-0">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-foreground flex items-center text-lg font-semibold">
                <span className="mr-2">Portfolio Distribution</span>
                <span className="text-muted-foreground">Age {selectedAge}</span>
              </h4>
              <ButtonGroup
                firstButtonText="Percentiles"
                firstButtonIcon={<ReceiptPercentIcon />}
                firstButtonOnClick={() => setPortfolioDistributionViewMode('percentiles')}
                lastButtonText="Counts"
                lastButtonIcon={<ChartBarSquareIcon />}
                lastButtonOnClick={() => setPortfolioDistributionViewMode('counts')}
                defaultActiveButton="first"
              />
            </div>
            {memoizedPortfolioChart}
          </Card>
          {!isXSmallScreen && (
            <Card className="my-0">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-foreground flex items-center text-lg font-semibold">
                  <span className="mr-2">Cash Flow</span>
                  <span className="text-muted-foreground">Age {selectedAge}</span>
                </h4>
                <ButtonGroup
                  firstButtonText="All Flows"
                  firstButtonIcon={<ArrowsUpDownIcon />}
                  firstButtonOnClick={() => setCashFlowViewMode('inflowOutflow')}
                  lastButtonText="Net"
                  lastButtonIcon={<ScaleIcon />}
                  lastButtonOnClick={() => setCashFlowViewMode('net')}
                  defaultActiveButton="first"
                />
              </div>
              {memoizedCashFlowChart}
            </Card>
          )}
          <Card className="my-0">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-foreground flex items-center text-lg font-semibold">
                <span className="mr-2">Net Cash Flow</span>
                <span className="text-muted-foreground">Time Series</span>
              </h4>
            </div>
            {memoizedCashFlowLineChart}
          </Card>
          <Card className="my-0">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-foreground flex items-center text-lg font-semibold">
                <span className="mr-2">Phase Percent</span>
                <span className="text-muted-foreground">Time Series</span>
              </h4>
            </div>
            {memoizedPhasePercentChart}
          </Card>
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
