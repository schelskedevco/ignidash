import { SimulationState } from './simulation-engine';
import { ReturnsProvider } from '../returns-provider';
import type { AssetReturnRates, AssetReturnAmounts } from '../asset';

export interface ReturnsData {
  amounts: AssetReturnAmounts;
  rates: AssetReturnRates;
  inflationRate: number;
}

export class ReturnsProcessor {
  private returnRates: AssetReturnRates | null = null;
  private inflationRate: number | null = null;
  private lastSimulationYear: number | null = null;

  constructor(
    private simulationState: SimulationState,
    private returnsProvider: ReturnsProvider
  ) {}

  process(): ReturnsData {
    const simulationYear = Math.floor(this.simulationState.year);

    if (this.lastSimulationYear !== simulationYear) {
      const returns = this.returnsProvider.getReturns(simulationYear);

      this.returnRates = returns.returns;
      this.inflationRate = returns.metadata.inflationRate;
      this.lastSimulationYear = simulationYear;
    }

    const returnRates: AssetReturnRates = this.returnRates!;

    return {
      amounts: this.simulationState.portfolio.applyReturns(returnRates),
      rates: returnRates,
      inflationRate: this.inflationRate!,
    };
  }
}
