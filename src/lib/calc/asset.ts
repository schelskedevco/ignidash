/**
 * Shared asset class types and utility functions for the simulation engine
 *
 * Defines the core type vocabulary for asset allocation, returns, yields, and flows
 * used throughout the portfolio and account calculations.
 */

export type AssetClass = 'stocks' | 'bonds' | 'cash';
export type TaxCategory = 'taxable' | 'taxDeferred' | 'taxFree' | 'cashSavings';

export type AssetReturnRates = Record<AssetClass, number>;
export type AssetReturnAmounts = Record<AssetClass, number>;

/** Sums return dollar amounts across all asset classes */
export const sumReturnAmounts = (r: AssetReturnAmounts): number => r.stocks + r.bonds + r.cash;

export type AssetYieldRates = Record<AssetClass, number>;
export type AssetYieldAmounts = Record<AssetClass, number>;

/** Sums yield dollar amounts across all asset classes */
export const sumYieldAmounts = (y: AssetYieldAmounts): number => y.stocks + y.bonds + y.cash;

export type AssetAllocation = Record<AssetClass, number>;
export type AssetValues = Record<AssetClass, number>;
export type AssetFlows = Record<AssetClass, number>;

/** Sums flows across all asset classes including cash */
export const sumFlows = (t: AssetFlows): number => t.stocks + t.bonds + t.cash;

/** Sums investment flows (stocks + bonds, excluding cash) */
export const sumInvestments = (t: AssetFlows): number => t.stocks + t.bonds;
/** Sums liquidation flows (stocks + bonds, excluding cash) */
export const sumLiquidations = (t: AssetFlows): number => t.stocks + t.bonds;
