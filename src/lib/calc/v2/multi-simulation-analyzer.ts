import type { AccountInputs } from '@/lib/schemas/account-form-schema';
import { SimulationCategory } from '@/lib/types/simulation-category';
import { SimulationDataExtractor } from '@/lib/utils/simulation-data-extractor';

import type { SimulationDataPoint, MultiSimulationResult, SimulationResult } from './simulation-engine';
import type { PortfolioData, AccountDataWithTransactions } from './portfolio';
import type { IncomesData, IncomeData } from './incomes';
import type { ExpensesData, ExpenseData } from './expenses';
import type { PhaseData, PhaseName } from './phase';
import type { TaxesData, IncomeTaxesData, CapitalGainsTaxesData } from './taxes';
import type { ReturnsData } from './returns';
import type { AssetClass, AssetAllocation } from '../asset';
import { TableDataExtractor } from './table-data-extractor';

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
  results: Percentiles<SimulationResult>;
}

type MetricKey = 'finalPortfolioValue' | 'retirementAge' | 'bankruptcyAge' | 'averageStockReturn' | 'earlyRetirementStockReturn';
type NormalizedValues = Record<MetricKey, number>;

export class MultiSimulationAnalyzer {
  private static buildWeights(
    sortMode: 'finalPortfolioValue' | 'retirementAge' | 'bankruptcyAge' | 'averageStockReturn' | 'earlyRetirementStockReturn'
  ) {
    const base: Record<MetricKey, number> = {
      finalPortfolioValue: 0,
      retirementAge: 0,
      bankruptcyAge: 0,
      averageStockReturn: 0,
      earlyRetirementStockReturn: 0,
    };

    switch (sortMode) {
      case 'finalPortfolioValue':
        return {
          ...base,
          finalPortfolioValue: 1,
        };
      case 'retirementAge':
        return {
          ...base,
          retirementAge: 1,
        };
      case 'bankruptcyAge':
        return {
          ...base,
          bankruptcyAge: 1,
        };
      case 'averageStockReturn':
        return {
          ...base,
          averageStockReturn: 1,
        };
      case 'earlyRetirementStockReturn':
        return {
          ...base,
          earlyRetirementStockReturn: 1,
        };
    }
  }

