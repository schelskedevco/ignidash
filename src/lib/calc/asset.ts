export type AssetClass = 'stocks' | 'bonds' | 'cash';
export type TaxCategory = 'taxable' | 'taxDeferred' | 'taxFree' | 'cashSavings';

export type AssetReturnRates = Record<AssetClass, number>;
export type AssetReturnAmounts = Record<AssetClass, number>;

export type AssetYieldRates = Record<AssetClass, number>;
export type AssetYieldAmounts = Record<AssetClass, number>;

export type AssetAllocation = Record<AssetClass, number>;
export type AssetValues = Record<AssetClass, number>;
export type AssetTransactions = Record<AssetClass, number>;

export const sumTransactions = (t: AssetTransactions): number => t.stocks + t.bonds + t.cash;

export const sumInvestments = (t: AssetTransactions): number => t.stocks + t.bonds;
export const sumLiquidations = (t: AssetTransactions): number => t.stocks + t.bonds;
