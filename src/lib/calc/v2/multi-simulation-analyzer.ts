import type { AccountInputs } from '@/lib/schemas/account-form-schema';

import type { SimulationDataPoint, MultiSimulationResult, SimulationResult } from './simulation-engine';
import type { PortfolioData, AccountDataWithTransactions } from './portfolio';
import type { IncomesData, IncomeData } from './incomes';
import type { ExpensesData, ExpenseData } from './expenses';
import type { PhaseData, PhaseName } from './phase';
import type { TaxesData, IncomeTaxesData, CapitalGainsTaxesData } from './taxes';
import type { ReturnsData } from './returns';
import type { AssetClass, AssetAllocation } from '../asset';

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

export class MultiSimulationAnalyzer {
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
    const fallback = { stocks: 0, bonds: 0, cash: 0 };
    const getAllocationPercentiles = (allocations: AssetAllocation[]): Percentiles<AssetAllocation> => {
      const sorted = allocations.sort((a, b) => a.stocks - b.stocks);
      return this.calculatePercentilesFromValues(sorted);
    };

    const percentiles: { [K in keyof Omit<PortfolioData, 'perAccountData'>]: Percentiles<PortfolioData[K]> } = {
      totalValue: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.totalValue),
      totalWithdrawals: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.totalWithdrawals),
      totalContributions: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.totalContributions),
      totalRealizedGains: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.totalRealizedGains),
      withdrawalsForPeriod: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.withdrawalsForPeriod),
      contributionsForPeriod: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.contributionsForPeriod),
      realizedGainsForPeriod: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.portfolio.realizedGainsForPeriod),
      assetAllocation: getAllocationPercentiles(dataPointsForYear.map((d) => d.dp.portfolio.assetAllocation ?? fallback)),
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
        assetAllocation: getAllocationPercentiles(
          dataPointsForYear.map((d) => d.dp.portfolio.perAccountData[id]?.assetAllocation ?? fallback)
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
    const wrap = (name: PhaseName): PhaseData => ({ name });

    return {
      p10: wrap(percentiles.p10),
      p25: wrap(percentiles.p25),
      p50: wrap(percentiles.p50),
      p75: wrap(percentiles.p75),
      p90: wrap(percentiles.p90),
    };
  }

  private calculateTaxesPercentiles(dataPointsForYear: Array<{ seed: number; dp: SimulationDataPoint }>): Percentiles<TaxesData | null> {
    const allHaveNoTaxes = dataPointsForYear.every((d) => d.dp.taxes === null);
    if (allHaveNoTaxes) return { p10: null, p25: null, p50: null, p75: null, p90: null };

    const percentiles: { [K in keyof Omit<TaxesData, 'incomeTaxes' | 'capitalGainsTaxes'>]: Percentiles<TaxesData[K]> } = {
      totalTaxesDue: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes!.totalTaxesDue),
      totalTaxesRefund: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes!.totalTaxesRefund),
      totalTaxableIncome: this.getNumberFieldPercentiles(dataPointsForYear, (d) => d.dp.taxes!.totalTaxableIncome),
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

    const makeAssetPercentiles = <T extends Record<AssetClass, number>>(
      selector: (d: (typeof dataPointsForYear)[number]) => T
    ): Record<AssetClass, Percentiles<number>> => {
      return Object.fromEntries(
        assetClasses.map((asset) => [asset, this.getNumberFieldPercentiles(dataPointsForYear, (d) => selector(d)[asset])])
      ) as Record<AssetClass, Percentiles<number>>;
    };

    const totalReturnAmounts = makeAssetPercentiles((d) => d.dp.returns!.totalReturnAmounts);
    const returnAmountsForPeriod = makeAssetPercentiles((d) => d.dp.returns!.returnAmountsForPeriod);
    const returnRatesForPeriod = makeAssetPercentiles((d) => d.dp.returns!.returnRatesForPeriod);
    const annualReturnRates = makeAssetPercentiles((d) => d.dp.returns!.annualReturnRates);

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

  private getNumberFieldPercentiles<T>(data: T[], valueExtractor: (item: T) => number): Percentiles<number> {
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
}
