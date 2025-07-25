/**
 * Portfolio Management - Investment Portfolio Operations
 *
 * This module provides a comprehensive portfolio management system for financial planning scenarios.
 * It implements immutable portfolio operations including market returns, withdrawals, cash additions,
 * and rebalancing while maintaining separation between principal and growth components.
 *
 * Architecture:
 * - Immutable portfolio operations returning new instances
 * - Asset-based composition with principal/growth tracking
 * - Priority-based withdrawal system (cash → bonds → stocks)
 * - Pro-rata allocation preservation during operations
 *
 * Key Features:
 * - Market return application with growth tracking
 * - Strategic withdrawal ordering for tax efficiency
 * - Cash injection for income/contributions
 * - Portfolio rebalancing with allocation targeting
 * - Asset allocation calculations and monitoring
 * - Error handling for edge cases (empty portfolios, negative values)
 */

import { Asset, AssetClass, AssetReturns, AssetAllocation } from './asset';

/**
 * Portfolio class for managing investment assets
 * Provides immutable operations for portfolio management and analysis
 */
export class Portfolio {
  constructor(public assets: Asset[]) {}

  /**
   * Creates a new portfolio instance with a copy of the provided assets
   * @param assets - Array of assets to include in the portfolio
   * @returns New portfolio instance
   */
  static create(assets: Asset[]): Portfolio {
    return new Portfolio([...assets]);
  }

  /**
   * Calculates the total value of assets in a specific asset class
   * @param assetClass - The asset class to calculate value for
   * @returns Total value (principal + growth) for the asset class
   */
  getAssetValue(assetClass: AssetClass): number {
    return this.assets.filter((asset) => asset.assetClass === assetClass).reduce((sum, asset) => sum + asset.principal + asset.growth, 0);
  }

  /**
   * Calculates the total portfolio value across all assets
   * @returns Total portfolio value (principal + growth)
   */
  getTotalValue(): number {
    return this.assets.reduce((sum, asset) => sum + asset.principal + asset.growth, 0);
  }

  /**
   * Calculates the current asset allocation percentages
   * @returns Asset allocation as decimal percentages (e.g., 0.7 = 70%)
   * @throws Error if portfolio is empty
   */
  getCurrentAllocation(): AssetAllocation {
    const total = this.getTotalValue();
    if (total === 0) throw new Error('Cannot calculate allocation for empty portfolio');

    return {
      stocks: this.getAssetValue('stocks') / total,
      bonds: this.getAssetValue('bonds') / total,
      cash: this.getAssetValue('cash') / total,
    };
  }

  /**
   * Applies market returns to the portfolio, increasing growth values
   * Returns are applied proportionally to each asset's current value
   * @param returns - Asset class return rates as decimals
   * @returns New portfolio instance with returns applied
   */
  withReturns(returns: AssetReturns): Portfolio {
    const updatedAssets = this.assets.map((asset) => {
      const returnRate = returns[asset.assetClass];
      const currentValue = asset.principal + asset.growth;
      const returnAmount = currentValue * returnRate;

      return {
        ...asset,
        growth: asset.growth + returnAmount, // Returns go to growth
      };
    });

    return new Portfolio(updatedAssets);
  }

  /**
   * Withdraws money from the portfolio using priority ordering
   * Withdrawal order: cash first, then bonds, then stocks
   * Withdrawals are taken pro-rata from principal and growth
   * @param amount - Amount to withdraw (must be positive)
   * @returns New portfolio instance with withdrawal applied
   * @throws Error if withdrawal amount is negative
   */
  withWithdrawal(amount: number): Portfolio {
    if (amount < 0) throw new Error('Withdrawal amount must be positive');
    if (amount === 0) return this;

    let remainingToWithdraw = amount;
    const updatedAssets = [...this.assets];

    // Withdrawal priority: cash first, then bonds, then stocks
    const withdrawalOrder: AssetClass[] = ['cash', 'bonds', 'stocks'];

    for (const assetClass of withdrawalOrder) {
      if (remainingToWithdraw <= 0) break;

      const assetIndex = updatedAssets.findIndex((a) => a.assetClass === assetClass);
      if (assetIndex === -1) continue;

      const asset = updatedAssets[assetIndex];
      const availableValue = asset.principal + asset.growth;

      if (availableValue > 0) {
        const withdrawFromThisAsset = Math.min(remainingToWithdraw, availableValue);

        // Withdraw pro-rata from principal and growth
        const principalRatio = asset.principal / availableValue;
        const growthRatio = asset.growth / availableValue;

        updatedAssets[assetIndex] = {
          ...asset,
          principal: asset.principal - withdrawFromThisAsset * principalRatio,
          growth: asset.growth - withdrawFromThisAsset * growthRatio,
        };

        remainingToWithdraw -= withdrawFromThisAsset;
      }
    }

    return new Portfolio(updatedAssets);
  }

  /**
   * Adds cash to the portfolio (typically for income or contributions)
   * Cash is added to the principal of the cash asset class
   * @param amount - Cash amount to add (must be positive)
   * @returns New portfolio instance with cash added
   * @throws Error if cash amount is negative
   */
  withCash(amount: number): Portfolio {
    if (amount < 0) throw new Error('Cash amount must be positive');
    if (amount === 0) return this; // No change if zero or negative

    const updatedAssets = this.assets.map((asset) =>
      asset.assetClass === 'cash' ? { ...asset, principal: asset.principal + amount } : asset
    );

    return new Portfolio(updatedAssets);
  }

  /**
   * Rebalances the portfolio to match target asset allocation
   * Preserves the overall ratio of principal to growth across the portfolio
   * @param targetAllocation - Target allocation percentages as decimals
   * @returns New portfolio instance with target allocation
   * @throws Error if portfolio has negative total value
   */
  withRebalance(targetAllocation: AssetAllocation): Portfolio {
    const totalValue = this.getTotalValue();
    if (totalValue < 0) throw new Error('Cannot rebalance empty portfolio');
    if (totalValue === 0) return this; // No change if empty portfolio

    const totalPrincipal = this.assets.reduce((sum, asset) => sum + asset.principal, 0);
    const totalGrowth = this.assets.reduce((sum, asset) => sum + asset.growth, 0);

    const updatedAssets = this.assets.map((asset) => {
      const targetValue = totalValue * targetAllocation[asset.assetClass];
      const principalRatio = totalPrincipal / totalValue;
      const growthRatio = totalGrowth / totalValue;

      return {
        ...asset,
        principal: targetValue * principalRatio,
        growth: targetValue * growthRatio,
      };
    });

    return new Portfolio(updatedAssets);
  }
}
