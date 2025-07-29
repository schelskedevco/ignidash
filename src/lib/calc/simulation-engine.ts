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
import { ReturnsProvider, ReturnsWithMetadata } from './returns-provider';
import { StochasticReturnsProvider } from './stochastic-returns-provider';
import { LcgHistoricalBacktestReturnsProvider } from './lcg-historical-backtest-returns-provider';
import { SimulationPhase, AccumulationPhase } from './simulation-phase';
import { convertAllocationInputsToAssetAllocation } from './asset';

/**
 * Simulation result containing success status, portfolio progression, and metadata
 * Tracks year-by-year portfolio values, phase transitions, and market returns applied
 */
interface SimulationResult {
  success: boolean;
  data: Array<[number /* timeInYears */, Portfolio]>;
  phasesMetadata: Array<[number /* timeInYears */, SimulationPhase]>;
  returnsMetadata: Array<[number /* timeInYears */, ReturnsWithMetadata]>;
}

/**
 * Financial Simulation Engine
 * Core simulation engine that models portfolio performance across life phases
 * Works with any returns provider (fixed or stochastic) for flexible simulation strategies
 */
export class FinancialSimulationEngine {
  /**
   * Creates a financial simulation engine
   * @param inputs - User's financial planning inputs and assumptions
   */
  constructor(protected inputs: QuickPlanInputs) {}

  /**
   * Runs a complete financial simulation from current age to life expectancy
   * Processes annual cash flows, rebalancing, and returns across all life phases
   * @param returnsProvider - Provider for market returns (fixed or stochastic)
   * @param initialPortfolio - Starting portfolio state
   * @param initialPhase - Starting simulation phase
   * @returns Simulation result with success status and portfolio progression
   */
  runSimulation(returnsProvider: ReturnsProvider, initialPortfolio: Portfolio, initialPhase: SimulationPhase): SimulationResult {
    let portfolio = initialPortfolio;
    let currentPhase = initialPhase;

    const startAge = this.inputs.basics.currentAge!;
    const lifeExpectancy = this.inputs.retirementFunding.lifeExpectancy;

    const data: Array<[number, Portfolio]> = [[0, portfolio]];
    const phasesMetadata: Array<[number, SimulationPhase]> = [[0, currentPhase]];
    const returnsMetadata: Array<[number, ReturnsWithMetadata]> = [];

    for (let year = 1; year <= lifeExpectancy - startAge; year++) {
      // Process cash flows first (throughout the year)
      portfolio = currentPhase.processYear(year, portfolio, this.inputs);

      // Rebalance portfolio to target allocation
      portfolio = portfolio.withRebalance(convertAllocationInputsToAssetAllocation(this.inputs.allocation));

      // Apply returns at end of year (compounding on final balance)
      const returns = returnsProvider.getReturns(year);
      portfolio = portfolio.withReturns(returns.returns);

      data.push([year, portfolio]);
      returnsMetadata.push([year, returns]);

      // Check if portfolio is depleted first
      if (portfolio.getTotalValue() <= 0) break;

      // Check for phase transition
      if (currentPhase.shouldTransition(portfolio, this.inputs)) {
        const nextPhase = currentPhase.getNextPhase(this.inputs);
        if (!nextPhase) break; // Simulation complete
        currentPhase = nextPhase;
        phasesMetadata.push([year, currentPhase]);
      }
    }

    return {
      success: portfolio.getTotalValue() > 0,
      data,
      phasesMetadata,
      returnsMetadata,
    };
  }

