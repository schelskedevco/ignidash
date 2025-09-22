import type { SimulationDataPoint, MultiSimulationResult, SimulationResult } from './simulation-engine';
import type { PortfolioData } from './portfolio';
import type { IncomesData } from './incomes';
import type { ExpensesData } from './expenses';
import type { PhaseData } from './phase';
import type { TaxesData } from './taxes';
import type { ReturnsData } from './returns';

export interface Stats {
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number | null;
}

export interface Percentiles<T> {
  p10: T;
  p25: T;
  p50: T;
  p75: T;
  p90: T;
}

export interface MultiSimulationAnalysis {
  success: number;
  p10Result: SimulationResult;
  p25Result: SimulationResult;
  p50Result: SimulationResult;
  p75Result: SimulationResult;
  p90Result: SimulationResult;
}

export class MultiSimulationAnalyzer {
  // portfolio: PortfolioData;
  // incomes: IncomesData | null;
  // expenses: ExpensesData | null;
  // phase: PhaseData | null;
  // taxes: TaxesData | null;
  // returns: ReturnsData | null;
  analyze(multiSimulationResult: MultiSimulationResult): MultiSimulationAnalysis {
    const p10DataPoints: Array<SimulationDataPoint> = [];
    const p25DataPoints: Array<SimulationDataPoint> = [];
    const p50DataPoints: Array<SimulationDataPoint> = [];
    const p75DataPoints: Array<SimulationDataPoint> = [];
    const p90DataPoints: Array<SimulationDataPoint> = [];

    const simulations = multiSimulationResult.simulations;

    const numDataPoints = simulations[0][1]?.data.length;
    if (!numDataPoints) throw new Error('No data points in simulations');

    for (let i = 0; i < numDataPoints; i++) {
      const dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }> = [];

      for (const [seed, simResult] of simulations) {
        const dp = simResult.data[i];
        dataPointsForYear.push({ seed, dp });
      }

      const sortedDataPointsForYear = dataPointsForYear.sort((a, b) => a.dp.portfolio.totalValue - b.dp.portfolio.totalValue);
      const percentiles = this.calculatePercentilesFromValues(sortedDataPointsForYear);

      p10DataPoints.push(percentiles.p10.dp);
      p25DataPoints.push(percentiles.p25.dp);
      p50DataPoints.push(percentiles.p50.dp);
      p75DataPoints.push(percentiles.p75.dp);
      p90DataPoints.push(percentiles.p90.dp);
    }

    const context = { ...simulations[0][1].context };

    let successCount = 0;
    for (const [, simResult] of simulations) {
      const finalDp = simResult.data[simResult.data.length - 1];
      if (finalDp.portfolio.totalValue > 0.1 && finalDp.phase?.name === 'retirement') successCount++;
    }

