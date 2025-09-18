import type { ExpenseInputs, TimePoint } from '@/lib/schemas/expense-form-schema';

import type { ReturnsData } from './returns';
import type { SimulationState } from './simulation-engine';

export class ExpensesProcessor {
  private monthlyData: ExpensesData[] = [];

  constructor(
    private simulationState: SimulationState,
    private expenses: Expenses
  ) {}

  process(returnsData: ReturnsData): ExpensesData {
    const activeExpenses = this.expenses.getActiveExpensesByTimeFrame(this.simulationState);

    const processedExpenses = activeExpenses.map((expense) =>
      expense.processMonthlyAmount(returnsData.annualInflationRate, this.simulationState.time.year)
    );

    const totalExpenses = processedExpenses.reduce((sum, expense) => {
      return sum + expense.amount;
    }, 0);
    const perExpenseData = Object.fromEntries(processedExpenses.map((expense) => [expense.id, expense]));

    const result = { totalExpenses, perExpenseData };

    this.monthlyData.push(result);
    return result;
  }

  getMonthlyData(): ExpensesData[] {
    return this.monthlyData;
  }

  resetMonthlyData(): void {
    this.monthlyData = [];
  }

  getAnnualData(): ExpensesData {
    return this.monthlyData.reduce(
      (acc, curr) => {
        acc.totalExpenses += curr.totalExpenses;

        Object.entries(curr.perExpenseData).forEach(([expenseID, expenseData]) => {
          acc.perExpenseData[expenseID] = {
            ...expenseData,
            amount: (acc.perExpenseData[expenseID]?.amount ?? 0) + expenseData.amount,
          };
        });

        return acc;
      },
      { totalExpenses: 0, perExpenseData: {} }
    );
  }
}

export interface ExpensesData {
  totalExpenses: number;
  perExpenseData: Record<string, ExpenseData>;
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

export interface ExpenseData {
  id: string;
  name: string;
  amount: number;
}

export class Expense {
  private hasOneTimeExpenseOccurred: boolean;
  private id: string;
  private name: string;
  private amount: number;
  private growthRate: number | undefined;
  private growthLimit: number | undefined;
  private timeFrameStart: TimePoint;
  private timeFrameEnd: TimePoint | undefined;
  private frequency: 'yearly' | 'oneTime' | 'quarterly' | 'monthly' | 'biweekly' | 'weekly';
  private lastYear: number = 0;

  constructor(data: ExpenseInputs) {
    this.hasOneTimeExpenseOccurred = false;
    this.id = data.id;
    this.name = data.name;
    this.amount = data.amount;
    this.growthRate = data.growth?.growthRate;
    this.growthLimit = data.growth?.growthLimit;
    this.timeFrameStart = data.timeframe.start;
    this.timeFrameEnd = data.timeframe.end;
    this.frequency = data.frequency;
  }

  processMonthlyAmount(inflationRate: number, year: number): ExpenseData {
    const rawAmount = this.amount;

    const timesToApplyPerYear = this.getTimesToApplyPerYear();
    const timesToApplyPerMonth = this.getTimesToApplyPerMonth();

    let annualAmount = rawAmount * timesToApplyPerYear;

    if (this.lastYear !== Math.floor(year)) {
      const nominalGrowthRate = this.growthRate;
      if (nominalGrowthRate) {
        const realGrowthRate = (1 + nominalGrowthRate / 100) / (1 + inflationRate) - 1;

        annualAmount *= 1 + realGrowthRate;

        const growthLimit = this.growthLimit;
        if (growthLimit !== undefined && nominalGrowthRate > 0) {
          annualAmount = Math.min(annualAmount, growthLimit);
        } else if (growthLimit !== undefined && nominalGrowthRate < 0) {
          annualAmount = Math.max(annualAmount, growthLimit);
        }

        this.amount = Math.max(annualAmount / timesToApplyPerYear, 0);
      }

      this.lastYear = Math.floor(year);
    }

    if (timesToApplyPerYear === 0) return { id: this.id, name: this.name, amount: 0 };

    const monthlyAmount = Math.max((annualAmount / timesToApplyPerYear) * timesToApplyPerMonth, 0);

    if (this.frequency === 'oneTime') this.hasOneTimeExpenseOccurred = true;
    return { id: this.id, name: this.name, amount: monthlyAmount };
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
        return simulationState.phase?.name === 'retirement';
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
        return simulationState.phase?.name !== 'retirement';
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