  /**
   * Initializes the starting portfolio based on user's current assets and allocation
   * @param inputs - User's financial planning inputs
   * @returns Portfolio with assets distributed according to target allocation
   */
  static createDefaultInitialPortfolio(inputs: QuickPlanInputs): Portfolio {
    const { stockAllocation, bondAllocation, cashAllocation } = inputs.allocation;
    const { investedAssets } = inputs.basics;

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
   * @param inputs - User's financial planning inputs
   * @returns Appropriate simulation phase for the starting conditions
   */
  static createDefaultInitialPhase(portfolio: Portfolio, inputs: QuickPlanInputs): SimulationPhase {
    let phase: SimulationPhase = new AccumulationPhase();

    // Keep transitioning until we find a phase we can't transition out of yet
    while (phase.shouldTransition(portfolio, inputs)) {
      const nextPhase = phase.getNextPhase(inputs);
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
  scenarios: Array<[number /* seed */, SimulationResult]>;
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
 * Monte Carlo Simulation Engine
 * Extends the base simulation engine to run multiple stochastic scenarios
 * Provides probabilistic analysis with success rates and percentile outcomes
 */
export class MonteCarloSimulationEngine extends FinancialSimulationEngine {
  /**
   * Creates a Monte Carlo simulation engine
   * @param inputs - User's financial planning inputs and assumptions
   * @param baseSeed - Base seed for random number generation
   */
  constructor(
    inputs: QuickPlanInputs,
    private baseSeed: number
  ) {
    super(inputs);
  }

  /**
   * Runs multiple simulation scenarios for Monte Carlo analysis
   * @param numScenarios - Number of scenarios to simulate
   * @returns Aggregate results with success rates and percentiles
   */
  runMonteCarloSimulation(numScenarios: number): MonteCarloResult {
    const scenarios: Array<[number, SimulationResult]> = [];

    const portfolio = FinancialSimulationEngine.createDefaultInitialPortfolio(this.inputs);
    const initialPhase = FinancialSimulationEngine.createDefaultInitialPhase(portfolio, this.inputs);

    // Run multiple scenarios, creating a new provider for each
    for (let i = 0; i < numScenarios; i++) {
      const scenarioSeed = this.baseSeed + i * 1009;
      const returnsProvider = new StochasticReturnsProvider(this.inputs, scenarioSeed);
      const result = this.runSimulation(returnsProvider, portfolio, initialPhase);
      scenarios.push([scenarioSeed, result]);
    }

    // Calculate aggregate statistics
    const successCount = scenarios.filter(([_seed, result]) => result.success).length;
    const successRate = successCount / numScenarios;

    // Extract final portfolio values for percentile calculations
    const finalValues = scenarios
      .map(([_seed, result]) => {
        const dataPointsCount = result.data.length;
        if (dataPointsCount === 0) throw new Error('No data points in simulation result');

        return result.data[dataPointsCount - 1][1].getTotalValue();
      })
      .sort((a, b) => a - b);

    // Calculate percentiles
    const getPercentile = (arr: number[], percentile: number) => {
      const index = Math.floor((percentile / 100) * arr.length);
      return arr[Math.min(index, arr.length - 1)]; // Ensure we don't exceed array bounds
    };

    return {
      scenarios,
      aggregateStats: {
        successRate,
        percentiles: {
          p10: getPercentile(finalValues, 10),
          p25: getPercentile(finalValues, 25),
          p50: getPercentile(finalValues, 50),
          p75: getPercentile(finalValues, 75),
          p90: getPercentile(finalValues, 90),
        },
      },
    };
  }
}

/**
 * LCG historical backtest simulation result with scenarios for each randomly selected start year
 */
interface LcgHistoricalBacktestResult {
  scenarios: Array<[number /* startYear */, SimulationResult]>;
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
 * LCG Historical Backtest Simulation Engine
 * Extends the base simulation engine to run historical backtests with randomly selected start years
 * Uses Linear Congruential Generator (LCG) to choose start years and supports configurable
 * number of scenarios, similar to Monte Carlo simulation but with real historical data
 */
export class LcgHistoricalBacktestSimulationEngine extends FinancialSimulationEngine {
  /**
   * Creates an LCG historical backtest simulation engine
   * @param inputs - User's financial planning inputs and assumptions
   * @param baseSeed - Base seed for random number generation
   */
  constructor(
    inputs: QuickPlanInputs,
    private baseSeed: number
  ) {
    super(inputs);
  }

  /**
   * Runs multiple historical backtest scenarios with randomly selected start years
   * Uses LCG to choose different start years for each scenario, providing Monte Carlo-style
   * analysis with real historical data instead of synthetic returns
   * @param numScenarios - Number of scenarios to simulate (each with a random start year)
   * @returns Aggregate results with success rates and percentiles based on historical outcomes
   */
  runLcgHistoricalBacktest(numScenarios: number): LcgHistoricalBacktestResult {
    const scenarios: Array<[number, SimulationResult]> = [];

    // Create one returns provider and reset it for each scenario
    const returnsProvider = new LcgHistoricalBacktestReturnsProvider(this.baseSeed);
    const portfolio = FinancialSimulationEngine.createDefaultInitialPortfolio(this.inputs);
    const initialPhase = FinancialSimulationEngine.createDefaultInitialPhase(portfolio, this.inputs);

    // Run multiple scenarios using resetForNewScenario to get different start years
    for (let i = 0; i < numScenarios; i++) {
      const selectedStartYear = returnsProvider.resetForNewScenario(i);
      const result = this.runSimulation(returnsProvider, portfolio, initialPhase);
      scenarios.push([selectedStartYear, result]);
    }

    // Calculate aggregate statistics
    const successCount = scenarios.filter(([_startYear, result]) => result.success).length;
    const successRate = successCount / numScenarios;

    // Extract final portfolio values for percentile calculations
    const finalValues = scenarios
      .map(([_startYear, result]) => {
        const dataPointsCount = result.data.length;
        if (dataPointsCount === 0) throw new Error('No data points in simulation result');

        return result.data[dataPointsCount - 1][1].getTotalValue();
      })
      .sort((a, b) => a - b);

    // Calculate percentiles
    const getPercentile = (arr: number[], percentile: number) => {
      const index = Math.floor((percentile / 100) * arr.length);
      return arr[Math.min(index, arr.length - 1)]; // Ensure we don't exceed array bounds
    };

    return {
      scenarios,
      aggregateStats: {
        successRate,
        percentiles: {
          p10: getPercentile(finalValues, 10),
          p25: getPercentile(finalValues, 25),
          p50: getPercentile(finalValues, 50),
          p75: getPercentile(finalValues, 75),
          p90: getPercentile(finalValues, 90),
        },
      },
    };
  }
}
