import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

import { Portfolio } from './portfolio';
import { CashFlow } from './cash-flow';

export interface SimulationPhase {
  getCashFlows(inputs: QuickPlanInputs): CashFlow[];
  shouldTransition(year: number, portfolio: Portfolio, inputs: QuickPlanInputs): boolean;
  getNextPhase(inputs: QuickPlanInputs): SimulationPhase | null;
  getName(): string;
  processYear(year: number, portfolio: Portfolio, inputs: QuickPlanInputs): Portfolio;
}

export class AccumulationPhase implements SimulationPhase {
  getCashFlows(_inputs: QuickPlanInputs): CashFlow[] {
    throw new Error('getCashFlows not implemented for AccumulationPhase');
  }

  shouldTransition(_year: number, _portfolio: Portfolio, _inputs: QuickPlanInputs): boolean {
    throw new Error('shouldTransition not implemented for AccumulationPhase');
  }

  getNextPhase(_inputs: QuickPlanInputs): SimulationPhase | null {
    return new RetirementPhase();
  }

  getName(): string {
    return 'Accumulation Phase';
  }

  processYear(_year: number, _portfolio: Portfolio, _inputs: QuickPlanInputs): Portfolio {
    throw new Error('processYear not implemented for AccumulationPhase');
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
