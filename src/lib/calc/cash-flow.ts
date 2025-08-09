/**
 * Cash Flow Components - Financial Planning Cash Flow Calculations
 *
 * This module provides a pluggable cash flow calculation system for financial planning scenarios.
 * It implements a strategy pattern where different cash flow components (income, expenses, retirement income)
 * can be calculated independently and combined to model comprehensive financial projections.
 *
 * Architecture:
 * - CashFlow interface for consistent calculation strategy
 * - Year-based calculations with age-dependent logic
 * - Real vs. nominal growth rate conversions using Fisher equation
 * - Modular components for income, expenses, and retirement scenarios
 *
 * Key Features:
 * - Age-dependent cash flow activation (e.g., retirement income at 62+)
 * - Inflation-adjusted real growth calculations
 * - Flexible component system for different financial scenarios
 * - Tax-adjusted retirement income calculations
 */

import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

/**
 * Cash flow calculation interface
 * Defines the contract for all cash flow components in the financial model
 */
export interface CashFlow {
  readonly id: string;
  readonly name: string;

  /**
   * Determines if this cash flow component should be applied for a given year/age
   * @param year - Years from current year (0 = current year)
   * @param currentAge - User's age in the given year
   * @returns True if cash flow should be applied
   */
  shouldApply(year: number, currentAge: number): boolean;

  /**
   * Calculates the cash flow change for a given year/age
   * @param year - Years from current year (0 = current year)
   * @param currentAge - User's age in the given year
   * @returns Cash flow amount (positive for income, negative for expenses)
   */
  calculateAmount(year: number, currentAge: number): number;
}

/**
 * Annual Income Cash Flow Component
 * Calculates projected annual income with inflation-adjusted growth
 * Applied for all years during working life
 */
export class AnnualIncome implements CashFlow {
  readonly id = 'annual-income';
  readonly name = 'Income';

  private readonly inputs: QuickPlanInputs;

  constructor(inputs: QuickPlanInputs) {
    this.inputs = inputs;
  }

  shouldApply(year: number, currentAge: number): boolean {
    return true;
  }

  calculateAmount(year: number, currentAge: number): number {
    const annualIncome = this.inputs.basics.annualIncome!;

    // Convert nominal growth to real growth
    const incomeGrowthRate = this.inputs.growthRates.incomeGrowthRate;
    const realIncomeGrowth = (1 + incomeGrowthRate / 100) / (1 + this.inputs.marketAssumptions.inflationRate / 100) - 1;

    // Calculate future income
    return annualIncome * Math.pow(1 + realIncomeGrowth, year);
  }
}

/**
 * Annual Expenses Cash Flow Component
 * Calculates projected annual expenses with inflation-adjusted growth
 * Applied for all years throughout the projection period
 */
export class AnnualExpenses implements CashFlow {
  readonly id = 'annual-expenses';
  readonly name = 'Expenses';

  private readonly inputs: QuickPlanInputs;

  constructor(inputs: QuickPlanInputs) {
    this.inputs = inputs;
  }

  shouldApply(year: number, currentAge: number): boolean {
    return true;
  }

  calculateAmount(year: number, currentAge: number): number {
    const annualExpenses = this.inputs.basics.annualExpenses!;

    // Convert nominal growth to real growth
    const expenseGrowthRate = this.inputs.growthRates.expenseGrowthRate;
    const realExpenseGrowth = (1 + expenseGrowthRate / 100) / (1 + this.inputs.marketAssumptions.inflationRate / 100) - 1;

    // Calculate future expenses
    return -annualExpenses * Math.pow(1 + realExpenseGrowth, year);
  }
}

/**
 * Passive Retirement Income Cash Flow Component
 * Calculates after-tax passive income (Social Security, pensions) starting at age 62
 * Applied only during retirement years with tax adjustments
 */
export class PassiveRetirementIncome implements CashFlow {
  readonly id = 'passive-retirement-income';
  readonly name = 'Passive Income';

  private readonly inputs: QuickPlanInputs;

  constructor(inputs: QuickPlanInputs) {
    this.inputs = inputs;
  }

  shouldApply(year: number, currentAge: number): boolean {
    return currentAge >= 62;
  }

  calculateAmount(year: number, currentAge: number): number {
    const { retirementIncome, effectiveTaxRate } = this.inputs.retirementFunding;
    return retirementIncome * (1 - effectiveTaxRate / 100);
  }
}

/**
 * Retirement Expenses Cash Flow Component
 * Calculates projected retirement living expenses
 * Applied for all years (represents target retirement spending level)
 */
export class RetirementExpenses implements CashFlow {
  readonly id = 'retirement-expenses';
  readonly name = 'Expenses';

  private readonly inputs: QuickPlanInputs;

  constructor(inputs: QuickPlanInputs) {
    this.inputs = inputs;
  }

  shouldApply(year: number, currentAge: number): boolean {
    return true;
  }

  calculateAmount(year: number, currentAge: number): number {
    return -this.inputs.goals.retirementExpenses!;
  }
}
