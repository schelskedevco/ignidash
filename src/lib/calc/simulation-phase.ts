import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

import { Portfolio } from './portfolio';
import { CashFlow, AnnualIncome, AnnualExpenses, PassiveRetirementIncome, RetirementExpenses } from './cash-flow';

export interface SimulationPhase {
  getCashFlows(inputs: QuickPlanInputs): CashFlow[];
  shouldTransition(year: number, portfolio: Portfolio, inputs: QuickPlanInputs): boolean;
  getNextPhase(inputs: QuickPlanInputs): SimulationPhase | null;
  getName(): string;
  processYear(year: number, portfolio: Portfolio, inputs: QuickPlanInputs): Portfolio;
}

export class AccumulationPhase implements SimulationPhase {
  getCashFlows(_inputs: QuickPlanInputs): CashFlow[] {
    return [new AnnualIncome(), new AnnualExpenses()];
  }

  shouldTransition(_year: number, portfolio: Portfolio, inputs: QuickPlanInputs): boolean {
    const retirementExpenses = inputs.goals.retirementExpenses!;
    const { safeWithdrawalRate, effectiveTaxRate } = inputs.retirementFunding;

    const grossWithdrawal = retirementExpenses / (1 - effectiveTaxRate / 100);
    const requiredPortfolio = grossWithdrawal / (safeWithdrawalRate / 100);

    return portfolio.getTotalValue() >= requiredPortfolio;
  }

  getNextPhase(_inputs: QuickPlanInputs): SimulationPhase | null {
    return new RetirementPhase();
  }

  getName(): string {
    return 'Accumulation Phase';
  }

  processYear(year: number, portfolio: Portfolio, inputs: QuickPlanInputs): Portfolio {
    const currentAge = inputs.basics.currentAge! + year;
    let totalCashFlow = 0;

    // Calculate net cash flow from all income/expense events
    for (const cashFlow of this.getCashFlows(inputs)) {
      if (cashFlow.shouldApply(year, currentAge, inputs)) {
        totalCashFlow += cashFlow.calculateChange(year, currentAge, inputs);
      }
    }

    // Apply net cash flow to portfolio
    if (totalCashFlow > 0) {
      // Surplus - contribute to portfolio (using target allocation)
      return portfolio.withContribution(totalCashFlow, {
        stocks: inputs.allocation.stockAllocation,
        bonds: inputs.allocation.bondAllocation,
        cash: inputs.allocation.cashAllocation,
      });
    } else if (totalCashFlow < 0) {
      // Deficit - withdraw from portfolio (cash → bonds → stocks)
      return portfolio.withWithdrawal(Math.abs(totalCashFlow));
    }

    return portfolio; // No net change
  }
}

export class RetirementPhase implements SimulationPhase {
  getCashFlows(_inputs: QuickPlanInputs): CashFlow[] {
    return [new PassiveRetirementIncome(), new RetirementExpenses()];
  }

  shouldTransition(_year: number, _portfolio: Portfolio, _inputs: QuickPlanInputs): boolean {
    return false;
  }

  getNextPhase(_inputs: QuickPlanInputs): SimulationPhase | null {
    return null;
  }

  getName(): string {
    return 'Retirement Phase';
  }

  processYear(year: number, portfolio: Portfolio, inputs: QuickPlanInputs): Portfolio {
    const currentAge = inputs.basics.currentAge! + year;
    let totalCashFlow = 0;

    // Calculate net cash flow from income and expenses
    for (const cashFlow of this.getCashFlows(inputs)) {
      if (cashFlow.shouldApply(year, currentAge, inputs)) {
        totalCashFlow += cashFlow.calculateChange(year, currentAge, inputs);
      }
    }

    if (totalCashFlow >= 0) {
      return portfolio.withContribution(totalCashFlow, {
        stocks: inputs.allocation.stockAllocation,
        bonds: inputs.allocation.bondAllocation,
        cash: inputs.allocation.cashAllocation,
      });
    }

    // Need to withdraw to cover shortfall
    const shortfall = Math.abs(totalCashFlow);
    const effectiveTaxRate = inputs.retirementFunding.effectiveTaxRate;
    const grossWithdrawal = shortfall / (1 - effectiveTaxRate / 100);

    return portfolio.withWithdrawal(grossWithdrawal);
  }
}
