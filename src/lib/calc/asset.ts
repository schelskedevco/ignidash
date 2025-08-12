/**
 * Asset Management - Core Asset Type Definitions and Utilities
 *
 * This module provides the foundational asset class definitions and utilities for the financial
 * planning system. It defines the three core asset classes (stocks, bonds, cash) and provides
 * type-safe interfaces for asset allocation, returns, and monetary value tracking.
 *
 * Architecture:
 * - AssetClass union type for type-safe asset classification
 * - Asset interface with principal/growth separation for tax and reporting purposes
 * - AssetReturns and AssetAllocation types for consistent data handling
 * - Conversion utilities between user input formats and calculation formats
 *
 * Key Features:
 * - Real dollar value tracking (inflation-adjusted)
 * - Principal vs. growth component separation
 * - Type-safe asset class enumeration
 * - Allocation percentage conversion utilities
 * - Integration with form inputs and calculation engine
 */

import type { AllocationInputs } from '@/lib/schemas/quick-plan-schema';

/** Supported asset classes in the portfolio management system */
export type AssetClass = 'stocks' | 'bonds' | 'cash';

/** Asset return rates mapped by asset class (as decimal rates) */
export type AssetReturnRates = Record<AssetClass, number>;

/** Asset allocation percentages mapped by asset class (as decimal percentages) */
export type AssetAllocation = Record<AssetClass, number>;

/**
 * Asset interface representing a single investment holding
 * All monetary values are in real (inflation-adjusted) dollars relative to simulation start date
 */
export interface Asset {
  /** The asset class category for this holding */
  assetClass: AssetClass;
  /** The asset's current market value in real dollars */
  value: number;
}

/**
 * Converts AllocationInputs (from form) to AssetAllocation (for calculations)
 * Transforms percentage values and key names from form format to calculation format
 * @param allocationInputs - User allocation inputs from form (percentages as integers 0-100)
 * @returns Asset allocation with decimal percentages (0.0-1.0) for calculations
 */
export const convertAllocationInputsToAssetAllocation = (allocationInputs: AllocationInputs): AssetAllocation => {
  return {
    stocks: allocationInputs.stockAllocation / 100,
    bonds: allocationInputs.bondAllocation / 100,
    cash: allocationInputs.cashAllocation / 100,
  };
};
