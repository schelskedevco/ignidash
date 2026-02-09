/**
 * Simulation phase identification (accumulation vs retirement)
 *
 * Determines the current phase based on the user's retirement strategy:
 * fixed age triggers at a specific age, SWR target triggers when portfolio
 * can sustain expenses at the safe withdrawal rate.
 */

import type { TimelineInputs } from '@/lib/schemas/inputs/timeline-form-schema';

import type { SimulationState } from './simulation-engine';

export type PhaseName = 'accumulation' | 'retirement';

/** Current simulation phase data */
export interface PhaseData {
  name: PhaseName;
}

/** Determines the current simulation phase based on retirement strategy */
export class PhaseIdentifier {
  constructor(
    private simulationState: SimulationState,
    private timeline: TimelineInputs
  ) {}

  /**
   * Evaluates the current simulation phase
   * @returns Phase data indicating accumulation or retirement
   */
  getCurrentPhase(): PhaseData {
    switch (this.timeline.retirementStrategy.type) {
      case 'fixedAge':
        const age = this.simulationState.time.age;

        return { name: age < this.timeline.retirementStrategy.retirementAge ? 'accumulation' : 'retirement' };
      case 'swrTarget':
        const currPhase = this.simulationState.phase;
        if (currPhase?.name === 'retirement') {
          return { ...currPhase };
        }

        const annualExpensesData = this.simulationState.annualData.expenses;
        if (annualExpensesData.length === 0) {
          return { name: 'accumulation' };
        }

        const totalPortfolioValue = this.simulationState.portfolio.getTotalValue();
        const safeWithdrawalRate = this.timeline.retirementStrategy.safeWithdrawalRate / 100;
        const safeWithdrawalAmount = totalPortfolioValue * safeWithdrawalRate;

        const meanAnnualExpenses =
          annualExpensesData.length !== 0
            ? annualExpensesData.reduce((acc, curr) => acc + curr.totalExpenses, 0) / annualExpensesData.length
            : 0;

        const annualDebtsData = this.simulationState.annualData.debts;
        const annualPhysicalAssetsData = this.simulationState.annualData.physicalAssets;

        const meanAnnualDebtPayments =
          (annualDebtsData.length !== 0 ? annualDebtsData.reduce((acc, curr) => acc + curr.totalPayment, 0) / annualDebtsData.length : 0) +
          (annualPhysicalAssetsData.length !== 0
            ? annualPhysicalAssetsData.reduce((acc, curr) => acc + curr.totalLoanPayment, 0) / annualPhysicalAssetsData.length
            : 0);

        return { name: meanAnnualExpenses + meanAnnualDebtPayments < safeWithdrawalAmount ? 'retirement' : 'accumulation' };
    }
  }
}