  analyzeV2(
    multiSimulationResult: MultiSimulationResult,
    sortMode: 'finalPortfolioValue' | 'retirementAge' | 'bankruptcyAge' | 'averageStockReturn' | 'earlyRetirementStockReturn'
  ): MultiSimulationAnalysis {
    const simulations = multiSimulationResult.simulations;

    const numDataPoints = simulations[0][1]?.data.length;
    if (!numDataPoints) throw new Error('No data points in simulations');

    const extractor = new TableDataExtractor();
    const tableData = extractor.extractMultiSimulationData(multiSimulationResult, SimulationCategory.Portfolio);

    const { min: minFinalPortfolioValue, range: finalPortfolioValueRange } = this.getRange(tableData, (row) => row.finalPortfolioValue);
    const { min: minRetirementAge, range: retirementAgeRange } = this.getRange(tableData, (row) => row.retirementAge);
    const { min: minBankruptcyAge, range: bankruptcyAgeRange } = this.getRange(tableData, (row) => row.bankruptcyAge);
    const { min: minAverageStockReturn, range: averageStockReturnRange } = this.getRange(tableData, (row) => row.averageStockReturn);
    const { min: minEarlyRetirementStockReturn, range: earlyRetirementStockReturnRange } = this.getRange(
      tableData,
      (row) => row.earlyRetirementStockReturn
    );

    const weights = MultiSimulationAnalyzer.buildWeights(sortMode);

    const sortedSimulations = [...simulations].sort((a, b) => {
      const {
        data: dataA,
        context: { startAge },
      } = a[1];
      const { data: dataB } = b[1];

      const dataALength = dataA.length;
      const dataBLength = dataB.length;

      if (dataALength !== dataBLength) console.warn('Simulations have different lengths');

      const { retirementAge: retirementAgeA, bankruptcyAge: bankruptcyAgeA } = SimulationDataExtractor.getMilestonesData(dataA, startAge);
      const { retirementAge: retirementAgeB, bankruptcyAge: bankruptcyAgeB } = SimulationDataExtractor.getMilestonesData(dataB, startAge);

      const normalizedRetirementAgeA = this.normalize(retirementAgeA, minRetirementAge, retirementAgeRange, 0, true);
      const normalizedRetirementAgeB = this.normalize(retirementAgeB, minRetirementAge, retirementAgeRange, 0, true);

      const normalizedBankruptcyAgeA = this.normalize(bankruptcyAgeA, minBankruptcyAge, bankruptcyAgeRange, 1);
      const normalizedBankruptcyAgeB = this.normalize(bankruptcyAgeB, minBankruptcyAge, bankruptcyAgeRange, 1);

      const returnsA = SimulationDataExtractor.getAverageReturns(a[1], retirementAgeA);
      const returnsB = SimulationDataExtractor.getAverageReturns(b[1], retirementAgeB);

      const normalizedAverageStockReturnA = this.normalize(returnsA.averageStockReturn, minAverageStockReturn, averageStockReturnRange, 0);
      const normalizedAverageStockReturnB = this.normalize(returnsB.averageStockReturn, minAverageStockReturn, averageStockReturnRange, 0);

      const normalizedEarlyRetirementStockReturnA = this.normalize(
        returnsA.earlyRetirementStockReturn,
        minEarlyRetirementStockReturn,
        earlyRetirementStockReturnRange,
        0
      );
      const normalizedEarlyRetirementStockReturnB = this.normalize(
        returnsB.earlyRetirementStockReturn,
        minEarlyRetirementStockReturn,
        earlyRetirementStockReturnRange,
        0
      );

      const lastDpA = dataA[dataALength - 1];
      const lastDpB = dataB[dataBLength - 1];

      const normalizedFinalPortfolioValueA = this.normalize(lastDpA.portfolio.totalValue, minFinalPortfolioValue, finalPortfolioValueRange);
      const normalizedFinalPortfolioValueB = this.normalize(lastDpB.portfolio.totalValue, minFinalPortfolioValue, finalPortfolioValueRange);

      const _successA = Number(retirementAgeA !== null && lastDpA.portfolio.totalValue > 0.1);
      const _successB = Number(retirementAgeB !== null && lastDpB.portfolio.totalValue > 0.1);

      const valuesA: NormalizedValues = {
        finalPortfolioValue: normalizedFinalPortfolioValueA,
        retirementAge: normalizedRetirementAgeA,
        bankruptcyAge: normalizedBankruptcyAgeA,
        averageStockReturn: normalizedAverageStockReturnA,
        earlyRetirementStockReturn: normalizedEarlyRetirementStockReturnA,
      };

      const valuesB: NormalizedValues = {
        finalPortfolioValue: normalizedFinalPortfolioValueB,
        retirementAge: normalizedRetirementAgeB,
        bankruptcyAge: normalizedBankruptcyAgeB,
        averageStockReturn: normalizedAverageStockReturnB,
        earlyRetirementStockReturn: normalizedEarlyRetirementStockReturnB,
      };

      const scoreA = this.calculateScore(valuesA, weights);
      const scoreB = this.calculateScore(valuesB, weights);

      return scoreA - scoreB;
    });

    let successCount = 0;
    for (const [, simResult] of simulations) {
      const finalDp = simResult.data[simResult.data.length - 1];
      if (finalDp.portfolio.totalValue > 0.1 && finalDp.phase?.name === 'retirement') successCount++;
    }

    const results = this.calculatePercentilesFromValues(sortedSimulations.map((s) => s[1]));

    return { success: successCount / simulations.length, results };
  }

  private getRange<T>(data: T[], extractor: (row: T) => number | null): { min: number; max: number; range: number } {
    const values = data.map(extractor).filter((v): v is number => v !== null);
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { min, max, range: max - min };
  }

  private normalize(value: number | null, min: number, range: number, fallback: number = 0, invert: boolean = false): number {
    if (value === null) return fallback;
    if (range === 0) return 0.5;

    let norm = (value - min) / range;
    if (invert) norm = 1 - norm;

    return Math.max(0, Math.min(1, norm));
  }

  private calculateScore(values: NormalizedValues, weights: Record<MetricKey, number>): number {
    return (Object.keys(weights) as MetricKey[]).reduce((sum, key) => sum + weights[key] * values[key], 0);
  }

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

      const portfolioPercentiles = this.calculatePortfolioPercentiles(dataPointsForYear);
      const incomesPercentiles = this.calculateIncomesPercentiles(dataPointsForYear);
      const expensesPercentiles = this.calculateExpensesPercentiles(dataPointsForYear);
      const phasePercentiles = this.calculatePhasePercentiles(dataPointsForYear);
      const taxesPercentiles = this.calculateTaxesPercentiles(dataPointsForYear);
      const returnsPercentiles = this.calculateReturnsPercentiles(dataPointsForYear);

