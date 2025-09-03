import type { ExpenseInputs, TimePoint } from '@/lib/schemas/expense-form-schema';

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
      return sum + expense.processMonthlyAmount(returnsData.annualInflationRate, this.simulationState.time.year);
    }, 0);

    return { totalExpenses };
  }
}

export class Expenses {
  private readonly expenses: Expense[];

  constructor(data: ExpenseInputs[]) {
    this.expenses = data.map((expense) => new Expense(expense));
  }

  getActiveExpensesByTimeFrame(simulationState: SimulationState): Expense[] {
    return this.expenses.filter((expense) => expense.getIsActiveByTimeFrame(simulationState));
  }
}

export class Expense {
  private hasOneTimeExpenseOccurred: boolean;
  private amount: number;
  private growthRate: number | undefined;
  private growthLimit: number | undefined;
  private timeFrameStart: TimePoint;
  private timeFrameEnd: TimePoint | undefined;
  private frequency: 'yearly' | 'oneTime' | 'quarterly' | 'monthly' | 'biweekly' | 'weekly';

  constructor(data: ExpenseInputs) {
    this.hasOneTimeExpenseOccurred = false;
    this.amount = data.amount;
    this.growthRate = data.growth?.growthRate;
    this.growthLimit = data.growth?.growthLimit;
    this.timeFrameStart = data.timeframe.start;
    this.timeFrameEnd = data.timeframe.end;
    this.frequency = data.frequency;
  }

  processMonthlyAmount(inflationRate: number, year: number): number {
    const rawAmount = this.amount;
    let annualAmount = rawAmount * this.getTimesToApplyPerYear();

    const nominalGrowthRate = this.growthRate ?? 0;
    const realGrowthRate = (1 + nominalGrowthRate / 100) / (1 + inflationRate / 100) - 1;

    annualAmount *= Math.pow(1 + realGrowthRate, year);

    const growthLimit = this.growthLimit;
    if (growthLimit !== undefined && nominalGrowthRate > 0) {
      annualAmount = Math.min(annualAmount, growthLimit);
    } else if (growthLimit !== undefined && nominalGrowthRate < 0) {
      annualAmount = Math.max(annualAmount, growthLimit);
    }

    const monthlyAmount = Math.max((annualAmount / this.getTimesToApplyPerYear()) * this.getTimesToApplyPerMonth(), 0);
    if (this.frequency === 'oneTime') this.hasOneTimeExpenseOccurred = true;
    return monthlyAmount;
  }

  getIsActiveByTimeFrame(simulationState: SimulationState): boolean {
    const simTimeIsAfterExpenseStart = this.getIsSimTimeAfterExpenseStart(simulationState);
    const simTimeIsBeforeExpenseEnd = this.getIsSimTimeBeforeExpenseEnd(simulationState);

    return simTimeIsAfterExpenseStart && simTimeIsBeforeExpenseEnd;
  }

  private getIsSimTimeAfterExpenseStart(simulationState: SimulationState): boolean {
    const simDate = simulationState.time.date;
    const simAge = simulationState.time.age;

    const timeFrameStart = this.timeFrameStart;
    switch (timeFrameStart.type) {
      case 'customAge':
        return simAge >= timeFrameStart.age!;
      case 'customDate':
        const customDateYear = timeFrameStart.year!;
        const customDateMonth = timeFrameStart.month! - 1;

        const customStartDate = new Date(customDateYear, customDateMonth);

        return simDate >= customStartDate;
      case 'now':
        return true;
      case 'atRetirement':
        return simulationState.phaseName === 'retirement';
      case 'atLifeExpectancy':
        return false;
    }
  }

  private getIsSimTimeBeforeExpenseEnd(simulationState: SimulationState): boolean {
    const simDate = simulationState.time.date;
    const simAge = simulationState.time.age;

    const timeFrameEnd = this.timeFrameEnd;
    if (!timeFrameEnd) return true; // If no end time frame is set, consider it active

    switch (timeFrameEnd.type) {
      case 'customAge':
        return simAge <= timeFrameEnd.age!;
      case 'customDate':
        const customDateYear = timeFrameEnd.year!;
        const customDateMonth = timeFrameEnd.month! - 1;

        const customEndDate = new Date(customDateYear, customDateMonth);

        return simDate <= customEndDate;
      case 'now':
        return false;
      case 'atRetirement':
        return simulationState.phaseName !== 'retirement';
      case 'atLifeExpectancy':
        return true;
    }
  }

  private getTimesToApplyPerYear(): number {
    switch (this.frequency) {
      case 'yearly':
        return 1;
      case 'oneTime':
        if (this.hasOneTimeExpenseOccurred) return 0;
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

  private getTimesToApplyPerMonth(): number {
    switch (this.frequency) {
      case 'yearly':
        return 1 / 12;
      case 'oneTime':
        if (this.hasOneTimeExpenseOccurred) return 0;
        return 1;
      case 'quarterly':
        return 4 / 12;
      case 'monthly':
        return 1;
      case 'biweekly':
        return 26 / 12;
      case 'weekly':
        return 52 / 12;
    }
  }
}
