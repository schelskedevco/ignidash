import type { AccountInputs } from '@/lib/schemas/account-form-schema';

import type { SimulationDataPoint, MultiSimulationResult, SimulationResult } from './simulation-engine';
import type { PortfolioData, AccountDataWithTransactions } from './portfolio';
import type { IncomesData, IncomeData } from './incomes';
import type { ExpensesData, ExpenseData } from './expenses';
import type { PhaseData, PhaseName } from './phase';
import type { TaxesData } from './taxes';
import type { ReturnsData } from './returns';
import type { AssetClass } from '../asset';

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

  // export type AssetAllocation = Record<AssetClass, number>;
  // assetAllocation: AssetAllocation;
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

    const accountNamesAndTypes: Record<string, { name: string; type: AccountInputs['type'] }> = {};
    dataPointsForYear.forEach(({ dp }) => {
      const perAccountData = dp.portfolio.perAccountData;
      for (const [id, acc] of Object.entries(perAccountData)) {
        if (!accountNamesAndTypes[id]) accountNamesAndTypes[id] = { name: acc.name, type: acc.type };
      }
    });

    const accountPercentiles: Record<
      string,
      {
        totalValue: Percentiles<number>;
        totalWithdrawals: Percentiles<number>;
        totalContributions: Percentiles<number>;
        totalRealizedGains: Percentiles<number>;
        contributionsForPeriod: Percentiles<number>;
        withdrawalsForPeriod: Percentiles<number>;
        realizedGainsForPeriod: Percentiles<number>;
      }
    > = {};
    for (const id of Object.keys(accountNamesAndTypes)) {
      accountPercentiles[id] = {
        totalValue: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.perAccountData[id]?.totalValue ?? 0),
        totalWithdrawals: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.perAccountData[id]?.totalWithdrawals ?? 0),
        totalContributions: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.perAccountData[id]?.totalContributions ?? 0),
        totalRealizedGains: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.perAccountData[id]?.totalRealizedGains ?? 0),
        contributionsForPeriod: this.getFieldPercentiles(
          dataPointsForYear,
          (d) => d.dp.portfolio.perAccountData[id]?.contributionsForPeriod ?? 0
        ),
        withdrawalsForPeriod: this.getFieldPercentiles(
          dataPointsForYear,
          (d) => d.dp.portfolio.perAccountData[id]?.withdrawalsForPeriod ?? 0
        ),
        realizedGainsForPeriod: this.getFieldPercentiles(
          dataPointsForYear,
          (d) => d.dp.portfolio.perAccountData[id]?.realizedGainsForPeriod ?? 0
        ),
      };
    }

    const buildPercentileData = (p: keyof Percentiles<number>): PortfolioData => {
      const perAccountData: Record<string, AccountDataWithTransactions> = {};
      for (const [id, { name, type }] of Object.entries(accountNamesAndTypes)) {
        perAccountData[id] = {
          id,
          name,
          type,
          totalValue: accountPercentiles[id].totalValue[p],
          totalWithdrawals: accountPercentiles[id].totalWithdrawals[p],
          totalContributions: accountPercentiles[id].totalContributions[p],
          totalRealizedGains: accountPercentiles[id].totalRealizedGains[p],
          contributionsForPeriod: accountPercentiles[id].contributionsForPeriod[p],
          withdrawalsForPeriod: accountPercentiles[id].withdrawalsForPeriod[p],
          realizedGainsForPeriod: accountPercentiles[id].realizedGainsForPeriod[p],
          assetAllocation: { stocks: 0, bonds: 0, cash: 0 },
        };
      }

      return {
        totalValue: percentiles.totalValue[p],
        totalWithdrawals: percentiles.totalWithdrawals[p],
        totalContributions: percentiles.totalContributions[p],
        totalRealizedGains: percentiles.totalRealizedGains[p],
        withdrawalsForPeriod: percentiles.withdrawalsForPeriod[p],
        contributionsForPeriod: percentiles.contributionsForPeriod[p],
        realizedGainsForPeriod: percentiles.realizedGainsForPeriod[p],
        perAccountData,
        assetAllocation: { stocks: 0, bonds: 0, cash: 0 },
      };
    };

    return {
      p10: buildPercentileData('p10'),
      p25: buildPercentileData('p25'),
      p50: buildPercentileData('p50'),
      p75: buildPercentileData('p75'),
      p90: buildPercentileData('p90'),
    };
  }

  private calculateIncomesPercentiles(dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>): Percentiles<IncomesData> {
    const percentiles = {
      totalGrossIncome: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.incomes?.totalGrossIncome ?? 0),
      totalAmountWithheld: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.incomes?.totalAmountWithheld ?? 0),
      totalIncomeAfterWithholding: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.incomes?.totalIncomeAfterWithholding ?? 0),
    };

    const incomeNames: Record<string, string> = {};
    dataPointsForYear.forEach(({ dp }) => {
      const perIncomeData = dp.incomes?.perIncomeData ?? {};
      for (const [id, inc] of Object.entries(perIncomeData)) {
        if (!incomeNames[id]) incomeNames[id] = inc.name;
      }
    });

    const incomePercentiles: Record<
      string,
      {
        grossIncome: Percentiles<number>;
        amountWithheld: Percentiles<number>;
        incomeAfterWithholding: Percentiles<number>;
      }
    > = {};
    for (const id of Object.keys(incomeNames)) {
      incomePercentiles[id] = {
        grossIncome: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.incomes?.perIncomeData[id]?.grossIncome ?? 0),
        amountWithheld: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.incomes?.perIncomeData[id]?.amountWithheld ?? 0),
        incomeAfterWithholding: this.getFieldPercentiles(
          dataPointsForYear,
          (d) => d.dp.incomes?.perIncomeData[id]?.incomeAfterWithholding ?? 0
        ),
      };
    }

    const buildPercentileData = (p: keyof Percentiles<number>): IncomesData => {
      const perIncomeData: Record<string, IncomeData> = {};
      for (const [id, name] of Object.entries(incomeNames)) {
        perIncomeData[id] = {
          id,
          name,
          grossIncome: incomePercentiles[id].grossIncome[p],
          amountWithheld: incomePercentiles[id].amountWithheld[p],
          incomeAfterWithholding: incomePercentiles[id].incomeAfterWithholding[p],
        };
      }

      return {
        totalGrossIncome: percentiles.totalGrossIncome[p],
        totalAmountWithheld: percentiles.totalAmountWithheld[p],
        totalIncomeAfterWithholding: percentiles.totalIncomeAfterWithholding[p],
        perIncomeData,
      };
    };

    return {
      p10: buildPercentileData('p10'),
      p25: buildPercentileData('p25'),
      p50: buildPercentileData('p50'),
      p75: buildPercentileData('p75'),
      p90: buildPercentileData('p90'),
    };
  }

  private calculateExpensesPercentiles(dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>): Percentiles<ExpensesData> {
    const percentiles = {
      totalExpenses: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.expenses?.totalExpenses ?? 0),
    };

    const expenseNames: Record<string, string> = {};
    dataPointsForYear.forEach(({ dp }) => {
      const perExpenseData = dp.expenses?.perExpenseData ?? {};
      for (const [id, exp] of Object.entries(perExpenseData)) {
        if (!expenseNames[id]) expenseNames[id] = exp.name;
      }
    });

    const expensePercentiles: Record<string, Percentiles<number>> = {};
    for (const id of Object.keys(expenseNames)) {
      expensePercentiles[id] = this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.expenses?.perExpenseData[id]?.amount ?? 0);
    }

    const buildPercentileData = (p: keyof Percentiles<number>): ExpensesData => {
      const perExpenseData: Record<string, ExpenseData> = {};
      for (const [id, name] of Object.entries(expenseNames)) {
        perExpenseData[id] = { id, name, amount: expensePercentiles[id][p] };
      }

      return {
        totalExpenses: percentiles.totalExpenses[p],
        perExpenseData,
      };
    };

    return {
      p10: buildPercentileData('p10'),
      p25: buildPercentileData('p25'),
      p50: buildPercentileData('p50'),
      p75: buildPercentileData('p75'),
      p90: buildPercentileData('p90'),
    };
  }

  private calculatePhasePercentiles(dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>): Percentiles<PhaseData> {
    const values: PhaseName[] = dataPointsForYear.map((d) => d.dp.phase?.name ?? 'accumulation').sort();

    const percentiles = this.calculatePercentilesFromValues(values);
    const wrap = (name: PhaseName): PhaseData => ({ name });

    return {
      p10: wrap(percentiles.p10),
      p25: wrap(percentiles.p25),
      p50: wrap(percentiles.p50),
      p75: wrap(percentiles.p75),
      p90: wrap(percentiles.p90),
    };
  }

  private calculateTaxesPercentiles(dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>): Percentiles<TaxesData> {
    const percentiles = {
      totalTaxesDue: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes?.totalTaxesDue ?? 0),
      totalTaxesRefund: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes?.totalTaxesRefund ?? 0),
      totalTaxableIncome: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes?.totalTaxableIncome ?? 0),
    };

    const incomeTaxes = {
      taxableOrdinaryIncome: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes?.incomeTaxes.taxableOrdinaryIncome ?? 0),
      incomeTaxAmount: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes?.incomeTaxes.incomeTaxAmount ?? 0),
      effectiveIncomeTaxRate: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes?.incomeTaxes.effectiveIncomeTaxRate ?? 0),
      topMarginalTaxRate: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes?.incomeTaxes.topMarginalTaxRate ?? 0),
      netIncome: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes?.incomeTaxes.netIncome ?? 0),
      capitalLossDeduction: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes?.incomeTaxes.capitalLossDeduction ?? 0),
    };

    const capitalGainsTaxes = {
      taxableCapitalGains: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes?.capitalGainsTaxes.taxableCapitalGains ?? 0),
      capitalGainsTaxAmount: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes?.capitalGainsTaxes.capitalGainsTaxAmount ?? 0),
      effectiveCapitalGainsTaxRate: this.getFieldPercentiles(
        dataPointsForYear,
        (d) => d.dp.taxes?.capitalGainsTaxes.effectiveCapitalGainsTaxRate ?? 0
      ),
      topMarginalCapitalGainsTaxRate: this.getFieldPercentiles(
        dataPointsForYear,
        (d) => d.dp.taxes?.capitalGainsTaxes.topMarginalCapitalGainsTaxRate ?? 0
      ),
      netCapitalGains: this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes?.capitalGainsTaxes.netCapitalGains ?? 0),
    };

    const buildPercentileData = (p: keyof Percentiles<number>): TaxesData => ({
      incomeTaxes: {
        taxableOrdinaryIncome: incomeTaxes.taxableOrdinaryIncome[p],
        incomeTaxAmount: incomeTaxes.incomeTaxAmount[p],
        effectiveIncomeTaxRate: incomeTaxes.effectiveIncomeTaxRate[p],
        topMarginalTaxRate: incomeTaxes.topMarginalTaxRate[p],
        netIncome: incomeTaxes.netIncome[p],
        capitalLossDeduction: incomeTaxes.capitalLossDeduction[p],
      },
      capitalGainsTaxes: {
        taxableCapitalGains: capitalGainsTaxes.taxableCapitalGains[p],
        capitalGainsTaxAmount: capitalGainsTaxes.capitalGainsTaxAmount[p],
        effectiveCapitalGainsTaxRate: capitalGainsTaxes.effectiveCapitalGainsTaxRate[p],
        topMarginalCapitalGainsTaxRate: capitalGainsTaxes.topMarginalCapitalGainsTaxRate[p],
        netCapitalGains: capitalGainsTaxes.netCapitalGains[p],
      },
      totalTaxesDue: percentiles.totalTaxesDue[p],
      totalTaxesRefund: percentiles.totalTaxesRefund[p],
      totalTaxableIncome: percentiles.totalTaxableIncome[p],
    });

    return {
      p10: buildPercentileData('p10'),
      p25: buildPercentileData('p25'),
      p50: buildPercentileData('p50'),
      p75: buildPercentileData('p75'),
      p90: buildPercentileData('p90'),
    };
  }

  private calculateReturnsPercentiles(dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>): Percentiles<ReturnsData> {
    const assetClasses: AssetClass[] = ['stocks', 'bonds', 'cash'];

    const inflationRateForPeriod = this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.returns?.inflationRateForPeriod ?? 0);
    const annualInflationRate = this.getFieldPercentiles(dataPointsForYear, (d) => d.dp.returns?.annualInflationRate ?? 0);

    const makeAssetPercentiles = <T extends Record<AssetClass, number>>(
      selector: (d: (typeof dataPointsForYear)[number]) => T
    ): Record<AssetClass, Percentiles<number>> => {
      return Object.fromEntries(
        assetClasses.map((asset) => [asset, this.getFieldPercentiles(dataPointsForYear, (d) => selector(d)[asset])])
      ) as Record<AssetClass, Percentiles<number>>;
    };

    const fallback = { stocks: 0, bonds: 0, cash: 0 };

    const totalReturnAmounts = makeAssetPercentiles((d) => d.dp.returns?.totalReturnAmounts ?? fallback);
    const returnAmountsForPeriod = makeAssetPercentiles((d) => d.dp.returns?.returnAmountsForPeriod ?? fallback);
    const returnRatesForPeriod = makeAssetPercentiles((d) => d.dp.returns?.returnRatesForPeriod ?? fallback);
    const annualReturnRates = makeAssetPercentiles((d) => d.dp.returns?.annualReturnRates ?? fallback);

    const buildPercentileData = (p: keyof Percentiles<number>): ReturnsData => {
      const pickAsset = (m: Record<AssetClass, Percentiles<number>>): Record<AssetClass, number> => {
        return Object.fromEntries(assetClasses.map((asset) => [asset, m[asset][p]])) as Record<AssetClass, number>;
      };

      return {
        totalReturnAmounts: pickAsset(totalReturnAmounts),
        returnAmountsForPeriod: pickAsset(returnAmountsForPeriod),
        returnRatesForPeriod: pickAsset(returnRatesForPeriod),
        inflationRateForPeriod: inflationRateForPeriod[p],
        annualReturnRates: pickAsset(annualReturnRates),
        annualInflationRate: annualInflationRate[p],
      };
    };

    return {
      p10: buildPercentileData('p10'),
      p25: buildPercentileData('p25'),
      p50: buildPercentileData('p50'),
      p75: buildPercentileData('p75'),
      p90: buildPercentileData('p90'),
    };
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
