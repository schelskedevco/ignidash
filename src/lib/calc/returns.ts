/**
 * Returns processing for the simulation engine
 *
 * Converts annual return rates from the returns provider to monthly rates,
 * applies them to portfolio accounts, and tracks cumulative return/yield data.
 */

import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';

import type { SimulationState } from './simulation-engine';
import { ReturnsProvider } from './returns-providers/returns-provider';
import type { AssetReturnRates, AssetReturnAmounts, AssetYieldAmounts, AssetYieldRates, TaxCategory } from './asset';

/** Per-account return amounts for data extraction */
export interface AccountDataWithReturns {
  name: string;
  id: string;
  type: AccountInputs['type'];
  returnAmounts: AssetReturnAmounts;
  cumulativeReturnAmounts: AssetReturnAmounts;
}

export interface ReturnsData {
  cumulativeReturnAmounts: AssetReturnAmounts;
  cumulativeYieldAmounts: Record<TaxCategory, AssetYieldAmounts>;
  returnAmounts: AssetReturnAmounts;
  returnRates: AssetReturnRates;
  yieldAmounts: Record<TaxCategory, AssetYieldAmounts>;
  yieldRates: AssetYieldRates;
  inflationRate: number;
  annualReturnRates: AssetReturnRates;
  annualYieldRates: AssetYieldRates;
  annualInflationRate: number;
  perAccountData: Record<string, AccountDataWithReturns>;
}

const TAX_CATEGORIES: TaxCategory[] = ['taxable', 'taxDeferred', 'taxFree', 'cashSavings'];

/** Converts annual returns to monthly, applies to portfolio, and aggregates results */
export class ReturnsProcessor {
  private cachedAnnualReturnRates: AssetReturnRates;
  private cachedAnnualInflationRate: number;
  private cachedAnnualYieldRates: AssetYieldRates;
  private lastYear: number;
  private monthlyData: ReturnsData[] = [];

  constructor(
    private simulationState: SimulationState,
    private returnsProvider: ReturnsProvider
  ) {
    const phaseData = this.simulationState.phase;
    const returns = this.returnsProvider.getReturns(phaseData);

    this.cachedAnnualReturnRates = returns.returns;
    this.cachedAnnualInflationRate = returns.inflationRate / 100;
    this.cachedAnnualYieldRates = {
      stocks: returns.yields.stocks / 100,
      bonds: returns.yields.bonds / 100,
      cash: returns.yields.cash / 100,
    };

    this.lastYear = this.simulationState.time.year;
  }

  /**
   * Processes monthly returns: converts annual rates to monthly and applies to portfolio
   * @returns Monthly return data including rates, amounts, and per-account breakdowns
   */
  process(): ReturnsData {
    const currentYear = this.simulationState.time.year;
    if (currentYear > this.lastYear + 1) {
      const phaseData = this.simulationState.phase;
      const returns = this.returnsProvider.getReturns(phaseData);

      this.cachedAnnualReturnRates = returns.returns;
      this.cachedAnnualInflationRate = returns.inflationRate / 100;
      this.cachedAnnualYieldRates = {
        stocks: returns.yields.stocks / 100,
        bonds: returns.yields.bonds / 100,
        cash: returns.yields.cash / 100,
      };

      this.lastYear = Math.floor(currentYear);
    }

    // Convert annual rates to monthly: (1 + annual)^(1/12) - 1
    const returnRates: AssetReturnRates = {
      stocks: Math.pow(1 + this.cachedAnnualReturnRates.stocks, 1 / 12) - 1,
      bonds: Math.pow(1 + this.cachedAnnualReturnRates.bonds, 1 / 12) - 1,
      cash: Math.pow(1 + this.cachedAnnualReturnRates.cash, 1 / 12) - 1,
    };
    const inflationRate = Math.pow(1 + this.cachedAnnualInflationRate, 1 / 12) - 1;
    const yieldRates: AssetYieldRates = {
      stocks: this.cachedAnnualYieldRates.stocks / 12,
      bonds: this.cachedAnnualYieldRates.bonds / 12,
      cash: this.cachedAnnualYieldRates.cash / 12,
    };

    const { yieldAmounts, cumulativeYieldAmounts } = this.simulationState.portfolio.applyYields(yieldRates);

    const { returnAmounts, cumulativeReturnAmounts, byAccount: perAccountData } = this.simulationState.portfolio.applyReturns(returnRates);

    const result = {
      cumulativeReturnAmounts,
      cumulativeYieldAmounts,
      returnAmounts,
      returnRates,
      inflationRate,
      yieldAmounts,
      yieldRates,
      annualReturnRates: this.cachedAnnualReturnRates,
      annualInflationRate: this.cachedAnnualInflationRate,
      annualYieldRates: this.cachedAnnualYieldRates,
      perAccountData,
    };

    this.monthlyData.push(result);
    return result;
  }

  resetMonthlyData(): void {
    this.monthlyData = [];
  }

  getAnnualData(): ReturnsData {
    const addAssetAmounts = (
      a: AssetReturnAmounts | AssetYieldAmounts | undefined,
      b: AssetReturnAmounts | AssetYieldAmounts
    ): AssetReturnAmounts | AssetYieldAmounts => {
      if (!a) return { ...b };
      return { stocks: a.stocks + b.stocks, bonds: a.bonds + b.bonds, cash: a.cash + b.cash };
    };

    const zeroAssetReturnAmounts: AssetReturnAmounts = { stocks: 0, bonds: 0, cash: 0 };
    const zeroAssetYieldAmounts: AssetYieldAmounts = { stocks: 0, bonds: 0, cash: 0 };

    const lastMonthData = this.monthlyData[this.monthlyData.length - 1];

    return {
      ...lastMonthData,
      ...this.monthlyData.reduce(
        (acc, curr) => {
          acc.returnAmounts = addAssetAmounts(acc.returnAmounts, curr.returnAmounts);

          for (const category of TAX_CATEGORIES) {
            acc.yieldAmounts[category] = addAssetAmounts(acc.yieldAmounts[category], curr.yieldAmounts[category]);
          }

          for (const [accountID, accountData] of Object.entries(curr.perAccountData)) {
            const existing = acc.perAccountData[accountID];
            acc.perAccountData[accountID] = {
              ...accountData,
              returnAmounts: addAssetAmounts(existing?.returnAmounts, accountData.returnAmounts),
            };
          }

          return acc;
        },
        {
          returnAmounts: { ...zeroAssetReturnAmounts },
          yieldAmounts: {
            taxable: { ...zeroAssetYieldAmounts },
            taxDeferred: { ...zeroAssetYieldAmounts },
            taxFree: { ...zeroAssetYieldAmounts },
            cashSavings: { ...zeroAssetYieldAmounts },
          },
          perAccountData: {} as Record<string, AccountDataWithReturns>,
        }
      ),
    };
  }
}
