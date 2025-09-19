export type AssetClass = 'stocks' | 'bonds' | 'cash';
export type AssetReturnRates = Record<AssetClass, number>;
export type AssetReturnAmounts = Record<AssetClass, number>;
export type AssetAllocation = Record<AssetClass, number>;
