/**
 * Simulation Engine - Financial Planning Projection System
 *
 * This module provides comprehensive financial simulation engines that model long-term portfolio
 * performance across different life phases. It implements deterministic and stochastic simulation
 * approaches to project portfolio growth, cash flows, and sustainability over time.
 *
 * Architecture:
 * - SimulationEngine interface for pluggable simulation strategies
 * - Year-by-year simulation with cash flows, rebalancing, and returns
 * - Phase-aware simulation with automatic transitions between life stages
 * - Monte Carlo capabilities for probabilistic analysis
 *
 * Key Features:
 * - Multi-phase financial modeling (accumulation → retirement)
 * - Annual cash flow processing with portfolio integration
 * - Automatic portfolio rebalancing to target allocations
 * - Market return application with compounding effects
 * - Portfolio depletion detection and success metrics
 * - Monte Carlo simulation framework for risk analysis
 * - Comprehensive result tracking with time-series data
 */

import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

import { Portfolio } from './portfolio';
import { ReturnsProvider, FixedReturnProvider } from './returns-provider';
import { SimulationPhase, AccumulationPhase } from './simulation-phase';
import { convertAllocationInputsToAssetAllocation } from './asset';

/**
 * Simulation result containing success status and time-series portfolio data
 */
interface SimulationResult {
  success: boolean;
  data: Array<[number /* timeInYears */, Portfolio]>;
}

/**
 * Simulation engine interface for financial projection strategies
 */
interface SimulationEngine {
  /**
   * Executes the financial simulation
   * @returns Simulation result with success status and portfolio time series
   */
  runSimulation(): SimulationResult;
}

/**
 * Fixed Returns Simulation Engine
 * Deterministic simulation using consistent market returns throughout the projection
 * Models portfolio performance with fixed asset class returns and phase transitions
 */
export class FixedReturnsSimulationEngine implements SimulationEngine {
  /**
   * Creates a fixed returns simulation engine
   * @param inputs - User's financial planning inputs and assumptions
   */
  constructor(private inputs: QuickPlanInputs) {}

  /**
   * Runs a complete financial simulation from current age to life expectancy
   * Processes annual cash flows, rebalancing, and returns across all life phases
   * @returns Simulation result with success status and portfolio progression
   */
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

      // Rebalance portfolio to target allocation
      portfolio = portfolio.withRebalance(convertAllocationInputsToAssetAllocation(this.inputs.allocation));

      // Apply returns at end of year (compounding on final balance)
      const returns = returnProvider.getReturns(year);
      portfolio = portfolio.withReturns(returns);

      data.push([year, portfolio]);

      // Check if portfolio is depleted first
      if (portfolio.getTotalValue() <= 0) break;

      // Check for phase transition
      if (currentPhase.shouldTransition(portfolio, this.inputs)) {
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

  /**
   * Creates the return provider for market return calculations
   * @returns Fixed return provider using user's market assumptions
   */
  private createReturnProvider(): ReturnsProvider {
    return new FixedReturnProvider(this.inputs);
  }

  /**
   * Initializes the starting portfolio based on user's current assets and allocation
   * @returns Portfolio with assets distributed according to target allocation
   */
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

  /**
   * Determines the appropriate starting phase based on current portfolio status
   * Automatically transitions through phases until reaching an applicable one
   * @param portfolio - Current portfolio state
   * @returns Appropriate simulation phase for the starting conditions
   */
  private determineInitialPhase(portfolio: Portfolio): SimulationPhase {
    let phase: SimulationPhase = new AccumulationPhase();

    // Keep transitioning until we find a phase we can't transition out of yet
    while (phase.shouldTransition(portfolio, this.inputs)) {
      const nextPhase = phase.getNextPhase(this.inputs);
      if (!nextPhase) break;
      phase = nextPhase;
    }

    return phase;
  }
}

/**
 * Monte Carlo simulation result with multiple scenarios and aggregate statistics
 */
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

/**
 * Monte Carlo Simulation Engine (Placeholder Implementation)
 * Stochastic simulation using variable market returns for risk analysis
 * Currently a placeholder for future probabilistic modeling capabilities
 */
export class MonteCarloSimulationEngine implements SimulationEngine {
  /**
   * Creates a Monte Carlo simulation engine
   * @param inputs - User's financial planning inputs and assumptions
   */
  constructor(private inputs: QuickPlanInputs) {}

  /**
   * Placeholder simulation method (not yet implemented)
   * @returns Empty simulation result
   */
  runSimulation(): SimulationResult {
    return {
      success: true,
      data: [],
    };
  }

  /**
   * Runs multiple simulation scenarios for Monte Carlo analysis (placeholder)
   * @param numScenarios - Number of scenarios to simulate
   * @returns Aggregate results with success rates and percentiles
   */
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
