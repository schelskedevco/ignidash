'use client';

import { useState, memo } from 'react';

import { useCurrentAge, type StochasticAnalysis } from '@/lib/stores/quick-plan-store';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import type { AggregateSimulationStats } from '@/lib/calc/simulation-analyzer';
import {
  useStochasticPortfolioAreaChartData,
  useStochasticPortfolioPercentilesChartData,
  useStochasticPortfolioDistributionChartData,
  useStochasticCashFlowChartData,
  useStochasticPhasePercentAreaChartData,
  useStochasticReturnsChartData,
  useStochasticWithdrawalsChartData,
} from '@/lib/stores/quick-plan-store';

import StochasticPortfolioAreaChartCard from '../cards/stochastic-portfolio-area-chart-card';
import StochasticPortfolioBarChartCard from '../cards/stochastic-portfolio-bar-chart-card';
import StochasticCashFlowBarChartCard from '../cards/stochastic-cash-flow-bar-chart-card';
import StochasticCashFlowLineChartCard from '../cards/stochastic-cash-flow-line-chart-card';
import StochasticPhasePercentAreaChartCard from '../cards/stochastic-phase-percent-area-chart-card';
import StochasticReturnsBarChartCard from '../cards/stochastic-returns-bar-chart-card';
import StochasticReturnsLineChartCard from '../cards/stochastic-returns-line-chart-card';
import StochasticWithdrawalsBarChartCard from '../cards/stochastic-withdrawals-bar-chart-card';
import StochasticWithdrawalsLineChartCard from '../cards/stochastic-withdrawals-line-chart-card';
import ChartsCategorySelector, { ChartsCategory } from '../charts-category-selector';

interface ChartsCategoryProps {
  simStats: AggregateSimulationStats;
  analysis: StochasticAnalysis | null;
  setSelectedAge: (age: number) => void;
  selectedAge: number;
}

function PortfolioCharts({ simStats, analysis, setSelectedAge, selectedAge }: ChartsCategoryProps) {
  const portfolioAreaChartData = useStochasticPortfolioAreaChartData(simStats);
  const portfolioPercentilesChartData = useStochasticPortfolioPercentilesChartData(simStats);
  const portfolioDistributionChartData = useStochasticPortfolioDistributionChartData(simStats);

  return (
    <>
      <StochasticPortfolioAreaChartCard
        analysis={analysis}
        rawChartData={portfolioAreaChartData}
        setSelectedAge={setSelectedAge}
        selectedAge={selectedAge}
      />
      <StochasticPortfolioBarChartCard
        percentilesData={portfolioPercentilesChartData}
        distributionData={portfolioDistributionChartData}
        selectedAge={selectedAge}
      />
    </>
  );
}

function CashFlowCharts({ simStats, setSelectedAge, selectedAge }: ChartsCategoryProps) {
  const cashFlowChartData = useStochasticCashFlowChartData(simStats);

  return (
    <>
      <StochasticCashFlowLineChartCard setSelectedAge={setSelectedAge} selectedAge={selectedAge} rawChartData={cashFlowChartData} />
      <StochasticCashFlowBarChartCard selectedAge={selectedAge} rawChartData={cashFlowChartData} />
    </>
  );
}

function PhasesCharts({ simStats, setSelectedAge, selectedAge }: ChartsCategoryProps) {
  const phasePercentChartData = useStochasticPhasePercentAreaChartData(simStats);

  return (
    <StochasticPhasePercentAreaChartCard setSelectedAge={setSelectedAge} selectedAge={selectedAge} rawChartData={phasePercentChartData} />
  );
}

function ReturnsCharts({ simStats, setSelectedAge, selectedAge }: ChartsCategoryProps) {
  const returnsChartData = useStochasticReturnsChartData(simStats);

  return (
    <>
      <StochasticReturnsLineChartCard setSelectedAge={setSelectedAge} selectedAge={selectedAge} rawChartData={returnsChartData} />
      <StochasticReturnsBarChartCard selectedAge={selectedAge} rawChartData={returnsChartData} />
    </>
  );
}

function WithdrawalsCharts({ simStats, setSelectedAge, selectedAge }: ChartsCategoryProps) {
  const withdrawalsChartData = useStochasticWithdrawalsChartData(simStats);

  return (
    <>
      <StochasticWithdrawalsLineChartCard setSelectedAge={setSelectedAge} selectedAge={selectedAge} rawChartData={withdrawalsChartData} />
      <StochasticWithdrawalsBarChartCard selectedAge={selectedAge} rawChartData={withdrawalsChartData} />
    </>
  );
}

interface StochasticChartsSectionProps {
  simStats: AggregateSimulationStats;
  analysis: StochasticAnalysis | null;
}

function StochasticChartsSection({ simStats, analysis }: StochasticChartsSectionProps) {
  const currentAge = useCurrentAge();
  const [selectedAge, setSelectedAge] = useState<number>(currentAge! + 1);
  const [currentCategory, setCurrentCategory] = useState<ChartsCategory>(ChartsCategory.Portfolio);

  let chartsComponents = null;
  switch (currentCategory) {
    case ChartsCategory.Portfolio:
      chartsComponents = (
        <PortfolioCharts simStats={simStats} analysis={analysis} setSelectedAge={setSelectedAge} selectedAge={selectedAge} />
      );
      break;
    case ChartsCategory.CashFlow:
      chartsComponents = (
        <CashFlowCharts simStats={simStats} analysis={analysis} setSelectedAge={setSelectedAge} selectedAge={selectedAge} />
      );
      break;
    case ChartsCategory.Phases:
      chartsComponents = <PhasesCharts simStats={simStats} analysis={analysis} setSelectedAge={setSelectedAge} selectedAge={selectedAge} />;
      break;
    case ChartsCategory.Returns:
      chartsComponents = (
        <ReturnsCharts simStats={simStats} analysis={analysis} setSelectedAge={setSelectedAge} selectedAge={selectedAge} />
      );
      break;
    case ChartsCategory.Withdrawals:
      chartsComponents = (
        <WithdrawalsCharts simStats={simStats} analysis={analysis} setSelectedAge={setSelectedAge} selectedAge={selectedAge} />
      );
      break;
  }

  return (
    <SectionContainer showBottomBorder>
      <SectionHeader title="Data Visualization" desc="Interactive charts to explore your projection." />
      <ChartsCategorySelector currentCategory={currentCategory} setCurrentCategory={setCurrentCategory} />
      <div className="mb-4 grid grid-cols-1 gap-2 [@media(min-width:1920px)]:grid-cols-2">{chartsComponents}</div>
    </SectionContainer>
  );
}

// Memoize the entire section to prevent re-renders when props haven't changed
export default memo(StochasticChartsSection);
