import type { IncomeInputs } from '@/lib/schemas/income-form-schema';
import type { TimePoint } from '@/lib/schemas/income-expenses-shared-schemas';

import type { ReturnsData } from './returns';
import type { SimulationState } from './simulation-engine';

export class IncomesProcessor {
  private monthlyData: IncomesData[] = [];

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

    const result = { ...totals, perIncomeData };

    this.monthlyData.push(result);
    return result;
  }

  resetMonthlyData(): void {
    this.monthlyData = [];
  }

  getAnnualData(): IncomesData {
    return this.monthlyData.reduce(
      (acc, curr) => {
        acc.totalGrossIncome += curr.totalGrossIncome;
        acc.totalAmountWithheld += curr.totalAmountWithheld;
        acc.totalIncomeAfterWithholding += curr.totalIncomeAfterWithholding;

        Object.entries(curr.perIncomeData).forEach(([incomeID, incomeData]) => {
          acc.perIncomeData[incomeID] = {
            ...incomeData,
            grossIncome: (acc.perIncomeData[incomeID]?.grossIncome ?? 0) + incomeData.grossIncome,
            amountWithheld: (acc.perIncomeData[incomeID]?.amountWithheld ?? 0) + incomeData.amountWithheld,
            incomeAfterWithholding: (acc.perIncomeData[incomeID]?.incomeAfterWithholding ?? 0) + incomeData.incomeAfterWithholding,
          };
        });

        return acc;
      },
      { totalGrossIncome: 0, totalAmountWithheld: 0, totalIncomeAfterWithholding: 0, perIncomeData: {} }
    );
  }
}

export interface IncomesData {
  totalGrossIncome: number;
  totalAmountWithheld: number;
  totalIncomeAfterWithholding: number;
  perIncomeData: Record<string, IncomeData>;
}

export class Incomes {
  private readonly incomes: Income[];

  constructor(data: IncomeInputs[]) {
    this.incomes = data.filter((income) => !income.disabled).map((income) => new Income(income));
  }

  getActiveIncomesByTimeFrame(simulationState: SimulationState): Income[] {
    return this.incomes.filter((income) => income.getIsActiveByTimeFrame(simulationState));
  }
}

export interface IncomeData {
  id: string;
  name: string;
  grossIncome: number;
  amountWithheld: number;
  incomeAfterWithholding: number;
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
  private lastYear: number = 0;

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

  processMonthlyAmount(inflationRate: number, year: number): IncomeData {
    const rawAmount = this.amount;

    const timesToApplyPerYear = this.getTimesToApplyPerYear();
    const timesToApplyPerMonth = this.getTimesToApplyPerMonth();

    let annualAmount = rawAmount * timesToApplyPerYear;

    if (this.lastYear !== Math.floor(year)) {
      if (this.growthRate) {
        const realGrowthRate = this.growthRate / 100;
        annualAmount *= 1 + realGrowthRate;

        const growthLimit = this.growthLimit;
        if (growthLimit !== undefined && realGrowthRate > 0) {
          annualAmount = Math.min(annualAmount, growthLimit);
        } else if (growthLimit !== undefined && realGrowthRate < 0) {
          annualAmount = Math.max(annualAmount, growthLimit);
        }

        if (timesToApplyPerYear !== 0) this.amount = Math.max(annualAmount / timesToApplyPerYear, 0);
      }

      this.lastYear = Math.floor(year);
    }

    if (timesToApplyPerYear === 0) return { id: this.id, name: this.name, grossIncome: 0, amountWithheld: 0, incomeAfterWithholding: 0 };

    const grossIncome = Math.max((annualAmount / timesToApplyPerYear) * timesToApplyPerMonth, 0);
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
        return simulationState.phase?.name === 'retirement';
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
