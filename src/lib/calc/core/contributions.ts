import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

// Helper function to calculate yearly contribution (income - expenses) for a given year
export const calculateYearlyContribution = (inputs: QuickPlanInputs, year: number): number | null => {
  const { annualIncome, annualExpenses } = inputs.basics;
  if (annualIncome === null || annualExpenses === null) {
    console.warn('Cannot calculate yearly contribution: annual income and expenses are required');
    return null;
  }

  const { incomeGrowthRate, expenseGrowthRate } = inputs.growthRates;

  // Convert nominal rates to real rates
  // Real growth = (1 + nominal) / (1 + inflation) - 1
  const realIncomeGrowth = (1 + incomeGrowthRate / 100) / (1 + inputs.marketAssumptions.inflationRate / 100) - 1;
  const realExpenseGrowth = (1 + expenseGrowthRate / 100) / (1 + inputs.marketAssumptions.inflationRate / 100) - 1;

  // Calculate future values using the appropriate growth rates
  const futureIncome = annualIncome * Math.pow(1 + realIncomeGrowth, year);
  const futureExpenses = annualExpenses * Math.pow(1 + realExpenseGrowth, year);

  return futureIncome - futureExpenses;
};

// Helper function to calculate retirement withdrawal and surplus for a given age
export const calculateRetirementCashFlow = (
  retirementExpenses: number,
  retirementIncome: number,
  effectiveTaxRate: number,
  currentAge: number
): { grossWithdrawal: number; surplus: number } => {
  // Only apply retirement income if age 62 or older
  const applicableRetirementIncome = currentAge >= 62 ? retirementIncome : 0;

  // Calculate net passive income (after taxes)
  const netPassiveIncome = applicableRetirementIncome * (1 - effectiveTaxRate / 100);

  // Calculate after-tax shortfall that needs to be covered by withdrawals
  const afterTaxShortfall = retirementExpenses - netPassiveIncome;

  // If passive income covers all expenses, no withdrawal needed
  let grossWithdrawal = 0;
  let surplus = 0;

  if (afterTaxShortfall > 0) {
    // Calculate gross withdrawal needed (includes taxes on the withdrawal)
    grossWithdrawal = afterTaxShortfall / (1 - effectiveTaxRate / 100);
  } else {
    // Passive income exceeds expenses, calculate surplus
    surplus = Math.abs(afterTaxShortfall);
  }

  return { grossWithdrawal, surplus };
};
