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

import { Asset, AssetClass, AssetReturnRates, AssetAllocation } from './asset';

/**
 * Portfolio class for managing investment assets
 * Provides immutable operations for portfolio management and analysis
 */
export class Portfolio {
  constructor(
    public assets: Asset[],
    public contributions: number,
    public withdrawals: number
  ) {}

  /**
   * Creates a new portfolio instance with a copy of the provided assets
   * @param assets - Array of assets to include in the portfolio
   * @returns New portfolio instance
   */
  static create(assets: Asset[], contributions: number, withdrawals: number): Portfolio {
    return new Portfolio([...assets], contributions, withdrawals);
  }

  /**
   * Calculates the total value of assets in a specific asset class
   * @param assetClass - The asset class to calculate value for
   * @returns Total market value for the asset class
   */
  getAssetValue(assetClass: AssetClass): number {
    return this.assets.filter((asset) => asset.assetClass === assetClass).reduce((sum, asset) => sum + asset.value, 0);
  }

  /**
   * Calculates the total portfolio value across all assets
   * @returns Total portfolio market value
   */
  getTotalValue(): number {
    return this.assets.reduce((sum, asset) => sum + asset.value, 0);
  }

  /**
   * Calculates the current asset allocation percentages
   * @returns Asset allocation as decimal percentages (e.g., 0.7 = 70%)
   * @throws Error if portfolio is empty
   */
  getCurrentAllocation(): AssetAllocation {
    const total = this.getTotalValue();
    if (total <= 0) throw new Error('Cannot calculate allocation for empty portfolio');

    return {
      stocks: this.getAssetValue('stocks') / total,
      bonds: this.getAssetValue('bonds') / total,
      cash: this.getAssetValue('cash') / total,
    };
  }

  /**
   * Applies market returns to the portfolio, increasing asset values
   * Returns are applied proportionally to each asset's current value
   * @param returns - Asset class return rates as decimals
   * @returns Array containing new portfolio instance and total returns amount
   */
  withReturns(returns: AssetReturnRates): [Portfolio, number] {
    let totalReturnsAmount = 0;

    const updatedAssets = this.assets.map((asset) => {
      const returnRate = returns[asset.assetClass];
      const returnAmount = asset.value * returnRate;

      totalReturnsAmount += returnAmount;

      return {
        ...asset,
        value: asset.value + returnAmount,
      };
    });

    return [Portfolio.create(updatedAssets, this.contributions, this.withdrawals), totalReturnsAmount];
  }

  /**
   * Withdraws money from the portfolio using priority ordering
   * Withdrawal order: cash first, then bonds, then stocks
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
      if (assetIndex === -1) throw new Error(`Asset class ${assetClass} not found in portfolio`);

      const asset = updatedAssets[assetIndex];

      if (asset.value > 0) {
        const withdrawFromThisAsset = Math.min(remainingToWithdraw, asset.value);

        updatedAssets[assetIndex] = {
          ...asset,
          value: asset.value - withdrawFromThisAsset,
        };

        remainingToWithdraw -= withdrawFromThisAsset;
      }
    }

    return Portfolio.create(updatedAssets, this.contributions, this.withdrawals + amount);
  }

  /**
   * Adds cash to the portfolio (typically for income or contributions)
   * @param amount - Cash amount to add (must be positive)
   * @returns New portfolio instance with cash added
   * @throws Error if cash amount is negative
   */
  withCash(amount: number): Portfolio {
    if (amount < 0) throw new Error('Cash amount must be positive');
    if (amount === 0) return this; // No change if zero or negative

    const updatedAssets = this.assets.map((asset) => (asset.assetClass === 'cash' ? { ...asset, value: asset.value + amount } : asset));

    return Portfolio.create(updatedAssets, this.contributions + amount, this.withdrawals);
  }

  /**
   * Rebalances the portfolio to match target asset allocation
   * Preserves total contributions and withdrawals for accurate performance tracking
   * @param targetAllocation - Target allocation percentages as decimals
   * @returns New portfolio instance with target allocation
   * @throws Error if portfolio has negative total value
   */
  withRebalance(targetAllocation: AssetAllocation): Portfolio {
    const totalValue = this.getTotalValue();
    if (totalValue <= 0) return this; // No change if empty portfolio

    const updatedAssets = this.assets.map((asset) => {
      const targetValue = totalValue * targetAllocation[asset.assetClass];

      return { ...asset, value: targetValue };
    });

    return Portfolio.create(updatedAssets, this.contributions, this.withdrawals);
  }

  /**
   * Calculates the portfolio's total return performance
   * Performance = (value + withdrawals - contributions) / contributions
   * @returns Total return as a decimal (e.g., 0.1 = 10% return), or null if no contributions
   */
  getPerformance(): number | null {
    if (this.contributions === 0) return null;

    return (this.getTotalValue() + this.withdrawals - this.contributions) / this.contributions;
  }

  /**
   * Calculates the portfolio's annualized return given the number of years
   * @param years - Number of years the portfolio has been held
   * @returns Annualized return as a decimal, or null if cannot be calculated
   */
  getAnnualizedReturn(years: number): number | null {
    if (years <= 0) return null;

    const totalReturn = this.getPerformance();
    if (totalReturn === null) return null;

    return Math.pow(1 + totalReturn, 1 / years) - 1;
  }
}
