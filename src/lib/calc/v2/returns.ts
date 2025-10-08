import type { AccountInputs } from '@/lib/schemas/account-form-schema';

import type { SimulationState } from './simulation-engine';
import { ReturnsProvider } from '../returns-providers/returns-provider';
import type { AssetReturnRates, AssetReturnAmounts, AssetYieldAmounts, AssetYieldRates, TaxCategory } from '../asset';

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
  totalYieldAmounts: AssetYieldAmounts;

  // Monthly return data
  returnAmountsForPeriod: AssetReturnAmounts;
  returnRatesForPeriod: AssetReturnRates;
  inflationRateForPeriod: number;
  yieldAmountsForPeriod: AssetYieldAmounts;
  yieldRatesForPeriod: AssetYieldRates;

  // Annual return data
  annualReturnRates: AssetReturnRates;
  annualInflationRate: number;
  annualYieldRates: AssetYieldRates;

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
    this.cachedAnnualYieldRates = { dividendYield: returns.metadata.stockYield / 100, bondYield: returns.metadata.bondYield / 100 };
    this.lastYear = this.simulationState.time.year;
  }

  process(): ReturnsData {
    const currentYear = Math.floor(this.simulationState.time.year);
    if (currentYear !== this.lastYear) {
      const phaseData = this.simulationState.phase;
      const returns = this.returnsProvider.getReturns(phaseData);

      this.cachedAnnualReturnRates = returns.returns;
      this.cachedAnnualInflationRate = returns.metadata.inflationRate / 100;
      this.cachedAnnualYieldRates = { dividendYield: returns.metadata.stockYield / 100, bondYield: returns.metadata.bondYield / 100 };
      this.lastYear = currentYear;
    }

    const returnRatesForPeriod: AssetReturnRates = {
      stocks: Math.pow(1 + this.cachedAnnualReturnRates.stocks, 1 / 12) - 1,
      bonds: Math.pow(1 + this.cachedAnnualReturnRates.bonds, 1 / 12) - 1,
      cash: Math.pow(1 + this.cachedAnnualReturnRates.cash, 1 / 12) - 1,
    };
    const inflationRateForPeriod = Math.pow(1 + this.cachedAnnualInflationRate, 1 / 12) - 1;
    const yieldRatesForPeriod: AssetYieldRates = {
      dividendYield: this.cachedAnnualYieldRates.dividendYield / 12,
      bondYield: this.cachedAnnualYieldRates.bondYield / 12,
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

  getMonthlyData(): ReturnsData[] {
    return this.monthlyData;
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
      ...this.monthlyData[0],
      ...this.monthlyData.reduce(
        (acc, curr) => {
          acc.returnAmountsForPeriod.stocks += curr.returnAmountsForPeriod.stocks;
          acc.returnAmountsForPeriod.bonds += curr.returnAmountsForPeriod.bonds;
          acc.returnAmountsForPeriod.cash += curr.returnAmountsForPeriod.cash;

          (['taxable', 'taxDeferred', 'taxFree'] as TaxCategory[]).forEach((category) => {
            acc.yieldAmountsForPeriod[category].dividendYield += curr.yieldAmountsForPeriod[category].dividendYield;
            acc.yieldAmountsForPeriod[category].bondYield += curr.yieldAmountsForPeriod[category].bondYield;
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
            taxable: { dividendYield: 0, bondYield: 0 },
            taxDeferred: { dividendYield: 0, bondYield: 0 },
            taxFree: { dividendYield: 0, bondYield: 0 },
          },
          perAccountData: {} as Record<string, AccountDataWithReturns>,
        }
      ),
    };
  }
}
