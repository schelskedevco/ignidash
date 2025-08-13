'use client';

import { useState } from 'react';

import {
  useCurrentAge,
  useHistoricalBacktestPortfolioAreaChartData,
  useHistoricalBacktestAnalysis,
  useHistoricalBacktestSimulation,
  useHistoricalBacktestCashFlowChartData,
  useHistoricalBacktestPhasePercentAreaChartData,
  useHistoricalBacktestReturnsChartData,
  useHistoricalBacktestWithdrawalsChartData,
} from '@/lib/stores/quick-plan-store';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';

import ResultsMetrics from '../stochastic-metrics';
import StochasticPortfolioAreaChartCard from '../cards/stochastic-portfolio-area-chart-card';
import StochasticPortfolioBarChartCard from '../cards/stochastic-portfolio-bar-chart-card';
import StochasticCashFlowBarChartCard from '../cards/stochastic-cash-flow-bar-chart-card';
import StochasticCashFlowLineChartCard from '../cards/stochastic-cash-flow-line-chart-card';
import StochasticPhasePercentAreaChartCard from '../cards/stochastic-phase-percent-area-chart-card';
import StochasticReturnsBarChartCard from '../cards/stochastic-returns-bar-chart-card';
import StochasticReturnsLineChartCard from '../cards/stochastic-returns-line-chart-card';
import StochasticWithdrawalsBarChartCard from '../cards/stochastic-withdrawals-bar-chart-card';
import StochasticWithdrawalsLineChartCard from '../cards/stochastic-withdrawals-line-chart-card';
import StochasticDataTableSection from '../sections/stochastic-data-table-section';

export default function HistoricalBacktestOverview() {
  const currentAge = useCurrentAge();
  const [selectedAge, setSelectedAge] = useState<number>(currentAge! + 1);

  const simulation = useHistoricalBacktestSimulation();

  const analysis = useHistoricalBacktestAnalysis(simulation);
  const portfolioAreaChartData = useHistoricalBacktestPortfolioAreaChartData(simulation);
  const cashFlowChartData = useHistoricalBacktestCashFlowChartData(simulation);
  const phasePercentChartData = useHistoricalBacktestPhasePercentAreaChartData(simulation);
  const returnsChartData = useHistoricalBacktestReturnsChartData(simulation);
  const withdrawalsChartData = useHistoricalBacktestWithdrawalsChartData(simulation);

  return (
    <>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Key Metrics" desc="A snapshot of your simulation's most important results." />
        <ResultsMetrics analysis={analysis} />
      </SectionContainer>
      <SectionContainer showBottomBorder>
        <SectionHeader title="Data Visualization" desc="Interactive charts to explore your projection." />
        <div className="my-4 grid grid-cols-1 gap-2 [@media(min-width:1920px)]:grid-cols-2">
          <StochasticPortfolioAreaChartCard
            analysis={analysis}
            rawChartData={portfolioAreaChartData}
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
          <StochasticReturnsBarChartCard selectedAge={selectedAge} rawChartData={returnsChartData} />
          <StochasticReturnsLineChartCard setSelectedAge={setSelectedAge} selectedAge={selectedAge} rawChartData={returnsChartData} />
          <StochasticWithdrawalsBarChartCard selectedAge={selectedAge} rawChartData={withdrawalsChartData} />
          <StochasticWithdrawalsLineChartCard
            setSelectedAge={setSelectedAge}
            selectedAge={selectedAge}
            rawChartData={withdrawalsChartData}
          />
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
