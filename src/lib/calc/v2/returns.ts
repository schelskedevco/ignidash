import type { SimulationState } from './simulation-engine';
import { ReturnsProvider } from '../returns-provider';
import type { AssetReturnRates, AssetReturnAmounts } from '../asset';

export interface ReturnsData {
  // Total return data
  totalReturnAmounts: AssetReturnAmounts;

  // Monthly return data
  returnAmountsForPeriod: AssetReturnAmounts;
  returnRatesForPeriod: AssetReturnRates;
  inflationRateForPeriod: number;

  // Annual return data
  annualReturnRates: AssetReturnRates;
  annualInflationRate: number;
}

export class ReturnsProcessor {
  private cachedAnnualReturnRates: AssetReturnRates;
  private cachedAnnualInflationRate: number;
  private lastYear: number;
  private monthlyData: ReturnsData[] = [];

  constructor(
    private simulationState: SimulationState,
    private returnsProvider: ReturnsProvider
  ) {
    const returns = this.returnsProvider.getReturns(this.simulationState.time.year);

    this.cachedAnnualReturnRates = returns.returns;
    this.cachedAnnualInflationRate = returns.metadata.inflationRate / 100;
    this.lastYear = this.simulationState.time.year;
  }

  process(): ReturnsData {
    const currentYear = Math.floor(this.simulationState.time.year);
    if (currentYear !== this.lastYear) {
      const returns = this.returnsProvider.getReturns(currentYear);

      this.cachedAnnualReturnRates = returns.returns;
      this.cachedAnnualInflationRate = returns.metadata.inflationRate / 100;
      this.lastYear = currentYear;
    }

    const returnRatesForPeriod: AssetReturnRates = {
      stocks: Math.pow(1 + this.cachedAnnualReturnRates.stocks, 1 / 12) - 1,
      bonds: Math.pow(1 + this.cachedAnnualReturnRates.bonds, 1 / 12) - 1,
      cash: Math.pow(1 + this.cachedAnnualReturnRates.cash, 1 / 12) - 1,
    };
    const inflationRateForPeriod = Math.pow(1 + this.cachedAnnualInflationRate, 1 / 12) - 1;

    const { returnsForPeriod: returnAmountsForPeriod, totalReturns: totalReturnAmounts } =
      this.simulationState.portfolio.applyReturns(returnRatesForPeriod);

    const result = {
      totalReturnAmounts,
      returnAmountsForPeriod,
      returnRatesForPeriod,
      inflationRateForPeriod,
      annualReturnRates: this.cachedAnnualReturnRates,
      annualInflationRate: this.cachedAnnualInflationRate,
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
    return {
      ...this.monthlyData[0] /* Only need to accumulate returnAmounts */,
      returnAmountsForPeriod: this.monthlyData.reduce(
        (acc, curr) => ({
          stocks: acc.stocks + curr.returnAmountsForPeriod.stocks,
          bonds: acc.bonds + curr.returnAmountsForPeriod.bonds,
          cash: acc.cash + curr.returnAmountsForPeriod.cash,
        }),
        { stocks: 0, bonds: 0, cash: 0 }
      ),
    };
  }
}
