import type { ExpenseInputs } from '@/lib/schemas/expense-form-schema';

import type { ReturnsData } from './returns';
import type { SimulationState } from './simulation-engine';

export interface ExpensesData {
  totalExpenses: number;
}

export class ExpensesProcessor {
  constructor(
    private simulationState: SimulationState,
    private expenses: Expenses
  ) {}

  process(returnsData: ReturnsData): ExpensesData {
    const activeExpenses = this.expenses.getActiveExpensesByTimeFrame(this.simulationState);

    const totalExpenses = activeExpenses.reduce((sum, expense) => {
      // TODO: Fix partial year timeframe expense application
      return sum + expense.calculateAnnualAmount(returnsData.inflationRate, this.simulationState.year);
    }, 0);

    return { totalExpenses };
  }
}

export class Expenses {
  private readonly expenses: Expense[];

  constructor(private data: ExpenseInputs[]) {
    this.expenses = data.map((expense) => new Expense(expense));
  }

  getActiveExpensesByTimeFrame(simulationState: SimulationState): Expense[] {
    return this.expenses.filter((expense) => expense.getIsActiveByTimeFrame(simulationState));
  }
}

export class Expense {
  private hasOneTimeExpenseOccurred: boolean;

  constructor(private data: ExpenseInputs) {
    this.hasOneTimeExpenseOccurred = false;
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
        if (this.hasOneTimeExpenseOccurred) return 0;
        this.hasOneTimeExpenseOccurred = true;
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
