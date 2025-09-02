import type { IncomeInputs } from '@/lib/schemas/income-form-schema';

import type { ReturnsData } from './returns';
import type { SimulationState } from './simulation-engine';

export interface IncomesData {
  totalGrossIncome: number;
}

export class IncomesProcessor {
  constructor(
    private simulationState: SimulationState,
    private incomes: Incomes
  ) {}

  process(returnsData: ReturnsData): IncomesData {
    const activeIncomes = this.incomes.getActiveIncomesByTimeFrame(this.simulationState);

    const totalGrossIncome = activeIncomes.reduce((sum, income) => {
      return sum + income.calculateAnnualAmount(returnsData.inflationRate, this.simulationState.year);
    }, 0);

    return { totalGrossIncome };
  }
}

export class Incomes {
  private readonly incomes: Income[];

  constructor(private data: IncomeInputs[]) {
    this.incomes = data.map((income) => new Income(income));
  }

  getActiveIncomesByTimeFrame(simulationState: SimulationState): Income[] {
    return this.incomes.filter((income) => income.getIsActiveByTimeFrame(simulationState));
  }
}

export class Income {
  private hasOneTimeIncomeOccurred: boolean;

  constructor(private data: IncomeInputs) {
    this.hasOneTimeIncomeOccurred = false;
  }

  calculateAnnualAmount(inflationRate: number, year: number): number {
    let amount = this.data.amount * this.getTimesToApplyPerYear();

    const nominalGrowthRate = this.data.growth?.growthRate ?? 0;
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

  getIsActiveByTimeFrame(simulationState: SimulationState): boolean {
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

    const timeFrameEnd = this.data.timeframe?.end;
    if (!timeFrameEnd) return simTimeIsAfterStart;

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

  getTimesToApplyPerYear(): number {
    switch (this.data.frequency) {
      case 'yearly':
        return 1;
      case 'oneTime':
        if (this.hasOneTimeIncomeOccurred) return 0;
        this.hasOneTimeIncomeOccurred = true;
        return 1;
      case 'quarterly':
        return 4;
      case 'monthly':
        return 12;
      case 'biweekly':
        return 26;
      case 'weekly':
        return 52;
    }
  }
}
