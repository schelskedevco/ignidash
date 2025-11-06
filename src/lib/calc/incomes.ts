import type { IncomeInputs, IncomeType } from '@/lib/schemas/inputs/income-form-schema';
import type { TimePoint } from '@/lib/schemas/inputs/income-expenses-shared-schemas';

import type { SimulationState } from './simulation-engine';

export class IncomesProcessor {
  private monthlyData: IncomesData[] = [];

  constructor(
    private simulationState: SimulationState,
    private incomes: Incomes
  ) {}

  process(): IncomesData {
    const activeIncomes = this.incomes.getActiveIncomesByTimeFrame(this.simulationState);

    const processedIncomes = activeIncomes.map((income) => income.processMonthlyAmount(this.simulationState.time.year));

    const totals = processedIncomes.reduce(
      (acc, curr) => {
        acc.totalGrossIncome += curr.grossIncome;
        acc.totalAmountWithheld += curr.amountWithheld;
        acc.totalFicaTax += curr.ficaTax;
        acc.totalIncomeAfterPayrollDeductions += curr.incomeAfterPayrollDeductions;
        return acc;
      },
      {
        totalGrossIncome: 0,
        totalAmountWithheld: 0,
        totalFicaTax: 0,
        totalIncomeAfterPayrollDeductions: 0,
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
        acc.totalFicaTax += curr.totalFicaTax;
        acc.totalIncomeAfterPayrollDeductions += curr.totalIncomeAfterPayrollDeductions;

        Object.entries(curr.perIncomeData).forEach(([incomeID, incomeData]) => {
          acc.perIncomeData[incomeID] = {
            ...incomeData,
            grossIncome: (acc.perIncomeData[incomeID]?.grossIncome ?? 0) + incomeData.grossIncome,
            amountWithheld: (acc.perIncomeData[incomeID]?.amountWithheld ?? 0) + incomeData.amountWithheld,
            ficaTax: (acc.perIncomeData[incomeID]?.ficaTax ?? 0) + incomeData.ficaTax,
            incomeAfterPayrollDeductions:
              (acc.perIncomeData[incomeID]?.incomeAfterPayrollDeductions ?? 0) + incomeData.incomeAfterPayrollDeductions,
          };
        });

        return acc;
      },
      { totalGrossIncome: 0, totalAmountWithheld: 0, totalFicaTax: 0, totalIncomeAfterPayrollDeductions: 0, perIncomeData: {} }
    );
  }
}

export interface IncomesData {
  totalGrossIncome: number;
  totalAmountWithheld: number;
  totalFicaTax: number;
  totalIncomeAfterPayrollDeductions: number;
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
  ficaTax: number;
  incomeAfterPayrollDeductions: number;
}

export class Income {
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
  private incomeType: IncomeType;
  private withholdingRate: number;

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
    this.incomeType = data.taxes.incomeType;
    this.withholdingRate = data.taxes.withholding ?? 0;
  }

  processMonthlyAmount(year: number): IncomeData {
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

    if (timesToApplyPerYear === 0) {
      return { id: this.id, name: this.name, grossIncome: 0, amountWithheld: 0, ficaTax: 0, incomeAfterPayrollDeductions: 0 };
    }

    const grossIncome = Math.max((annualAmount / timesToApplyPerYear) * timesToApplyPerMonth, 0);
    const amountWithheld = grossIncome * (this.withholdingRate / 100);

    let ficaTax: number = 0;
    switch (this.incomeType) {
      case 'wage':
        ficaTax = grossIncome * 0.0765;
        break;
      default:
        break;
    }

    const incomeAfterPayrollDeductions = grossIncome - amountWithheld - ficaTax;

    if (this.frequency === 'oneTime') this.hasOneTimeIncomeOccurred = true;
    return { id: this.id, name: this.name, grossIncome, amountWithheld, ficaTax, incomeAfterPayrollDeductions };
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
