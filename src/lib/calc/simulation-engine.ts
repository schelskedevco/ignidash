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
 *
 * Note: For failed simulations, the data array includes the depletion year but
 * returnsMetadata does not (since no returns are applied after depletion).
 * This means data.length may be 1 greater than returnsMetadata.length for failed simulations.
 */
export interface SimulationResult {
  success: boolean;
  bankruptcyAge: number | null;
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
    const assetAllocation = convertAllocationInputsToAssetAllocation(this.inputs.allocation);

    const data: Array<[number, Portfolio]> = [[0, portfolio]];
    const phasesMetadata: Array<[number, SimulationPhase]> = [[0, currentPhase]];
    const returnsMetadata: Array<[number, ReturnsWithMetadata]> = [];

    let success = true;
    let bankruptcyAge = null;

    for (let year = 1; year <= lifeExpectancy - startAge; year++) {
      // Process cash flows first (throughout the year)
      portfolio = currentPhase.processYear(year, portfolio, this.inputs);

      // Ensure portfolio is still valid after cash flows
      if (!(portfolio.getTotalValue() > 0.1)) {
        success = false;
        if (bankruptcyAge === null) {
          bankruptcyAge = startAge + year;
        }
      }

      // Rebalance portfolio to target allocation before applying returns
      portfolio = portfolio.withRebalance(assetAllocation);

      // Apply returns at end of year (compounding on final balance)
      const returns = returnsProvider.getReturns(year);
      portfolio = portfolio.withReturns(returns.returns);

      // Rebalance again after returns to maintain target allocation
      portfolio = portfolio.withRebalance(assetAllocation);

      data.push([year, portfolio]);
      returnsMetadata.push([year, returns]);

      // Check for phase transition
      const nextPhase = currentPhase.getNextPhase(this.inputs);
      if (nextPhase && nextPhase.canTransitionTo(portfolio, this.inputs)) {
        currentPhase = nextPhase;
      }

      // Record phase metadata for this year
      phasesMetadata.push([year, currentPhase]);
    }

    // Success if we never hit bankruptcy and reached final simulation phase
    const nextPhase = currentPhase.getNextPhase(this.inputs);
    success = success && nextPhase === null;

    return { success, bankruptcyAge, data, phasesMetadata, returnsMetadata };
  }

  /**
   * Initializes the starting portfolio based on user's current assets and allocation
   * @param inputs - User's financial planning inputs
   * @returns Portfolio with assets distributed according to target allocation
   */
  static createDefaultInitialPortfolio(inputs: QuickPlanInputs): Portfolio {
    const { stockAllocation, bondAllocation, cashAllocation } = inputs.allocation;
    const { investedAssets } = inputs.basics;

    return Portfolio.create(
      [
        {
          assetClass: 'stocks',
          value: investedAssets! * (stockAllocation / 100),
        },
        {
          assetClass: 'bonds',
          value: investedAssets! * (bondAllocation / 100),
        },
        {
          assetClass: 'cash',
          value: investedAssets! * (cashAllocation / 100),
        },
      ],
      investedAssets!,
      0
    );
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

    // Keep transitioning until we find a phase we can't transition to yet
    let nextPhase = phase.getNextPhase(inputs);
    while (nextPhase && nextPhase.canTransitionTo(portfolio, inputs)) {
      phase = nextPhase;
      nextPhase = phase.getNextPhase(inputs);
    }

    return phase;
  }
}

/**
 * Multi-Simulation Result Interface
 * Represents the results of multiple simulations, each with its own seed and corresponding result
 * Used for aggregating Monte Carlo or historical backtest simulations
 */
export interface MultiSimulationResult {
  simulations: Array<[number /* seed */, SimulationResult]>;
}

/**
 * Monte Carlo Simulation Engine
 * Extends the base simulation engine to run multiple stochastic simulations
 * Provides probabilistic analysis with simulation seeds and their corresponding results
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
   * Runs multiple simulations for Monte Carlo analysis
   * @param numSimulations - Number of simulations
   * @returns Aggregate results with simulation seeds and their corresponding results
   */
  runMonteCarloSimulation(numSimulations: number): MultiSimulationResult {
    const simulations: Array<[number, SimulationResult]> = [];

    const portfolio = FinancialSimulationEngine.createDefaultInitialPortfolio(this.inputs);
    const initialPhase = FinancialSimulationEngine.createDefaultInitialPhase(portfolio, this.inputs);

    for (let i = 0; i < numSimulations; i++) {
      const simulationSeed = this.baseSeed + i * 1009;
      const returnsProvider = new StochasticReturnsProvider(this.inputs, simulationSeed);
      const result = this.runSimulation(returnsProvider, portfolio, initialPhase);
      simulations.push([simulationSeed, result]);
    }

    return {
      simulations,
    };
  }
}

/**
 * LCG Historical Backtest Result Interface
 * Extends MultiSimulationResult to include historical range information
 * Each simulation includes the historical year ranges used for returns
 */
export interface LcgHistoricalBacktestResult extends MultiSimulationResult {
  simulations: Array<[number /* seed */, SimulationResult & { historicalRanges: Array<{ startYear: number; endYear: number }> }]>;
}

/**
 * LCG Historical Backtest Simulation Engine
 * Extends the base simulation engine to run historical backtests with randomly selected start years
 * Uses Linear Congruential Generator (LCG) to choose start years and supports configurable
 * number of simulations, similar to Monte Carlo simulation but with real historical data
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
   * Runs multiple historical backtest simulations with randomly selected start years
   * Uses LCG to choose different start years for each scenario, providing Monte Carlo-style
   * analysis with real historical data instead of synthetic returns
   * @param numSimulations - Number of simulations to simulate (each with a random start year)
   * @returns Aggregate results with simulation seeds, results, and historical ranges used
   */
  runLcgHistoricalBacktest(numSimulations: number): LcgHistoricalBacktestResult {
    const simulations: Array<[number, SimulationResult & { historicalRanges: Array<{ startYear: number; endYear: number }> }]> = [];

    const portfolio = FinancialSimulationEngine.createDefaultInitialPortfolio(this.inputs);
    const initialPhase = FinancialSimulationEngine.createDefaultInitialPhase(portfolio, this.inputs);

    for (let i = 0; i < numSimulations; i++) {
      const simulationSeed = this.baseSeed + i * 1009;
      const returnsProvider = new LcgHistoricalBacktestReturnsProvider(simulationSeed);
      const result = this.runSimulation(returnsProvider, portfolio, initialPhase);

      // Get historical ranges from the returns provider
      const historicalRanges = returnsProvider.getHistoricalRanges();

      simulations.push([simulationSeed, { ...result, historicalRanges }]);
    }

    return {
      simulations,
    };
  }
}
