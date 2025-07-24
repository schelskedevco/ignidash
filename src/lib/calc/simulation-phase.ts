import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

import { Portfolio } from './portfolio';
import { CashFlow } from './cash-flow';

interface SimulationPhase {
  getCashFlow(year: number, portfolio: Portfolio, inputs: QuickPlanInputs): CashFlow;
  shouldTransition(year: number, portfolio: Portfolio, inputs: QuickPlanInputs): boolean;
  getNextPhase(inputs: QuickPlanInputs): SimulationPhase | null;
  getName(): string;
}

export class AccumulationPhase implements SimulationPhase {
  getCashFlow(_year: number, _portfolio: Portfolio, _inputs: QuickPlanInputs): CashFlow {
    throw new Error('getCashFlow not implemented for AccumulationPhase');
  }

  shouldTransition(_year: number, _portfolio: Portfolio, _inputs: QuickPlanInputs): boolean {
    throw new Error('shouldTransition not implemented for AccumulationPhase');
  }

  getNextPhase(_inputs: QuickPlanInputs): SimulationPhase | null {
    throw new Error('getNextPhase not implemented for AccumulationPhase');
  }

  getName(): string {
    return 'Accumulation Phase';
  }
}

export class RetirementPhase implements SimulationPhase {
  getCashFlow(_year: number, _portfolio: Portfolio, _inputs: QuickPlanInputs): CashFlow {
    throw new Error('getCashFlow not implemented for RetirementPhase');
  }

  shouldTransition(_year: number, _portfolio: Portfolio, _inputs: QuickPlanInputs): boolean {
    throw new Error('shouldTransition not implemented for RetirementPhase');
  }

  getNextPhase(_inputs: QuickPlanInputs): SimulationPhase | null {
    throw new Error('getNextPhase not implemented for RetirementPhase');
  }

  getName(): string {
    return 'Retirement Phase';
  }
}
