import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';

import type { SimulationState } from './simulation-engine';
import { ReturnsProvider } from './returns-providers/returns-provider';
import type { AssetReturnRates, AssetReturnAmounts, AssetYieldAmounts, AssetYieldRates, TaxCategory } from './asset';

export interface AccountDataWithReturns {
  name: string;
  id: string;
  type: AccountInputs['type'];
  returnAmountsForPeriod: AssetReturnAmounts;
  totalReturnAmounts: AssetReturnAmounts;
}

export interface ReturnsData {
  // Total return data
  totalReturnAmounts: AssetReturnAmounts;
  totalYieldAmounts: Record<TaxCategory, AssetYieldAmounts>;

  // Monthly return data
  returnAmountsForPeriod: AssetReturnAmounts;
  returnRatesForPeriod: AssetReturnRates;
  inflationRateForPeriod: number;
  yieldAmountsForPeriod: Record<TaxCategory, AssetYieldAmounts>;
  yieldRatesForPeriod: AssetYieldRates;

  // Annual return data
  annualReturnRates: AssetReturnRates;
  annualInflationRate: number;
  annualYieldRates: AssetYieldRates;

  // Per account data
  perAccountData: Record<string, AccountDataWithReturns>;
}

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
    this.cachedAnnualInflationRate = returns.metadata.inflationRate / 100;
    this.cachedAnnualYieldRates = {
      stocks: returns.yields.stocks / 100,
      bonds: returns.yields.bonds / 100,
      cash: returns.yields.cash / 100,
    };
    this.lastYear = this.simulationState.time.year;
  }

  process(): ReturnsData {
    const currentYear = Math.floor(this.simulationState.time.year);
    if (currentYear !== this.lastYear) {
      const phaseData = this.simulationState.phase;
      const returns = this.returnsProvider.getReturns(phaseData);

      this.cachedAnnualReturnRates = returns.returns;
      this.cachedAnnualInflationRate = returns.metadata.inflationRate / 100;
      this.cachedAnnualYieldRates = {
        stocks: returns.yields.stocks / 100,
        bonds: returns.yields.bonds / 100,
        cash: returns.yields.cash / 100,
      };
      this.lastYear = currentYear;
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

    const { yieldsForPeriod: yieldAmountsForPeriod, totalYields: totalYieldAmounts } =
      this.simulationState.portfolio.applyYields(yieldRatesForPeriod);

    const {
      returnsForPeriod: returnAmountsForPeriod,
      totalReturns: totalReturnAmounts,
      byAccount: perAccountData,
    } = this.simulationState.portfolio.applyReturns(returnRatesForPeriod);

    const result = {
      totalReturnAmounts,
      totalYieldAmounts,
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
    const addAssetReturns = (a: AssetReturnAmounts | undefined, b: AssetReturnAmounts): AssetReturnAmounts => ({
      stocks: (a?.stocks ?? 0) + b.stocks,
      bonds: (a?.bonds ?? 0) + b.bonds,
      cash: (a?.cash ?? 0) + b.cash,
    });

    return {
      ...this.monthlyData[this.monthlyData.length - 1],
      ...this.monthlyData.reduce(
        (acc, curr) => {
          acc.returnAmountsForPeriod.stocks += curr.returnAmountsForPeriod.stocks;
          acc.returnAmountsForPeriod.bonds += curr.returnAmountsForPeriod.bonds;
          acc.returnAmountsForPeriod.cash += curr.returnAmountsForPeriod.cash;

          (['taxable', 'taxDeferred', 'taxFree', 'cashSavings'] as TaxCategory[]).forEach((category) => {
            acc.yieldAmountsForPeriod[category].stocks += curr.yieldAmountsForPeriod[category].stocks;
            acc.yieldAmountsForPeriod[category].bonds += curr.yieldAmountsForPeriod[category].bonds;
            acc.yieldAmountsForPeriod[category].cash += curr.yieldAmountsForPeriod[category].cash;
          });

          Object.entries(curr.perAccountData).forEach(([accountID, accountData]) => {
            acc.perAccountData[accountID] = {
              ...accountData,
              returnAmountsForPeriod: addAssetReturns(
                acc.perAccountData[accountID]?.returnAmountsForPeriod,
                accountData.returnAmountsForPeriod
              ),
              totalReturnAmounts: addAssetReturns(acc.perAccountData[accountID]?.totalReturnAmounts, accountData.totalReturnAmounts),
            };
          });

          return acc;
        },
        {
          returnAmountsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
          yieldAmountsForPeriod: {
            taxable: { stocks: 0, bonds: 0, cash: 0 },
            taxDeferred: { stocks: 0, bonds: 0, cash: 0 },
            taxFree: { stocks: 0, bonds: 0, cash: 0 },
            cashSavings: { stocks: 0, bonds: 0, cash: 0 },
          },
          perAccountData: {} as Record<string, AccountDataWithReturns>,
        }
      ),
    };
  }
}
