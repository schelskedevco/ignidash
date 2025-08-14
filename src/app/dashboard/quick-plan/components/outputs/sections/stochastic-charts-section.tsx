'use client';

import { useState } from 'react';

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

interface StochasticChartsSectionProps {
  simStats: AggregateSimulationStats;
  analysis: StochasticAnalysis | null;
}

export default function StochasticChartsSection({ simStats, analysis }: StochasticChartsSectionProps) {
  const currentAge = useCurrentAge();
  const [selectedAge, setSelectedAge] = useState<number>(currentAge! + 1);

  const portfolioAreaChartData = useStochasticPortfolioAreaChartData(simStats);
  const portfolioPercentilesChartData = useStochasticPortfolioPercentilesChartData(simStats);
  const portfolioDistributionChartData = useStochasticPortfolioDistributionChartData(simStats);
  const cashFlowChartData = useStochasticCashFlowChartData(simStats);
  const phasePercentChartData = useStochasticPhasePercentAreaChartData(simStats);
  const returnsChartData = useStochasticReturnsChartData(simStats);
  const withdrawalsChartData = useStochasticWithdrawalsChartData(simStats);

  return (
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
          percentilesData={portfolioPercentilesChartData}
          distributionData={portfolioDistributionChartData}
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
        <StochasticWithdrawalsLineChartCard setSelectedAge={setSelectedAge} selectedAge={selectedAge} rawChartData={withdrawalsChartData} />
      </div>
    </SectionContainer>
  );
}
