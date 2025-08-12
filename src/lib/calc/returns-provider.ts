/**
 * Returns Provider - Asset Return Rate Calculation System
 *
 * This module provides a flexible system for calculating asset return rates used in financial
 * projections. It implements a provider pattern that allows for different return calculation
 * strategies while maintaining consistent interfaces for portfolio analysis.
 *
 * Architecture:
 * - ReturnsProvider interface for pluggable return calculation strategies
 * - Real return calculations using the Fisher equation for inflation adjustment
 * - Year-based return queries supporting time-dependent scenarios
 * - Separation of nominal market assumptions from real calculation results
 *
 * Key Features:
 * - Inflation-adjusted real return calculations
 * - Consistent return interface across asset classes (stocks, bonds, cash)
 * - Extensible provider pattern for future return models
 * - Integration with market assumptions from user inputs
 * - Fisher equation implementation for accurate real return conversion
 */

import { AssetReturnRates } from './asset';

/**
 * Represents asset returns data combined with relevant metadata.
 * This interface is used to encapsulate the returns along with any additional
 * information that may be needed for tracking or display purposes.
 */
export interface ReturnsWithMetadata<TExtras extends Record<string, unknown> = Record<string, unknown>> {
  returns: AssetReturnRates;
  metadata: {
    inflationRate: number;
    /** Optional extras that providers can add for simulation-specific data */
    extras?: TExtras;
  };
}

/**
 * Returns provider interface for asset return calculations
 * Defines the contract for all return calculation strategies
 */
export interface ReturnsProvider<TExtras extends Record<string, unknown> = Record<string, unknown>> {
  /**
   * Get the real returns for a specific year.
   * @param year The year for which to get the returns.
   * @returns The real asset returns for the specified year.
   */
  getReturns(year: number): ReturnsWithMetadata<TExtras>;
}
