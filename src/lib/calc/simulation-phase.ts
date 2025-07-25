import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

import { Portfolio } from './portfolio';
import { CashFlow, AnnualIncome, AnnualExpenses } from './cash-flow';

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
      return portfolio.addContribution(totalCashFlow, {
        stocks: inputs.allocation.stockAllocation,
        bonds: inputs.allocation.bondAllocation,
        cash: inputs.allocation.cashAllocation,
      });
    } else if (totalCashFlow < 0) {
      // Deficit - withdraw from portfolio (cash → bonds → stocks)
      return portfolio.withdraw(Math.abs(totalCashFlow));
    }

    return portfolio; // No net change
  }
}

export class RetirementPhase implements SimulationPhase {
  getCashFlows(_inputs: QuickPlanInputs): CashFlow[] {
    throw new Error('getCashFlows not implemented for RetirementPhase');
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

  processYear(_year: number, _portfolio: Portfolio, _inputs: QuickPlanInputs): Portfolio {
    throw new Error('processYear not implemented for RetirementPhase');
  }
}
