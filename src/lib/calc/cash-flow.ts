import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

export interface CashFlow {
  readonly id: string;
  readonly name: string;

  shouldApply(year: number, currentAge: number): boolean;
  calculateChange(year: number, currentAge: number): number;
}

export class AnnualIncome implements CashFlow {
  readonly id = 'annual-income';
  readonly name = 'Annual Income';

  private readonly inputs: QuickPlanInputs;

  constructor(inputs: QuickPlanInputs) {
    this.inputs = inputs;
  }

  shouldApply(year: number, currentAge: number): boolean {
    return true;
  }

  calculateChange(year: number, currentAge: number): number {
    const annualIncome = this.inputs.basics.annualIncome!;

    // Convert nominal growth to real growth
    const { incomeGrowthRate } = this.inputs.growthRates;
    const realIncomeGrowth = (1 + incomeGrowthRate / 100) / (1 + this.inputs.marketAssumptions.inflationRate / 100) - 1;

    // Calculate future income
    return annualIncome * Math.pow(1 + realIncomeGrowth, year);
  }
}

export class AnnualExpenses implements CashFlow {
  readonly id = 'annual-expenses';
  readonly name = 'Annual Expenses';

  private readonly inputs: QuickPlanInputs;

  constructor(inputs: QuickPlanInputs) {
    this.inputs = inputs;
  }

  shouldApply(year: number, currentAge: number): boolean {
    return true;
  }

  calculateChange(year: number, currentAge: number): number {
    const annualExpenses = this.inputs.basics.annualExpenses!;

    // Convert nominal growth to real growth
    const { expenseGrowthRate } = this.inputs.growthRates;
    const realExpenseGrowth = (1 + expenseGrowthRate / 100) / (1 + this.inputs.marketAssumptions.inflationRate / 100) - 1;

    // Calculate future expenses
    const futureExpenses = annualExpenses * Math.pow(1 + realExpenseGrowth, year);

    return -futureExpenses;
  }
}

export class PassiveRetirementIncome implements CashFlow {
  readonly id = 'passive-retirement-income';
  readonly name = 'Passive Retirement Income';

  private readonly inputs: QuickPlanInputs;

  constructor(inputs: QuickPlanInputs) {
    this.inputs = inputs;
  }

  shouldApply(year: number, currentAge: number): boolean {
    return currentAge >= 62;
  }

  calculateChange(year: number, currentAge: number): number {
    const { retirementIncome, effectiveTaxRate } = this.inputs.retirementFunding;
    return retirementIncome * (1 - effectiveTaxRate / 100);
  }
}

export class RetirementExpenses implements CashFlow {
  readonly id = 'retirement-expenses';
  readonly name = 'Retirement Expenses';

  private readonly inputs: QuickPlanInputs;

  constructor(inputs: QuickPlanInputs) {
    this.inputs = inputs;
  }

  shouldApply(year: number, currentAge: number): boolean {
    return true;
  }

  calculateChange(year: number, currentAge: number): number {
    const { retirementExpenses } = this.inputs.goals;
    return retirementExpenses!;
  }
}
