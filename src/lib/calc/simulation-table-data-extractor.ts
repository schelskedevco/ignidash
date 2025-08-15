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

import {
  type StochasticTableRow,
  validateStochasticTableData,
  type SimulationTableRow,
  validateSimulationTableData,
  type YearlyAggregateTableRow,
  validateYearlyAggregateTableData,
} from '@/lib/schemas/simulation-table-schema';

import { SimulationAnalyzer, type AggregateSimulationStats } from './simulation-analyzer';
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

  /**
   * Extracts table data from a single SimulationResult
   * Used for detailed year-by-year view of a specific simulation
   *
   * @param simulation - The single simulation result to process
   * @param currentAge - The user's current age for calculating ages
   * @returns Array of table rows with year-by-year details
   */
  extractSingleSimulationTableData(simulation: SimulationResult | null, currentAge: number): SimulationTableRow[] {
    if (!simulation) return [];

    // Create a map for efficient phase lookup
    const phaseMap = new Map<number, string>();
    for (const [year, phase] of simulation.phasesMetadata) {
      phaseMap.set(year, phase.getName());
    }

    // Map through simulation data to create table rows
    const rawData = simulation.data.map(([year, portfolio], index) => {
      // Get phase name for this year
      const phaseName = phaseMap.get(year) || '';

      // Get returns from previous year (returns are applied at end of year)
      // For year 0, there are no returns yet
      const returns = index > 0 && simulation.returnsMetadata[index - 1] ? simulation.returnsMetadata[index - 1][1] : null;

      const stocksReturn = returns?.returns.stocks;
      const bondsReturn = returns?.returns.bonds;
      const cashReturn = returns?.returns.cash;
      const inflationRate = returns?.metadata.inflationRate;

      return {
        year,
        age: currentAge + year,
        phaseName,
        portfolioValue: portfolio.getTotalValue(),
        stocksValue: portfolio.getAssetValue('stocks'),
        stocksReturn: stocksReturn ? stocksReturn * 100 : null, // Convert to percentage
        bondsValue: portfolio.getAssetValue('bonds'),
        bondsReturn: bondsReturn ? bondsReturn * 100 : null, // Convert to percentage
        cashValue: portfolio.getAssetValue('cash'),
        cashReturn: cashReturn ? cashReturn * 100 : null, // Convert to percentage
        inflationRate: inflationRate ?? null, // Already in percentage form
      };
    });

    // Validate data against schema
    return validateSimulationTableData(rawData);
  }

  /**
   * Extracts yearly aggregate table data from AggregateSimulationStats
   * Shows year-by-year statistics across all simulations
   *
   * @param analysis - The aggregate statistics from simulation analysis
   * @param currentAge - The user's current age for calculating ages
   * @returns Array of table rows with yearly aggregate statistics
   */
  extractYearlyResultsTableData(analysis: AggregateSimulationStats, currentAge: number): YearlyAggregateTableRow[] {
    // Transform yearly progression data to match YearlyAggregateTableRow schema
    const rawData = analysis.yearlyProgression.map((yearData) => ({
      year: yearData.year,
      age: currentAge + yearData.year,
      percentAccumulation: yearData.phasePercentages.accumulation,
      percentRetirement: yearData.phasePercentages.retirement,
      percentBankrupt: yearData.phasePercentages.bankrupt,
      p10Portfolio: yearData.percentiles.p10,
      p25Portfolio: yearData.percentiles.p25,
      p50Portfolio: yearData.percentiles.p50,
      p75Portfolio: yearData.percentiles.p75,
      p90Portfolio: yearData.percentiles.p90,
      minPortfolio: yearData.values.overall?.min ?? null,
      maxPortfolio: yearData.values.overall?.max ?? null,
    }));

    // Validate data against schema
    return validateYearlyAggregateTableData(rawData);
  }
}
