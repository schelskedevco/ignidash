/**
 * Income processing for the simulation engine
 *
 * Handles multiple income sources with varying frequencies, time frames,
 * growth rates, and tax treatments (wage, exempt, Social Security, pension,
 * self-employment). Processes FICA tax (SS wage base capped, Additional
 * Medicare Tax) and withholding at the income level.
 */

import type { IncomeInputs, IncomeType } from '@/lib/schemas/inputs/income-form-schema';
import type { TimePoint } from '@/lib/schemas/inputs/income-expenses-shared-schemas';

import type { SimulationState } from './simulation-engine';
import {
  SS_WAGE_BASE,
  ADDITIONAL_MEDICARE_THRESHOLDS,
  SOCIAL_SECURITY_TAX_RATE,
  MEDICARE_TAX_RATE,
  ADDITIONAL_MEDICARE_TAX_RATE,
  SE_SOCIAL_SECURITY_TAX_RATE,
  SE_MEDICARE_TAX_RATE,
  SE_DEDUCTION_RATIO,
} from './tax-data/fica-params';

/** Processes all active incomes each month and aggregates annual totals */
export class IncomesProcessor {
  private monthlyData: IncomesData[] = [];

  constructor(
    private simulationState: SimulationState,
    private incomes: Incomes
  ) {}

  /**
   * Processes all active incomes for the current month
   * @returns Aggregated income data with per-income breakdowns
   */
  process(): IncomesData {
    const activeIncomes = this.incomes.getActiveIncomesByTimeFrame(this.simulationState);

    const processedIncomes = activeIncomes.map((income) => income.processMonthlyAmount(this.simulationState.time.year));

    const totals = processedIncomes.reduce(
      (acc, curr) => {
        acc.totalIncome += curr.income;
        acc.totalAmountWithheld += curr.amountWithheld;
        acc.totalFicaTax += curr.ficaTax;
        acc.totalIncomeAfterPayrollDeductions += curr.incomeAfterPayrollDeductions;
        acc.totalTaxFreeIncome += curr.taxFreeIncome;
        acc.totalSocialSecurityIncome += curr.socialSecurityIncome;
        acc.totalAdditionalMedicareTax += curr.additionalMedicareTax;
        return acc;
      },
      {
        totalIncome: 0,
        totalAmountWithheld: 0,
        totalFicaTax: 0,
        totalIncomeAfterPayrollDeductions: 0,
        totalTaxFreeIncome: 0,
        totalSocialSecurityIncome: 0,
        totalAdditionalMedicareTax: 0,
      }
    );
    const perIncomeData = Object.fromEntries(processedIncomes.map((income) => [income.id, income]));

    const result = { ...totals, perIncomeData, conversionIncome: 0 };

    this.monthlyData.push(result);
    return result;
  }

  resetMonthlyData(): void {
    this.monthlyData = [];
  }

  getAnnualData(): IncomesData {
    return this.monthlyData.reduce(
      (acc, curr) => {
        acc.totalIncome += curr.totalIncome;
        acc.totalAmountWithheld += curr.totalAmountWithheld;
        acc.totalFicaTax += curr.totalFicaTax;
        acc.totalIncomeAfterPayrollDeductions += curr.totalIncomeAfterPayrollDeductions;
        acc.totalTaxFreeIncome += curr.totalTaxFreeIncome;
        acc.totalSocialSecurityIncome += curr.totalSocialSecurityIncome;
        acc.totalAdditionalMedicareTax += curr.totalAdditionalMedicareTax;
        acc.conversionIncome += curr.conversionIncome;

        for (const [incomeID, incomeData] of Object.entries(curr.perIncomeData)) {
          const existing = acc.perIncomeData[incomeID];
          acc.perIncomeData[incomeID] = {
            ...incomeData,
            income: (existing?.income ?? 0) + incomeData.income,
            amountWithheld: (existing?.amountWithheld ?? 0) + incomeData.amountWithheld,
            ficaTax: (existing?.ficaTax ?? 0) + incomeData.ficaTax,
            incomeAfterPayrollDeductions: (existing?.incomeAfterPayrollDeductions ?? 0) + incomeData.incomeAfterPayrollDeductions,
            taxFreeIncome: (existing?.taxFreeIncome ?? 0) + incomeData.taxFreeIncome,
            socialSecurityIncome: (existing?.socialSecurityIncome ?? 0) + incomeData.socialSecurityIncome,
            additionalMedicareTax: (existing?.additionalMedicareTax ?? 0) + incomeData.additionalMedicareTax,
          };
        }

        return acc;
      },
      {
        totalIncome: 0,
        totalAmountWithheld: 0,
        totalFicaTax: 0,
        totalIncomeAfterPayrollDeductions: 0,
        totalTaxFreeIncome: 0,
        totalSocialSecurityIncome: 0,
        totalAdditionalMedicareTax: 0,
        conversionIncome: 0,
        perIncomeData: {},
      } satisfies IncomesData
    );
  }
}

