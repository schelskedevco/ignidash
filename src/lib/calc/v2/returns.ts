import { SimulationState } from './simulation-engine';
import { ReturnsProvider } from '../returns-provider';
import type { AssetReturnRates, AssetReturnAmounts } from '../asset';

export interface ReturnsData {
  amounts: AssetReturnAmounts;
  rates: AssetReturnRates;
}

export class ReturnsProcessor {
  private returnRates: AssetReturnRates | null = null;
  private lastSimulationYear: number | null = null;

  constructor(
    private simulationState: SimulationState,
    private returnsProvider: ReturnsProvider
  ) {}

  process(): ReturnsData {
    const simulationYear = Math.floor(this.simulationState.year);

    if (this.lastSimulationYear !== simulationYear) {
      this.returnRates = this.returnsProvider.getReturns(simulationYear).returns;
      this.lastSimulationYear = simulationYear;
    }

    const returnRates: AssetReturnRates = this.returnRates!;
    return { amounts: this.simulationState.portfolio.applyReturns(returnRates), rates: returnRates };
  }
}