      const buildSimulationDataPoint = (p: keyof Percentiles<number>): SimulationDataPoint => ({
        date: dataPointsForYear[0].dp.date,
        portfolio: portfolioPercentiles[p],
        incomes: incomesPercentiles[p],
        expenses: expensesPercentiles[p],
        phase: phasePercentiles[p],
        taxes: taxesPercentiles[p],
        returns: returnsPercentiles[p],
      });

      p10DataPoints.push(buildSimulationDataPoint('p10'));
      p25DataPoints.push(buildSimulationDataPoint('p25'));
      p50DataPoints.push(buildSimulationDataPoint('p50'));
      p75DataPoints.push(buildSimulationDataPoint('p75'));
      p90DataPoints.push(buildSimulationDataPoint('p90'));
    }

    const context = { ...simulations[0][1].context };

    let successCount = 0;
    for (const [, simResult] of simulations) {
      const finalDp = simResult.data[simResult.data.length - 1];
      if (finalDp.portfolio.totalValue > 0.1 && finalDp.phase?.name === 'retirement') successCount++;
    }

    return {
      success: successCount / simulations.length,
      results: {
        p10: { data: p10DataPoints, context },
        p25: { data: p25DataPoints, context },
        p50: { data: p50DataPoints, context },
        p75: { data: p75DataPoints, context },
        p90: { data: p90DataPoints, context },
      },
    };
  }

  private calculatePortfolioPercentiles(dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>): Percentiles<PortfolioData> {
    const percentiles: { [K in keyof Omit<PortfolioData, 'perAccountData'>]: Percentiles<PortfolioData[K]> } = {
      totalValue: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.totalValue),
      totalWithdrawals: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.totalWithdrawals),
      totalContributions: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.totalContributions),
      totalRealizedGains: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.totalRealizedGains),
      withdrawalsForPeriod: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.withdrawalsForPeriod),
      contributionsForPeriod: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.contributionsForPeriod),
      realizedGainsForPeriod: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.realizedGainsForPeriod),
      assetAllocation: this.getAssetAllocationPercentiles(dataPointsForYear.map((d) => d.dp.portfolio.assetAllocation)),
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
        assetAllocation: Percentiles<AssetAllocation>;
      }
    > = {};
    for (const id of Object.keys(accountNamesAndTypes)) {
      accountPercentiles[id] = {
        totalValue: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.perAccountData[id]?.totalValue ?? 0),
        totalWithdrawals: this.getNumberFieldPercentiles(
          dataPointsForYear,
          (d) => d.dp.portfolio.perAccountData[id]?.totalWithdrawals ?? 0
        ),
        totalContributions: this.getNumberFieldPercentiles(
          dataPointsForYear,
          (d) => d.dp.portfolio.perAccountData[id]?.totalContributions ?? 0
        ),
        totalRealizedGains: this.getNumberFieldPercentiles(
          dataPointsForYear,
          (d) => d.dp.portfolio.perAccountData[id]?.totalRealizedGains ?? 0
        ),
        contributionsForPeriod: this.getNumberFieldPercentiles(
          dataPointsForYear,
          (d) => d.dp.portfolio.perAccountData[id]?.contributionsForPeriod ?? 0
        ),
        withdrawalsForPeriod: this.getNumberFieldPercentiles(
          dataPointsForYear,
          (d) => d.dp.portfolio.perAccountData[id]?.withdrawalsForPeriod ?? 0
        ),
        realizedGainsForPeriod: this.getNumberFieldPercentiles(
          dataPointsForYear,
          (d) => d.dp.portfolio.perAccountData[id]?.realizedGainsForPeriod ?? 0
        ),
        assetAllocation: this.getAssetAllocationPercentiles(
          dataPointsForYear.map((d) => d.dp.portfolio.perAccountData[id]?.assetAllocation)
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
          assetAllocation: accountPercentiles[id].assetAllocation[p],
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
        assetAllocation: percentiles.assetAllocation[p],
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

  private calculateIncomesPercentiles(
    dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>
  ): Percentiles<IncomesData | null> {
    const allHaveNoIncomes = dataPointsForYear.every((d) => d.dp.incomes === null);
    if (allHaveNoIncomes) return { p10: null, p25: null, p50: null, p75: null, p90: null };

    const percentiles: { [K in keyof Omit<IncomesData, 'perIncomeData'>]: Percentiles<IncomesData[K]> } = {
      totalGrossIncome: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.incomes!.totalGrossIncome),
      totalAmountWithheld: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.incomes!.totalAmountWithheld),
      totalIncomeAfterWithholding: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.incomes!.totalIncomeAfterWithholding),
    };

    const incomeNames: Record<string, string> = {};
    dataPointsForYear.forEach(({ dp }) => {
      const perIncomeData = dp.incomes!.perIncomeData;
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
        grossIncome: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.incomes!.perIncomeData[id]?.grossIncome ?? 0),
        amountWithheld: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.incomes!.perIncomeData[id]?.amountWithheld ?? 0),
        incomeAfterWithholding: this.getNumberFieldPercentiles(
          dataPointsForYear,
          (d) => d.dp.incomes!.perIncomeData[id]?.incomeAfterWithholding ?? 0
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

  private calculateExpensesPercentiles(
    dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>
  ): Percentiles<ExpensesData | null> {
    const allHaveNoExpenses = dataPointsForYear.every((d) => d.dp.expenses === null);
    if (allHaveNoExpenses) return { p10: null, p25: null, p50: null, p75: null, p90: null };

    const percentiles: { [K in keyof Omit<ExpensesData, 'perExpenseData'>]: Percentiles<ExpensesData[K]> } = {
      totalExpenses: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.expenses!.totalExpenses),
    };

    const expenseNames: Record<string, string> = {};
    dataPointsForYear.forEach(({ dp }) => {
      const perExpenseData = dp.expenses!.perExpenseData;
      for (const [id, exp] of Object.entries(perExpenseData)) {
        if (!expenseNames[id]) expenseNames[id] = exp.name;
      }
    });

    const expensePercentiles: Record<string, Percentiles<number>> = {};
    for (const id of Object.keys(expenseNames)) {
      expensePercentiles[id] = this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.expenses!.perExpenseData[id]?.amount ?? 0);
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

  private calculatePhasePercentiles(dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>): Percentiles<PhaseData | null> {
    const allHaveNoPhase = dataPointsForYear.every((d) => d.dp.phase === null);
    if (allHaveNoPhase) return { p10: null, p25: null, p50: null, p75: null, p90: null };

    const values: PhaseName[] = dataPointsForYear.map((d) => d.dp.phase!.name).sort();

    const percentiles = this.calculatePercentilesFromValues(values);
    const wrapPhaseName = (name: PhaseName): PhaseData => ({ name });

    return {
      p10: wrapPhaseName(percentiles.p10),
      p25: wrapPhaseName(percentiles.p25),
      p50: wrapPhaseName(percentiles.p50),
      p75: wrapPhaseName(percentiles.p75),
      p90: wrapPhaseName(percentiles.p90),
    };
  }

  private calculateTaxesPercentiles(dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>): Percentiles<TaxesData | null> {
    const allHaveNoTaxes = dataPointsForYear.every((d) => d.dp.taxes === null);
    if (allHaveNoTaxes) return { p10: null, p25: null, p50: null, p75: null, p90: null };

    const percentiles: { [K in keyof Omit<TaxesData, 'incomeTaxes' | 'capitalGainsTaxes'>]: Percentiles<TaxesData[K]> } = {
      totalTaxesDue: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes!.totalTaxesDue),
      totalTaxesRefund: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes!.totalTaxesRefund),
      totalTaxableIncome: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes!.totalTaxableIncome),
      adjustments: { p10: {}, p25: {}, p50: {}, p75: {}, p90: {} },
      deductions: { p10: {}, p25: {}, p50: {}, p75: {}, p90: {} },
    };

    const incomeTaxes: { [K in keyof IncomeTaxesData]: Percentiles<IncomeTaxesData[K]> } = {
      taxableOrdinaryIncome: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes!.incomeTaxes.taxableOrdinaryIncome),
      incomeTaxAmount: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes!.incomeTaxes.incomeTaxAmount),
      effectiveIncomeTaxRate: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes!.incomeTaxes.effectiveIncomeTaxRate),
      topMarginalTaxRate: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes!.incomeTaxes.topMarginalTaxRate),
      netIncome: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes!.incomeTaxes.netIncome),
      capitalLossDeduction: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes!.incomeTaxes.capitalLossDeduction ?? 0),
    };

    const capitalGainsTaxes: { [K in keyof CapitalGainsTaxesData]: Percentiles<CapitalGainsTaxesData[K]> } = {
      taxableCapitalGains: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes!.capitalGainsTaxes.taxableCapitalGains),
      capitalGainsTaxAmount: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes!.capitalGainsTaxes.capitalGainsTaxAmount),
      effectiveCapitalGainsTaxRate: this.getNumberFieldPercentiles(
        dataPointsForYear,
        (d) => d.dp.taxes!.capitalGainsTaxes.effectiveCapitalGainsTaxRate
      ),
      topMarginalCapitalGainsTaxRate: this.getNumberFieldPercentiles(
        dataPointsForYear,
        (d) => d.dp.taxes!.capitalGainsTaxes.topMarginalCapitalGainsTaxRate
      ),
      netCapitalGains: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes!.capitalGainsTaxes.netCapitalGains),
    };

    const buildPercentileData = (p: keyof Percentiles<number>): TaxesData => ({
      incomeTaxes: {
        taxableOrdinaryIncome: incomeTaxes.taxableOrdinaryIncome[p],
        incomeTaxAmount: incomeTaxes.incomeTaxAmount[p],
        effectiveIncomeTaxRate: incomeTaxes.effectiveIncomeTaxRate[p],
        topMarginalTaxRate: incomeTaxes.topMarginalTaxRate[p],
        netIncome: incomeTaxes.netIncome[p],
        capitalLossDeduction: incomeTaxes.capitalLossDeduction?.[p] ?? 0,
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
      adjustments: {},
      deductions: {},
    });

    return {
      p10: buildPercentileData('p10'),
      p25: buildPercentileData('p25'),
      p50: buildPercentileData('p50'),
      p75: buildPercentileData('p75'),
      p90: buildPercentileData('p90'),
    };
  }

  private calculateReturnsPercentiles(
    dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>
  ): Percentiles<ReturnsData | null> {
    const allHaveNoReturns = dataPointsForYear.every((d) => d.dp.returns === null);
    if (allHaveNoReturns) return { p10: null, p25: null, p50: null, p75: null, p90: null };

    const assetClasses: AssetClass[] = ['stocks', 'bonds', 'cash'];

    const inflationRateForPeriod = this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.returns!.inflationRateForPeriod);
    const annualInflationRate = this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.returns!.annualInflationRate);

    const buildAssetPercentiles = <T extends Record<AssetClass, number>>(
      valueExtractor: (d: (typeof dataPointsForYear)[number]) => T
    ): Record<AssetClass, Percentiles<number>> => {
      return Object.fromEntries(
        assetClasses.map((asset) => [asset, this.getNumberFieldPercentiles(dataPointsForYear, (d) => valueExtractor(d)[asset])])
      ) as Record<AssetClass, Percentiles<number>>;
    };

    const totalReturnAmounts = buildAssetPercentiles((d) => d.dp.returns!.totalReturnAmounts);
    const returnAmountsForPeriod = buildAssetPercentiles((d) => d.dp.returns!.returnAmountsForPeriod);
    const returnRatesForPeriod = buildAssetPercentiles((d) => d.dp.returns!.returnRatesForPeriod);
    const annualReturnRates = buildAssetPercentiles((d) => d.dp.returns!.annualReturnRates);

    const buildPercentileData = (p: keyof Percentiles<number>): ReturnsData => {
      const extractPercentile = (assetPercentiles: Record<AssetClass, Percentiles<number>>): Record<AssetClass, number> => {
        return Object.fromEntries(assetClasses.map((asset) => [asset, assetPercentiles[asset][p]])) as Record<AssetClass, number>;
      };

      return {
        totalReturnAmounts: extractPercentile(totalReturnAmounts),
        returnAmountsForPeriod: extractPercentile(returnAmountsForPeriod),
        returnRatesForPeriod: extractPercentile(returnRatesForPeriod),
        inflationRateForPeriod: inflationRateForPeriod[p],
        annualReturnRates: extractPercentile(annualReturnRates),
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

  private getNumberFieldPercentiles<T>(data: T[], valueExtractor: (item: T) => number): Percentiles<number> {
    const values = data.map(valueExtractor).sort((a, b) => a - b);
    return this.calculatePercentilesFromValues(values);
  }

  private getAssetAllocationPercentiles(data: Array<AssetAllocation | null>): Percentiles<AssetAllocation> {
    const values = data.map((item) => item ?? { stocks: 0, bonds: 0, cash: 0 }).sort((a, b) => a.stocks - b.stocks);
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
}
