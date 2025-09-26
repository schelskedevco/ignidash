import type { SimulationDataPoint } from '@/lib/calc/v2/simulation-engine';

export interface MilestoneData {
  yearsToRetirement: number | null;
  retirementAge: number | null;
  yearsToBankruptcy: number | null;
  bankruptcyAge: number | null;
}

export interface AverageReturnsData {
  averageStockReturn: number | null;
  averageBondReturn: number | null;
  averageCashReturn: number | null;
  averageInflationRate: number | null;
}

export class SimulationDataExtractor {
  static getMilestonesData(data: SimulationDataPoint[], startAge: number): MilestoneData {
    let yearsToRetirement: number | null = null;
    let retirementAge: number | null = null;
    let yearsToBankruptcy: number | null = null;
    let bankruptcyAge: number | null = null;

    for (const dp of data) {
      const phase = dp.phase;
      if (phase?.name === 'retirement' && retirementAge === null) {
        const retirementDate = new Date(dp.date);

        yearsToRetirement = retirementDate.getFullYear() - new Date().getFullYear();
        retirementAge = startAge + yearsToRetirement;
      }

      if (dp.portfolio.totalValue <= 0.1 && bankruptcyAge === null) {
        const bankruptcyDate = new Date(dp.date);

        yearsToBankruptcy = bankruptcyDate.getFullYear() - new Date().getFullYear();
        bankruptcyAge = startAge + yearsToBankruptcy;
      }
    }

    return { yearsToRetirement, retirementAge, yearsToBankruptcy, bankruptcyAge };
  }

  static getAverageReturns(data: SimulationDataPoint[]) {
    const { stocks, bonds, cash, inflation, count } = data.slice(1).reduce(
      (acc, dp) => {
        const returnsData = dp.returns!;
        return {
          stocks: acc.stocks + returnsData.annualReturnRates.stocks,
          bonds: acc.bonds + returnsData.annualReturnRates.bonds,
          cash: acc.cash + returnsData.annualReturnRates.cash,
          inflation: acc.inflation + returnsData.annualInflationRate,
          count: acc.count + 1,
        };
      },
      { stocks: 0, bonds: 0, cash: 0, inflation: 0, count: 0 }
    );

    const averageStockReturn = count > 0 ? stocks / count : null;
    const averageBondReturn = count > 0 ? bonds / count : null;
    const averageCashReturn = count > 0 ? cash / count : null;
    const averageInflationRate = count > 0 ? inflation / count : null;

    return { averageStockReturn, averageBondReturn, averageCashReturn, averageInflationRate };
  }
}
