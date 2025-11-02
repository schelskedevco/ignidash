import type { TimelineInputs } from '@/lib/schemas/timeline-form-schema';

import type { SimulationState } from './simulation-engine';

export type PhaseName = 'accumulation' | 'retirement';

export interface PhaseData {
  name: PhaseName;
}

export class PhaseIdentifier {
  constructor(
    private simulationState: SimulationState,
    private timeline: TimelineInputs
  ) {}

  getCurrentPhase(): PhaseData {
    switch (this.timeline.retirementStrategy.type) {
      case 'fixedAge':
        const yearsFromNow = this.getYearsFromNow(this.simulationState.time.date);
        const age = this.timeline.currentAge + yearsFromNow;

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

        return meanAnnualExpenses < safeWithdrawalAmount ? { name: 'retirement' } : { name: 'accumulation' };
    }
  }

  private getYearsFromNow(date: Date): number {
    const now = new Date();

    const diffInMs = Math.abs(date.getTime() - now.getTime());
    const msPerYear = 365.25 * 24 * 60 * 60 * 1000;
    const years = diffInMs / msPerYear;

    return Math.round(years * 1000) / 1000;
  }
}
