import { IncomeInputs } from '@/lib/schemas/income-form-schema';

import { SimulationState } from './simulation-engine';

export interface IncomesData {
  temp: string;
}

export class IncomesProcessor {
  constructor(private simulationState: SimulationState) {}

  process(): void {
    return;
  }
}

export class Incomes {
  private readonly incomes: Income[];

  constructor(private data: IncomeInputs[]) {
    this.incomes = data.map((income) => new Income(income));
  }

  getActiveIncomes(simulationState: SimulationState): Income[] {
    return this.incomes.filter((income) => income.getIsActive(simulationState));
  }
}

export class Income {
  private hasOneTimeIncomeOccurred: boolean;

  constructor(private data: IncomeInputs) {
    this.hasOneTimeIncomeOccurred = false;
  }

  calculateAmount(inflationRate: number, year: number): number {
    let amount = this.data.amount;

    const nominalGrowthRate = this.data.growth?.growthRate ?? 0; // Growth rate set by user.
    const realGrowthRate = (1 + nominalGrowthRate / 100) / (1 + inflationRate / 100) - 1;

    amount *= Math.pow(1 + realGrowthRate, year);

    const growthLimit = this.data.growth?.growthLimit;
    if (growthLimit !== undefined && nominalGrowthRate > 0) {
      amount = Math.min(amount, growthLimit);
    } else if (growthLimit !== undefined && nominalGrowthRate < 0) {
      amount = Math.max(amount, growthLimit);
    }

    return amount;
  }

  getIsActive(simulationState: SimulationState): boolean {
    const simDate = new Date(simulationState.date);
    const simAge = simulationState.age;

    let simTimeIsAfterStart = false;
    let simTimeIsBeforeEnd = false;

    const timeFrameStart = this.data.timeframe.start;
    switch (timeFrameStart.type) {
      case 'customAge':
        simTimeIsAfterStart = simAge >= timeFrameStart.age!;
        break;
      case 'customDate':
        const customDateYear = timeFrameStart.year!;
        const customDateMonth = timeFrameStart.month! - 1;

        const customStartDate = new Date(customDateYear, customDateMonth);

        simTimeIsAfterStart = simDate >= customStartDate;
        break;
      case 'now':
        simTimeIsAfterStart = true; // TODO: Use actual date comparison.
        break;
      case 'atRetirement':
        simTimeIsAfterStart = simulationState.phase.getCurrentPhaseName(simulationState) === 'retirement';
        break;
      case 'atLifeExpectancy':
        simTimeIsAfterStart = false; // TODO: Use actual date comparison.
        break;
    }

    if (this.data.frequency === 'oneTime' && !this.hasOneTimeIncomeOccurred && simTimeIsAfterStart) {
      this.hasOneTimeIncomeOccurred = true;
      return true;
    }

    const timeFrameEnd = this.data.timeframe.end!;
    switch (timeFrameEnd.type) {
      case 'customAge':
        simTimeIsBeforeEnd = simAge <= timeFrameEnd.age!;
        break;
      case 'customDate':
        const customDateYear = timeFrameEnd.year!;
        const customDateMonth = timeFrameEnd.month! - 1;

        const customEndDate = new Date(customDateYear, customDateMonth);

        simTimeIsBeforeEnd = simDate <= customEndDate;
        break;
      case 'now':
        simTimeIsBeforeEnd = false; // TODO: Use actual date comparison.
        break;
      case 'atRetirement':
        simTimeIsBeforeEnd = simulationState.phase.getCurrentPhaseName(simulationState) !== 'retirement';
        break;
      case 'atLifeExpectancy':
        simTimeIsBeforeEnd = true; // TODO: Use actual date comparison.
        break;
    }

    return simTimeIsAfterStart && simTimeIsBeforeEnd;
  }
}