export interface IncomesData {
  totalIncome: number;
  totalAmountWithheld: number;
  totalFicaTax: number;
  totalIncomeAfterPayrollDeductions: number;
  totalTaxFreeIncome: number;
  totalSocialSecurityIncome: number;
  totalAdditionalMedicareTax: number;
  conversionIncome: number;
  perIncomeData: Record<string, IncomeData>;
}

/** Collection of income sources that filters by active time frame */
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
  income: number;
  amountWithheld: number;
  ficaTax: number;
  incomeAfterPayrollDeductions: number;
  taxFreeIncome: number;
  socialSecurityIncome: number;
  additionalMedicareTax: number;
}

/** A single income source with frequency, growth, time frame, and tax treatment */
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
  /** Year-to-date wages for SS wage base cap and Additional Medicare Tax tracking */
  private ytdWages: number = 0;
  private lastFicaYear: number = -1;

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

  /**
   * Calculates this income's monthly amount with growth, withholding, and FICA
   * @param year - Current simulation year (fractional)
   * @returns Income data including gross, withholding, and FICA amounts
   */
  processMonthlyAmount(year: number): IncomeData {
    // Reset YTD FICA tracking when a new year starts
    const currentYear = Math.floor(year);
    if (this.lastFicaYear !== currentYear) {
      this.ytdWages = 0;
      this.lastFicaYear = currentYear;
    }

    const rawAmount = this.amount;

    const timesToApplyPerYear = this.getTimesToApplyPerYear();
    const timesToApplyPerMonth = this.getTimesToApplyPerMonth();

    let annualAmount = rawAmount * timesToApplyPerYear;

    if (this.lastYear !== currentYear) {
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

      this.lastYear = currentYear;
    }

    if (timesToApplyPerYear === 0) {
      return {
        id: this.id,
        name: this.name,
        income: 0,
        amountWithheld: 0,
        ficaTax: 0,
        incomeAfterPayrollDeductions: 0,
        taxFreeIncome: 0,
        socialSecurityIncome: 0,
        additionalMedicareTax: 0,
      };
    }

    const income = Math.max((annualAmount / timesToApplyPerYear) * timesToApplyPerMonth, 0);

    let amountWithheld: number = 0;
    let ficaTax: number = 0;
    let taxFreeIncome: number = 0;
    let socialSecurityIncome: number = 0;
    let additionalMedicareTax: number = 0;
    switch (this.incomeType) {
      case 'wage': {
        amountWithheld = income * (this.withholdingRate / 100);

        // Social Security wage base cap (6.2% up to SS_WAGE_BASE)
        const remainingSSWageBase = Math.max(0, SS_WAGE_BASE[2026] - this.ytdWages);
        const ssTaxableIncome = Math.min(income, remainingSSWageBase);
        const ssTax = ssTaxableIncome * SOCIAL_SECURITY_TAX_RATE;

        // Medicare tax (1.45%, no cap)
        const medicareTax = income * MEDICARE_TAX_RATE;

        // Additional Medicare Tax (0.9% on wages above threshold)
        const cumulativeBeforeThisMonth = this.ytdWages;
        const threshold = ADDITIONAL_MEDICARE_THRESHOLDS.single;
        if (cumulativeBeforeThisMonth + income > threshold) {
          const additionalMedicareIncome = Math.max(0, cumulativeBeforeThisMonth + income - threshold);
          additionalMedicareTax = additionalMedicareIncome * ADDITIONAL_MEDICARE_TAX_RATE;
        }

        this.ytdWages += income;
        ficaTax = ssTax + medicareTax;
        break;
      }
      case 'selfEmployment': {
        // Self-employment tax: 15.3% on 92.35% of net earnings
        const seNetEarnings = income * SE_DEDUCTION_RATIO;
        ficaTax = seNetEarnings * (SE_SOCIAL_SECURITY_TAX_RATE + SE_MEDICARE_TAX_RATE);
        amountWithheld = income * (this.withholdingRate / 100);
        break;
      }
      case 'pension': {
        amountWithheld = income * (this.withholdingRate / 100);
        break;
      }
      case 'exempt':
        taxFreeIncome = income;
        break;
      case 'socialSecurity':
        amountWithheld = income * (this.withholdingRate / 100);
        socialSecurityIncome = income;
        break;
      default:
        break;
    }

    const incomeAfterPayrollDeductions = income - amountWithheld - ficaTax;

    if (this.frequency === 'oneTime') this.hasOneTimeIncomeOccurred = true;
    return {
      id: this.id,
      name: this.name,
      income,
      amountWithheld,
      ficaTax,
      incomeAfterPayrollDeductions,
      taxFreeIncome,
      socialSecurityIncome,
      additionalMedicareTax,
    };
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
