import type { SimulationState } from './simulation-engine';
import { ReturnsProvider } from '../returns-provider';
import type { AssetReturnRates, AssetReturnAmounts } from '../asset';

export interface ReturnsData {
  returnAmounts: AssetReturnAmounts;
  monthlyReturnRates: AssetReturnRates;
  monthlyInflationRate: number;
  annualReturnRates: AssetReturnRates;
  annualInflationRate: number;
}

export class ReturnsProcessor {
  private annualReturnRates: AssetReturnRates;
  private annualInflationRate: number;
  private lastYear: number;

  constructor(
    private simulationState: SimulationState,
    private returnsProvider: ReturnsProvider
  ) {
    const returns = this.returnsProvider.getReturns(this.simulationState.time.year);

    this.annualReturnRates = returns.returns;
    this.annualInflationRate = returns.metadata.inflationRate;
    this.lastYear = this.simulationState.time.year;
  }

  process(): ReturnsData {
    const currentYear = Math.floor(this.simulationState.time.year);
    if (currentYear !== this.lastYear) {
      const returns = this.returnsProvider.getReturns(currentYear);

      this.annualReturnRates = returns.returns;
      this.annualInflationRate = returns.metadata.inflationRate;
      this.lastYear = currentYear;
    }

    const monthlyReturnRates: AssetReturnRates = {
      stocks: Math.pow(1 + this.annualReturnRates.stocks, 1 / 12) - 1,
      bonds: Math.pow(1 + this.annualReturnRates.bonds, 1 / 12) - 1,
      cash: Math.pow(1 + this.annualReturnRates.cash, 1 / 12) - 1,
    };
    const monthlyInflationRate = Math.pow(1 + this.annualInflationRate, 1 / 12) - 1;
    const returnAmounts = this.simulationState.portfolio.applyReturns(monthlyReturnRates);

    return {
      returnAmounts,
      monthlyReturnRates,
      monthlyInflationRate,
      annualReturnRates: this.annualReturnRates,
      annualInflationRate: this.annualInflationRate,
    };
  }
}