    return {
      success: successCount / simulations.length,
      p10Result: { data: p10DataPoints, context },
      p25Result: { data: p25DataPoints, context },
      p50Result: { data: p50DataPoints, context },
      p75Result: { data: p75DataPoints, context },
      p90Result: { data: p90DataPoints, context },
    };
  }

  private getFieldPercentiles<T>(data: T[], valueExtractor: (item: T) => number): Percentiles<number> {
    const values = data.map(valueExtractor).sort((a, b) => a - b);
    return this.calculatePercentilesFromValues(values);
  }

  private calculatePercentile<T>(sortedValues: T[], percentile: number): T {
    const index = Math.floor((percentile / 100) * sortedValues.length);
    return sortedValues[Math.min(index, sortedValues.length - 1)];
  }

  private calculatePercentilesFromValues<T>(sortedValues: T[]): Percentiles<T> {
    return {
      p10: this.calculatePercentile(sortedValues, 10),
      p25: this.calculatePercentile(sortedValues, 25),
      p50: this.calculatePercentile(sortedValues, 50),
      p75: this.calculatePercentile(sortedValues, 75),
      p90: this.calculatePercentile(sortedValues, 90),
    };
  }

  // export interface PortfolioData {
  //   totalValue: number;
  //   totalWithdrawals: number;
  //   totalContributions: number;
  //   totalRealizedGains: number;
  //   withdrawalsForPeriod: number;
  //   contributionsForPeriod: number;
  //   realizedGainsForPeriod: number;
  //   perAccountData: Record<string, AccountDataWithTransactions>;
  //   assetAllocation: AssetAllocation | null;
  // }

  // export type AssetAllocation = Record<AssetClass, number>;

  // export interface AccountData {
  //   totalValue: number;
  //   totalWithdrawals: number;
  //   totalContributions: number;
  //   totalRealizedGains: number;
  //   name: string;
  //   id: string;
  //   type: AccountInputs['type'];
  //   assetAllocation: AssetAllocation;
  // }

  // export interface AccountDataWithTransactions extends AccountData {
  //   contributionsForPeriod: number;
  //   withdrawalsForPeriod: number;
  //   realizedGainsForPeriod: number;
  // }

  private calculatePortfolioPercentiles(dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>): Percentiles<PortfolioData> {
    const percentiles = {
      totalValue: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.totalValue),
      totalWithdrawals: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.totalWithdrawals),
      totalContributions: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.totalContributions),
      totalRealizedGains: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.totalRealizedGains),
      withdrawalsForPeriod: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.withdrawalsForPeriod),
      contributionsForPeriod: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.contributionsForPeriod),
      realizedGainsForPeriod: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.realizedGainsForPeriod),
    };

    const buildPercentileData = (p: keyof Percentiles<number>): PortfolioData => ({
      totalValue: percentiles.totalValue[p],
      totalWithdrawals: percentiles.totalWithdrawals[p],
      totalContributions: percentiles.totalContributions[p],
      totalRealizedGains: percentiles.totalRealizedGains[p],
      withdrawalsForPeriod: percentiles.withdrawalsForPeriod[p],
      contributionsForPeriod: percentiles.contributionsForPeriod[p],
      realizedGainsForPeriod: percentiles.realizedGainsForPeriod[p],
      perAccountData: {},
      assetAllocation: { stocks: 0, bonds: 0, cash: 0 },
    });

    return {
      p10: buildPercentileData('p10'),
      p25: buildPercentileData('p25'),
      p50: buildPercentileData('p50'),
      p75: buildPercentileData('p75'),
      p90: buildPercentileData('p90'),
    };
  }

  // export interface IncomesData {
  //   totalGrossIncome: number;
  //   totalAmountWithheld: number;
  //   totalIncomeAfterWithholding: number;
  //   perIncomeData: Record<string, IncomeData>;
  // }

  // export interface IncomeData {
  //   id: string;
  //   name: string;
  //   grossIncome: number;
  //   amountWithheld: number;
  //   incomeAfterWithholding: number;
  // }
  private calculateIncomesPercentiles(dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>): Percentiles<IncomesData> {
    const percentiles = {
      totalGrossIncome: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.incomes?.totalGrossIncome ?? 0),
      totalAmountWithheld: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.incomes?.totalAmountWithheld ?? 0),
      totalIncomeAfterWithholding: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.incomes?.totalIncomeAfterWithholding ?? 0),
    };

    const buildPercentileData = (p: keyof Percentiles<number>): IncomesData => ({
      totalGrossIncome: percentiles.totalGrossIncome[p],
      totalAmountWithheld: percentiles.totalAmountWithheld[p],
      totalIncomeAfterWithholding: percentiles.totalIncomeAfterWithholding[p],
      perIncomeData: {},
    });

    return {
      p10: buildPercentileData('p10'),
      p25: buildPercentileData('p25'),
      p50: buildPercentileData('p50'),
      p75: buildPercentileData('p75'),
      p90: buildPercentileData('p90'),
    };
  }

  // export interface ExpensesData {
  //   totalExpenses: number;
  //   perExpenseData: Record<string, ExpenseData>;
  // }

  // export interface ExpenseData {
  //   id: string;
  //   name: string;
  //   amount: number;
  // }
  private calculateExpensesPercentiles(dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>): Percentiles<ExpensesData> {
    const percentiles = {
      totalExpenses: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.expenses?.totalExpenses ?? 0),
    };

    const buildPercentileData = (p: keyof Percentiles<number>): ExpensesData => ({
      totalExpenses: percentiles.totalExpenses[p],
      perExpenseData: {},
    });

    return {
      p10: buildPercentileData('p10'),
      p25: buildPercentileData('p25'),
      p50: buildPercentileData('p50'),
      p75: buildPercentileData('p75'),
      p90: buildPercentileData('p90'),
    };
  }

  // export type PhaseName = 'accumulation' | 'retirement';

  // export interface PhaseData {
  //   name: PhaseName;
  // }
  private calculatePhasePercentiles(dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>): Percentiles<PhaseData> {
    throw new Error('Not implemented');
  }

  // export interface CapitalGainsTaxesData {
  //   taxableCapitalGains: number;
  //   capitalGainsTaxAmount: number;
  //   effectiveCapitalGainsTaxRate: number;
  //   topMarginalCapitalGainsTaxRate: number;
  //   netCapitalGains: number;
  // }

  // export interface IncomeTaxesData {
  //   taxableOrdinaryIncome: number;
  //   incomeTaxAmount: number;
  //   effectiveIncomeTaxRate: number;
  //   topMarginalTaxRate: number;
  //   netIncome: number;
  //   capitalLossDeduction?: number;
  // }

  // export interface TaxesData {
  //   incomeTaxes: IncomeTaxesData;
  //   capitalGainsTaxes: CapitalGainsTaxesData;
  //   totalTaxesDue: number;
  //   totalTaxesRefund: number;
  //   totalTaxableIncome: number;
  // }
  private calculateTaxesPercentiles(dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>): Percentiles<TaxesData> {
    throw new Error('Not implemented');
  }

  // export interface ReturnsData {
  //   // Total return data
  //   totalReturnAmounts: AssetReturnAmounts;

  //   // Monthly return data
  //   returnAmountsForPeriod: AssetReturnAmounts;
  //   returnRatesForPeriod: AssetReturnRates;
  //   inflationRateForPeriod: number;

  //   // Annual return data
  //   annualReturnRates: AssetReturnRates;
  //   annualInflationRate: number;
  // }

  // export type AssetClass = 'stocks' | 'bonds' | 'cash';
  // export type AssetReturnRates = Record<AssetClass, number>;
  // export type AssetReturnAmounts = Record<AssetClass, number>;
  private calculateReturnsPercentiles(dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>): Percentiles<ReturnsData> {
    throw new Error('Not implemented');
  }

  private calculateStats(values: number[]): Stats | null {
    if (values.length === 0) return null;
    if (values.length === 1) return { mean: values[0], median: values[0], min: values[0], max: values[0], stdDev: null };

    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = this.calculateMedian(sorted);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const stdDev = this.calculateStandardDeviation(values, mean);

    return { mean, median, min, max, stdDev };
  }

  private calculateMedian(sortedValues: number[]): number {
    const length = sortedValues.length;
    if (length % 2 === 0) {
      return (sortedValues[length / 2 - 1] + sortedValues[length / 2]) / 2;
    } else {
      return sortedValues[Math.floor(length / 2)];
    }
  }

  private calculateStandardDeviation(values: number[], mean: number): number {
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
  }
}
