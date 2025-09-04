import type { IncomeInputs, TimePoint } from '@/lib/schemas/income-form-schema';

import type { ReturnsData } from './returns';
import type { SimulationState } from './simulation-engine';

export interface IncomeData {
  id: string;
  name: string;
  grossIncome: number;
  amountWithheld: number;
  incomeAfterWithholding: number;
}

export interface IncomesData {
  totalGrossIncome: number;
  totalAmountWithheld: number;
  totalIncomeAfterWithholding: number;
  perIncomeData: Record<string, IncomeData>;
}

export class IncomesProcessor {
  constructor(
    private simulationState: SimulationState,
    private incomes: Incomes
  ) {}

  process(returnsData: ReturnsData): IncomesData {
    const activeIncomes = this.incomes.getActiveIncomesByTimeFrame(this.simulationState);

    const processedIncomes = activeIncomes.map((income) =>
      income.processMonthlyAmount(returnsData.annualInflationRate, this.simulationState.time.year)
    );

    const totals = processedIncomes.reduce(
      (acc, curr) => {
        acc.totalGrossIncome += curr.grossIncome;
        acc.totalAmountWithheld += curr.amountWithheld;
        acc.totalIncomeAfterWithholding += curr.incomeAfterWithholding;
        return acc;
      },
      {
        totalGrossIncome: 0,
        totalAmountWithheld: 0,
        totalIncomeAfterWithholding: 0,
      }
    );
    const perIncomeData = Object.fromEntries(processedIncomes.map((income) => [income.id, income]));

    return { ...totals, perIncomeData };
  }
}

export class Incomes {
  private readonly incomes: Income[];

  constructor(data: IncomeInputs[]) {
    this.incomes = data.map((income) => new Income(income));
  }

  getActiveIncomesByTimeFrame(simulationState: SimulationState): Income[] {
    return this.incomes.filter((income) => income.getIsActiveByTimeFrame(simulationState));
  }
}

export class Income {
  static readonly WITHHOLDING_TAX_RATE = 0.2;

  private hasOneTimeIncomeOccurred: boolean;
  private id: string;
  private name: string;
  private amount: number;
  private growthRate: number | undefined;
  private growthLimit: number | undefined;
  private timeFrameStart: TimePoint;
  private timeFrameEnd: TimePoint | undefined;
  private frequency: 'yearly' | 'oneTime' | 'quarterly' | 'monthly' | 'biweekly' | 'weekly';

  constructor(data: IncomeInputs) {
    this.hasOneTimeIncomeOccurred = false;
    this.id = data.id;
    this.name = data.name;
    this.amount = data.amount;
    this.growthRate = data.growth?.growthRate;
    this.growthLimit = data.growth?.growthLimit;
    this.timeFrameStart = data.timeframe.start;
    this.timeFrameEnd = data.timeframe.end;
    this.frequency = data.frequency;
  }

  // TODO: Might be cleaner to convert annual growth rate & growth limit to monthly...
  processMonthlyAmount(inflationRate: number, year: number): IncomeData {
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

    const grossIncome = Math.max((annualAmount / this.getTimesToApplyPerYear()) * this.getTimesToApplyPerMonth(), 0);
    const amountWithheld = grossIncome * Income.WITHHOLDING_TAX_RATE;
    const incomeAfterWithholding = grossIncome - amountWithheld;

    if (this.frequency === 'oneTime') this.hasOneTimeIncomeOccurred = true;
    return { id: this.id, name: this.name, grossIncome, amountWithheld, incomeAfterWithholding };
  }

  getIsActiveByTimeFrame(simulationState: SimulationState): boolean {
    const simTimeIsAfterIncomeStart = this.getIsSimTimeAfterIncomeStart(simulationState);
    const simTimeIsBeforeIncomeEnd = this.getIsSimTimeBeforeIncomeEnd(simulationState);

    return simTimeIsAfterIncomeStart && simTimeIsBeforeIncomeEnd;
  }

  private getIsSimTimeAfterIncomeStart(simulationState: SimulationState): boolean {
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

  private getIsSimTimeBeforeIncomeEnd(simulationState: SimulationState): boolean {
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
        if (this.hasOneTimeIncomeOccurred) return 0;
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
        if (this.hasOneTimeIncomeOccurred) return 0;
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
