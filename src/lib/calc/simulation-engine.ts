import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

import { Portfolio } from './portfolio';
import { ReturnsProvider, FixedReturnProvider } from './returns-provider';
import { SimulationPhase, AccumulationPhase } from './simulation-phase';

interface SimulationResult {
  success: boolean;
  data: Array<[number /* timeInYears */, Portfolio]>;
}

interface SimulationEngine {
  runSimulation(): SimulationResult;
}

export class FixedReturnsSimulationEngine implements SimulationEngine {
  constructor(private inputs: QuickPlanInputs) {}

  runSimulation(): SimulationResult {
    const returnProvider = this.createReturnProvider();

    let portfolio = this.initializePortfolio();
    let currentPhase = this.determineInitialPhase(portfolio);

    const startAge = this.inputs.basics.currentAge!;
    const lifeExpectancy = this.inputs.retirementFunding.lifeExpectancy;

    const data: Array<[number, Portfolio]> = [[0, portfolio]];

    for (let year = 1; year <= lifeExpectancy - startAge; year++) {
      // Process cash flows first (throughout the year)
      portfolio = currentPhase.processYear(year, portfolio, this.inputs);

      // Apply returns at end of year (compounding on final balance)
      const returns = returnProvider.getReturns(year);
      portfolio = portfolio.applyReturns(returns);

      data.push([year, portfolio]);

      // Check if portfolio is depleted first
      if (portfolio.getTotalValue() <= 0) break;

      // Check for phase transition
      if (currentPhase.shouldTransition(year, portfolio, this.inputs)) {
        const nextPhase = currentPhase.getNextPhase(this.inputs);
        if (!nextPhase) break; // Simulation complete
        currentPhase = nextPhase;
      }
    }

    return {
      success: portfolio.getTotalValue() > 0,
      data,
    };
  }

  private createReturnProvider(): ReturnsProvider {
    return new FixedReturnProvider(this.inputs);
  }

  private initializePortfolio(): Portfolio {
    const { stockAllocation, bondAllocation, cashAllocation } = this.inputs.allocation;
    const { investedAssets } = this.inputs.basics;

    return Portfolio.create([
      {
        assetClass: 'stocks',
        principal: investedAssets! * (stockAllocation / 100),
        growth: 0,
      },
      {
        assetClass: 'bonds',
        principal: investedAssets! * (bondAllocation / 100),
        growth: 0,
      },
      {
        assetClass: 'cash',
        principal: investedAssets! * (cashAllocation / 100),
        growth: 0,
      },
    ]);
  }

  private determineInitialPhase(portfolio: Portfolio): SimulationPhase {
    let phase: SimulationPhase = new AccumulationPhase();

    // Keep transitioning until we find a phase we can't transition out of yet
    while (phase.shouldTransition(0, portfolio, this.inputs)) {
      const nextPhase = phase.getNextPhase(this.inputs);
      if (!nextPhase) break;
      phase = nextPhase;
    }

    return phase;
  }
}

interface MonteCarloResult {
  scenarios: SimulationResult[];
  aggregateStats: {
    successRate: number;
    percentiles: {
      p10: number;
      p25: number;
      p50: number;
      p75: number;
      p90: number;
    };
    // Other aggregate statistics
  };
}

export class MonteCarloSimulationEngine implements SimulationEngine {
  constructor(private inputs: QuickPlanInputs) {}

  runSimulation(): SimulationResult {
    return {
      success: true,
      data: [],
    };
  }

  runMonteCarloSimulation(numScenarios: number): MonteCarloResult {
    const scenarios: SimulationResult[] = [];
    for (let i = 0; i < numScenarios; i++) {
      scenarios.push(this.runSimulation());
    }

    // Aggregate statistics calculation would go here
    const aggregateStats = {
      successRate: scenarios.filter((s) => s.success).length / numScenarios,
      percentiles: {
        p10: 0, // Placeholder
        p25: 0, // Placeholder
        p50: 0, // Placeholder
        p75: 0, // Placeholder
        p90: 0, // Placeholder
      },
    };

    return { scenarios, aggregateStats };
  }
}
