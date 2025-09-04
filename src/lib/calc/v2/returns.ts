import type { SimulationState } from './simulation-engine';
import { ReturnsProvider } from '../returns-provider';
import type { AssetReturnRates, AssetReturnAmounts } from '../asset';

export interface ReturnsData {
  monthlyReturnAmounts: AssetReturnAmounts;
  monthlyReturnRates: AssetReturnRates;
  monthlyInflationRate: number;

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
    this.cachedAnnualInflationRate = returns.metadata.inflationRate;
    this.lastYear = this.simulationState.time.year;
  }

  process(): ReturnsData {
    const currentYear = Math.floor(this.simulationState.time.year);
    if (currentYear !== this.lastYear) {
      const returns = this.returnsProvider.getReturns(currentYear);

      this.cachedAnnualReturnRates = returns.returns;
      this.cachedAnnualInflationRate = returns.metadata.inflationRate;
      this.lastYear = currentYear;
    }

    const monthlyReturnRates: AssetReturnRates = {
      stocks: Math.pow(1 + this.cachedAnnualReturnRates.stocks, 1 / 12) - 1,
      bonds: Math.pow(1 + this.cachedAnnualReturnRates.bonds, 1 / 12) - 1,
      cash: Math.pow(1 + this.cachedAnnualReturnRates.cash, 1 / 12) - 1,
    };
    const monthlyInflationRate = Math.pow(1 + this.cachedAnnualInflationRate, 1 / 12) - 1;
    const monthlyReturnAmounts = this.simulationState.portfolio.applyReturns(monthlyReturnRates);

    const result = {
      monthlyReturnAmounts,
      monthlyReturnRates,
      monthlyInflationRate,
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
    return this.monthlyData.reduce(
      (acc, curr) => {
        return {
          ...acc,
          monthlyReturnAmounts: {
            stocks: acc.monthlyReturnAmounts.stocks + curr.monthlyReturnAmounts.stocks,
            bonds: acc.monthlyReturnAmounts.bonds + curr.monthlyReturnAmounts.bonds,
            cash: acc.monthlyReturnAmounts.cash + curr.monthlyReturnAmounts.cash,
          },
        };
      },
      {
        ...this.monthlyData[0],
        monthlyReturnAmounts: { stocks: 0, bonds: 0, cash: 0 },
      }
    );
  }
}
