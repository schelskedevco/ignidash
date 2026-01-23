import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';

import type { SimulationState } from './simulation-engine';
import { ReturnsProvider } from './returns-providers/returns-provider';
import type { AssetReturnRates, AssetReturnAmounts, AssetYieldAmounts, AssetYieldRates, TaxCategory } from './asset';

export interface AccountDataWithReturns {
  name: string;
  id: string;
  type: AccountInputs['type'];
  returnAmountsForPeriod: AssetReturnAmounts;
  cumulativeReturnAmounts: AssetReturnAmounts;
}

export interface ReturnsData {
  // Cumulative return data
  cumulativeReturnAmounts: AssetReturnAmounts;
  cumulativeYieldAmounts: Record<TaxCategory, AssetYieldAmounts>;

  // Monthly return data
  returnAmountsForPeriod: AssetReturnAmounts;
  returnRatesForPeriod: AssetReturnRates;
  yieldAmountsForPeriod: Record<TaxCategory, AssetYieldAmounts>;
  yieldRatesForPeriod: AssetYieldRates;
  inflationRateForPeriod: number;

  // Annual return data
  annualReturnRates: AssetReturnRates;
  annualYieldRates: AssetYieldRates;
  annualInflationRate: number;

  // Per account data
  perAccountData: Record<string, AccountDataWithReturns>;
}

const TAX_CATEGORIES: TaxCategory[] = ['taxable', 'taxDeferred', 'taxFree', 'cashSavings'];

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

    const returnRatesForPeriod: AssetReturnRates = {
      stocks: Math.pow(1 + this.cachedAnnualReturnRates.stocks, 1 / 12) - 1,
      bonds: Math.pow(1 + this.cachedAnnualReturnRates.bonds, 1 / 12) - 1,
      cash: Math.pow(1 + this.cachedAnnualReturnRates.cash, 1 / 12) - 1,
    };
    const inflationRateForPeriod = Math.pow(1 + this.cachedAnnualInflationRate, 1 / 12) - 1;
    const yieldRatesForPeriod: AssetYieldRates = {
      stocks: this.cachedAnnualYieldRates.stocks / 12,
      bonds: this.cachedAnnualYieldRates.bonds / 12,
      cash: this.cachedAnnualYieldRates.cash / 12,
    };

    const { yieldsForPeriod: yieldAmountsForPeriod, cumulativeYields: cumulativeYieldAmounts } =
      this.simulationState.portfolio.applyYields(yieldRatesForPeriod);

    const {
      returnsForPeriod: returnAmountsForPeriod,
      cumulativeReturns: cumulativeReturnAmounts,
      byAccount: perAccountData,
    } = this.simulationState.portfolio.applyReturns(returnRatesForPeriod);

    const result = {
      cumulativeReturnAmounts,
      cumulativeYieldAmounts,
      returnAmountsForPeriod,
      returnRatesForPeriod,
      inflationRateForPeriod,
      yieldAmountsForPeriod,
      yieldRatesForPeriod,
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
    const addAssetReturns = (a: AssetReturnAmounts | undefined, b: AssetReturnAmounts): AssetReturnAmounts => {
      if (!a) return { ...b };
      return {
        stocks: a.stocks + b.stocks,
        bonds: a.bonds + b.bonds,
        cash: a.cash + b.cash,
      };
    };

    const zeroAssetReturnAmounts: AssetReturnAmounts = { stocks: 0, bonds: 0, cash: 0 };
    const zeroAssetYieldAmounts: AssetYieldAmounts = { stocks: 0, bonds: 0, cash: 0 };

    const lastMonthData = this.monthlyData[this.monthlyData.length - 1];

    return {
      ...lastMonthData,
      ...this.monthlyData.reduce(
        (acc, curr) => {
          acc.returnAmountsForPeriod.stocks += curr.returnAmountsForPeriod.stocks;
          acc.returnAmountsForPeriod.bonds += curr.returnAmountsForPeriod.bonds;
          acc.returnAmountsForPeriod.cash += curr.returnAmountsForPeriod.cash;

          for (const category of TAX_CATEGORIES) {
            acc.yieldAmountsForPeriod[category].stocks += curr.yieldAmountsForPeriod[category].stocks;
            acc.yieldAmountsForPeriod[category].bonds += curr.yieldAmountsForPeriod[category].bonds;
            acc.yieldAmountsForPeriod[category].cash += curr.yieldAmountsForPeriod[category].cash;
          }

          for (const [accountID, accountData] of Object.entries(curr.perAccountData)) {
            const existing = acc.perAccountData[accountID];
            acc.perAccountData[accountID] = {
              ...accountData,
              returnAmountsForPeriod: addAssetReturns(existing?.returnAmountsForPeriod, accountData.returnAmountsForPeriod),
            };
          }

          return acc;
        },
        {
          returnAmountsForPeriod: { ...zeroAssetReturnAmounts },
          yieldAmountsForPeriod: {
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

export const sumReturns = (r: AssetReturnAmounts): number => r.stocks + r.bonds + r.cash;
