/**
 * Simulation Table Data Extractor - Efficient Table Data Extraction for Simulations
 *
 * This module provides specialized extraction of table data from simulation results
 * without requiring the full MultiSimulationResult object to be passed to the main thread.
 * It processes simulation results directly in web workers and returns lightweight
 * table-ready data structures.
 *
 * Architecture:
 * - Processes MultiSimulationResult into StochasticTableRow[] (0.15MB vs 17MB)
 * - Runs in web workers for better performance
 * - Reuses simulation seeds for reproducibility
 * - Supports both Monte Carlo and Historical Backtest simulations
 *
 * Key Features:
 * - Extracts summary data for each simulation run (seed, success, FIRE age, etc.)
 * - Calculates average returns across simulation lifetime
 * - Handles historical range data for backtest simulations
 * - Validates output against schemas for type safety
 */

import { type StochasticTableRow, validateStochasticTableData } from '@/lib/schemas/simulation-table-schema';

import { SimulationAnalyzer } from './simulation-analyzer';
import type { SimulationResult, MultiSimulationResult, HistoricalRangeInfo } from './simulation-engine';

/**
 * SimulationTableDataExtractor - Efficient extraction of table data from simulations
 *
 * Provides lightweight extraction of table-ready data from simulation results,
 * designed to run in web workers and minimize data transfer to the main thread.
 */
export class SimulationTableDataExtractor {
  private analyzer: SimulationAnalyzer;

  constructor() {
    this.analyzer = new SimulationAnalyzer();
  }

  /**
   * Extracts table data from a MultiSimulationResult
   * Processes each simulation to extract key metrics for table display
   *
   * @param simulation - The multi-simulation result to process
   * @param currentAge - The user's current age for calculating FIRE age
   * @returns Array of table rows with extracted metrics
   */
  extractStochasticTableData(simulation: MultiSimulationResult, currentAge: number): StochasticTableRow[] {
    // Map through each simulation result to create table rows
    const rawData = simulation.simulations.map(([seed, simulationResult]) => {
      // Calculate FIRE age - find when retirement phase starts
      let fireAge: number | null = null;
      for (const [year, phase] of simulationResult.phasesMetadata) {
        if (phase.getName() === 'Retirement') {
          fireAge = currentAge + year;
          break;
        }
      }

      // Get final phase name - last entry in phasesMetadata
      const finalPhaseEntry = simulationResult.phasesMetadata[simulationResult.phasesMetadata.length - 1];
      const finalPhaseName = finalPhaseEntry ? finalPhaseEntry[1].getName() : '';

      // Get final portfolio value - last entry in data array
      const finalPortfolioEntry = simulationResult.data[simulationResult.data.length - 1];
      const finalPortfolioValue = finalPortfolioEntry ? finalPortfolioEntry[1].getTotalValue() : 0;

      // Use SimulationAnalyzer to get average returns
      const analysis = this.analyzer.analyzeSimulation(simulationResult);

      let averageStocksReturn: number | null = null;
      let averageBondsReturn: number | null = null;
      let averageCashReturn: number | null = null;
      let averageInflationRate: number | null = null;

      if (analysis) {
        // Get mean returns from analyzer (convert from decimal to percentage)
        averageStocksReturn = analysis.returns.rates.stocks?.mean ? analysis.returns.rates.stocks.mean * 100 : null;
        averageBondsReturn = analysis.returns.rates.bonds?.mean ? analysis.returns.rates.bonds.mean * 100 : null;
        averageCashReturn = analysis.returns.rates.cash?.mean ? analysis.returns.rates.cash.mean * 100 : null;
        averageInflationRate = analysis.returns.inflation?.mean ? analysis.returns.inflation.mean : null;
      }

      // Get historical ranges (if present for historical backtest)
      const historicalRanges = (simulationResult as SimulationResult & HistoricalRangeInfo)?.historicalRanges ?? null;

      return {
        seed,
        success: simulationResult.success,
        fireAge,
        bankruptcyAge: simulationResult.bankruptcyAge,
        finalPhaseName,
        finalPortfolioValue,
        averageStocksReturn,
        averageBondsReturn,
        averageCashReturn,
        averageInflationRate,
        historicalRanges,
      };
    });

    // Validate data against schema
    return validateStochasticTableData(rawData);
  }
}
