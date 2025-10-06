export type AssetClass = 'stocks' | 'bonds' | 'cash';
export type TaxCategory = 'taxable' | 'taxDeferred' | 'taxFree';
export type AssetReturnRates = Record<AssetClass, number>;
export type AssetReturnAmounts = Record<AssetClass, number>;
export type AssetYieldRates = { dividendYield: number; bondYield: number };
export type AssetYieldAmounts = Record<TaxCategory, { dividendYield: number; bondYield: number }>;
export type AssetAllocation = Record<AssetClass, number>;
