export type AssetClass = 'stocks' | 'bonds' | 'cash';

export type AssetReturns = Record<AssetClass, number>;

/**
 * All monetary values in this interface are in real (inflation-adjusted) dollars
 * relative to the simulation start date.
 */
export interface Asset {
  principal: number; // Original contributions/cost basis (real dollars)
  growth: number; // Capital gains & losses, inflation-adjusted (real dollars)
  assetClass: AssetClass;
}
