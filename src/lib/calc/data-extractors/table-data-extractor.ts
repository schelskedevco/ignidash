import type {
  SingleSimulationPortfolioTableRow,
  SingleSimulationCashFlowTableRow,
  SingleSimulationTaxesTableRow,
  SingleSimulationReturnsTableRow,
  SingleSimulationContributionsTableRow,
  SingleSimulationWithdrawalsTableRow,
} from '@/lib/schemas/tables/single-simulation-table-schema';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/tables/multi-simulation-table-schema';
import { SimulationDataExtractor } from '@/lib/calc/data-extractors/simulation-data-extractor';
import { type Percentiles, StatsUtils } from '@/lib/utils/stats-utils';

import type { SimulationResult, MultiSimulationResult } from '../simulation-engine';

export abstract class TableDataExtractor {
  // ================================
  // SINGLE SIMULATION DATA EXTRACTION
  // ================================

  static extractSingleSimulationPortfolioData(simulation: SimulationResult): SingleSimulationPortfolioTableRow[] {
    const startAge = simulation.context.startAge;
    const historicalRanges = simulation.context.historicalRanges ?? null;
    const startDateYear = new Date().getFullYear();

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const currDateYear = new Date(data.date).getFullYear();
      const age = currDateYear - startDateYear + startAge;

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      const portfolioData = data.portfolio;
      const totalPortfolioValue = portfolioData.totalValue;
      const annualWithdrawals = portfolioData.withdrawalsForPeriod;
      const annualContributions = portfolioData.contributionsForPeriod;

      const { taxableBrokerageValue, taxDeferredValue, taxFreeValue, cashSavings } =
        SimulationDataExtractor.getPortfolioValueByTaxCategory(data);
      const { stockHoldings, bondHoldings, cashHoldings } = SimulationDataExtractor.getHoldingsByAssetClass(data);

      const returnsData = data.returns;
      const {
        stocks: stockAmount,
        bonds: bondAmount,
        cash: cashAmount,
      } = returnsData?.returnAmountsForPeriod ?? { stocks: 0, bonds: 0, cash: 0 };

      return {
        year: idx,
        age,
        phaseName: formattedPhaseName,
        totalPortfolioValue,
        annualReturns: stockAmount + bondAmount + cashAmount,
        annualContributions,
        annualWithdrawals,
        netPortfolioChange: stockAmount + bondAmount + cashAmount + annualContributions - annualWithdrawals,
        stockHoldings,
        bondHoldings,
        cashHoldings,
        taxableBrokerageValue,
        taxDeferredValue,
        taxFreeValue,
        cashSavings,
        historicalYear,
      };
    });
  }

  static extractSingleSimulationCashFlowData(simulation: SimulationResult): SingleSimulationCashFlowTableRow[] {
    const startAge = simulation.context.startAge;
    const historicalRanges = simulation.context.historicalRanges ?? null;
    const startDateYear = new Date().getFullYear();

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const currDateYear = new Date(data.date).getFullYear();
      const age = currDateYear - startDateYear + startAge;

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      if (idx === 0) {
        return {
          year: idx,
          age,
          phaseName: formattedPhaseName,
          earnedIncome: null,
          socialSecurityIncome: null,
          taxExemptIncome: null,
          incomeTax: null,
          ficaTax: null,
          capGainsTax: null,
          earlyWithdrawalPenalties: null,
          totalTaxesAndPenalties: null,
          expenses: null,
          cashFlow: null,
          savingsRate: null,
          historicalYear,
        };
      }

      const { incomeTax, ficaTax, capGainsTax, earlyWithdrawalPenalties, totalTaxesAndPenalties } =
        SimulationDataExtractor.getTaxAmountsByType(data);
      const {
        earnedIncome,
        socialSecurityIncome,
        taxExemptIncome,
        totalExpenses: expenses,
        cashFlow,
      } = SimulationDataExtractor.getCashFlowData(data);
      const savingsRate = SimulationDataExtractor.getSavingsRate(data);

      return {
        year: idx,
        age,
        phaseName: formattedPhaseName,
        earnedIncome,
        socialSecurityIncome,
        taxExemptIncome,
        incomeTax,
        ficaTax,
        capGainsTax,
        earlyWithdrawalPenalties,
        totalTaxesAndPenalties,
        expenses,
        cashFlow,
        savingsRate,
        historicalYear,
      };
    });
  }

  static extractSingleSimulationTaxesData(simulation: SimulationResult): SingleSimulationTaxesTableRow[] {
    const startAge = simulation.context.startAge;
    const historicalRanges = simulation.context.historicalRanges ?? null;
    const startDateYear = new Date().getFullYear();

    let cumulativeIncomeTax = 0;
    let cumulativeFicaTax = 0;
    let cumulativeCapGainsTax = 0;
    let cumulativeEarlyWithdrawalPenalties = 0;
    let cumulativeTotalTaxesAndPenalties = 0;

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const currDateYear = new Date(data.date).getFullYear();
      const age = currDateYear - startDateYear + startAge;

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      if (idx === 0) {
        return {
          year: idx,
          age,
          phaseName: formattedPhaseName,
          grossIncome: null,
          adjustedGrossIncome: null,
          taxableIncome: null,
          earnedIncome: null,
          retirementDistributions: null,
          interestIncome: null,
          annualIncomeTax: null,
          cumulativeIncomeTax: null,
          annualFicaTax: null,
          cumulativeFicaTax: null,
          effectiveIncomeTaxRate: null,
          topMarginalIncomeTaxRate: null,
          socialSecurityIncome: null,
          taxableSocialSecurityIncome: null,
          provisionalIncome: null,
          maxTaxableSocialSecurityPercentage: null,
          actualTaxableSocialSecurityPercentage: null,
          realizedGains: null,
          dividendIncome: null,
          annualCapGainsTax: null,
          cumulativeCapGainsTax: null,
          effectiveCapGainsTaxRate: null,
          topMarginalCapGainsTaxRate: null,
          annualEarlyWithdrawalPenalties: null,
          cumulativeEarlyWithdrawalPenalties: null,
          taxExemptIncome: null,
          annualTotalTaxesAndPenalties: null,
          cumulativeTotalTaxesAndPenalties: null,
          taxDeferredContributions: null,
          standardDeduction: null,
          capitalLossDeduction: null,
          historicalYear,
        };
      }

      const {
        incomeTax: annualIncomeTax,
        ficaTax: annualFicaTax,
        capGainsTax: annualCapGainsTax,
        earlyWithdrawalPenalties: annualEarlyWithdrawalPenalties,
        totalTaxesAndPenalties: annualTotalTaxesAndPenalties,
      } = SimulationDataExtractor.getTaxAmountsByType(data);

      cumulativeIncomeTax += annualIncomeTax;
      cumulativeFicaTax += annualFicaTax;
      cumulativeCapGainsTax += annualCapGainsTax;
      cumulativeEarlyWithdrawalPenalties += annualEarlyWithdrawalPenalties;
      cumulativeTotalTaxesAndPenalties += annualTotalTaxesAndPenalties;

      const {
        realizedGains,
        totalRetirementDistributions: retirementDistributions,
        dividendIncome,
        interestIncome,
        earnedIncome,
        socialSecurityIncome,
        taxExemptIncome,
        grossIncome,
      } = SimulationDataExtractor.getTaxableIncomeSources(data, age);

      const taxesData = data.taxes;

      return {
        year: idx,
        age,
        phaseName: formattedPhaseName,
        grossIncome,
        adjustedGrossIncome: taxesData?.adjustedGrossIncome ?? 0,
        taxableIncome: taxesData?.totalTaxableIncome ?? 0,
        earnedIncome,
        retirementDistributions,
        interestIncome,
        annualIncomeTax,
        cumulativeIncomeTax,
        annualFicaTax,
        cumulativeFicaTax,
        effectiveIncomeTaxRate: taxesData?.incomeTaxes.effectiveIncomeTaxRate ?? 0,
        topMarginalIncomeTaxRate: taxesData?.incomeTaxes.topMarginalIncomeTaxRate ?? 0,
        socialSecurityIncome,
        taxableSocialSecurityIncome: taxesData?.socialSecurityTaxes.taxableSocialSecurity ?? 0,
        provisionalIncome: taxesData?.socialSecurityTaxes.provisionalIncome ?? 0,
        maxTaxableSocialSecurityPercentage: taxesData?.socialSecurityTaxes.maxTaxablePercentage ?? 0,
        actualTaxableSocialSecurityPercentage: taxesData?.socialSecurityTaxes.actualTaxablePercentage ?? 0,
        realizedGains,
        dividendIncome,
        annualCapGainsTax,
        cumulativeCapGainsTax,
        effectiveCapGainsTaxRate: taxesData?.capitalGainsTaxes.effectiveCapitalGainsTaxRate ?? 0,
        topMarginalCapGainsTaxRate: taxesData?.capitalGainsTaxes.topMarginalCapitalGainsTaxRate ?? 0,
        annualEarlyWithdrawalPenalties,
        cumulativeEarlyWithdrawalPenalties,
        taxExemptIncome,
        annualTotalTaxesAndPenalties,
        cumulativeTotalTaxesAndPenalties,
        taxDeferredContributions: taxesData?.adjustments.taxDeferredContributions ?? null,
        standardDeduction: taxesData?.deductions.standardDeduction ?? null,
        capitalLossDeduction: taxesData?.incomeTaxes.capitalLossDeduction ?? null,
        historicalYear,
      };
    });
  }

  static extractSingleSimulationReturnsData(simulation: SimulationResult): SingleSimulationReturnsTableRow[] {
    const startAge = simulation.context.startAge;
    const historicalRanges = simulation.context.historicalRanges ?? null;
    const startDateYear = new Date().getFullYear();

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const currDateYear = new Date(data.date).getFullYear();
      const age = currDateYear - startDateYear + startAge;

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      if (idx === 0) {
        return {
          year: idx,
          age,
          phaseName: formattedPhaseName,
          stockRate: null,
          cumulativeStockAmount: null,
          annualStockAmount: null,
          stockHoldings: null,
          bondRate: null,
          cumulativeBondAmount: null,
          annualBondAmount: null,
          bondHoldings: null,
          cashRate: null,
          cumulativeCashAmount: null,
          annualCashAmount: null,
          cashHoldings: null,
          inflationRate: null,
          historicalYear,
        };
      }

      const { stockHoldings, bondHoldings, cashHoldings } = SimulationDataExtractor.getHoldingsByAssetClass(data);

      const returnsData = data.returns;

      return {
        year: idx,
        age,
        phaseName: formattedPhaseName,
        stockRate: returnsData?.annualReturnRates.stocks ?? null,
        cumulativeStockAmount: returnsData?.totalReturnAmounts.stocks ?? null,
        annualStockAmount: returnsData?.returnAmountsForPeriod.stocks ?? null,
        stockHoldings,
        bondRate: returnsData?.annualReturnRates.bonds ?? null,
        cumulativeBondAmount: returnsData?.totalReturnAmounts.bonds ?? null,
        annualBondAmount: returnsData?.returnAmountsForPeriod.bonds ?? null,
        bondHoldings,
        cashRate: returnsData?.annualReturnRates.cash ?? null,
        cumulativeCashAmount: returnsData?.totalReturnAmounts.cash ?? null,
        annualCashAmount: returnsData?.returnAmountsForPeriod.cash ?? null,
        cashHoldings,
        inflationRate: returnsData?.annualInflationRate ?? null,
        historicalYear,
      };
    });
  }

  static extractSingleSimulationContributionsData(simulation: SimulationResult): SingleSimulationContributionsTableRow[] {
    const startAge = simulation.context.startAge;
    const historicalRanges = simulation.context.historicalRanges ?? null;
    const startDateYear = new Date().getFullYear();

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const currDateYear = new Date(data.date).getFullYear();
      const age = currDateYear - startDateYear + startAge;

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      if (idx === 0) {
        return {
          year: idx,
          age,
          phaseName: formattedPhaseName,
          annualContributions: null,
          cumulativeContributions: null,
          taxableBrokerage: null,
          taxDeferred: null,
          taxFree: null,
          cashSavings: null,
          annualEmployerMatch: null,
          cumulativeEmployerMatch: null,
          totalPortfolioValue: null,
          cashFlow: null,
          historicalYear,
        };
      }

      const portfolioData = data.portfolio;
      const totalPortfolioValue = portfolioData.totalValue;
      const annualContributions = portfolioData.contributionsForPeriod;
      const annualEmployerMatch = portfolioData.employerMatchForPeriod;

      const {
        taxableBrokerageContributions: taxableBrokerage,
        taxDeferredContributions: taxDeferred,
        taxFreeContributions: taxFree,
        cashSavingsContributions: cashSavings,
      } = SimulationDataExtractor.getContributionsByTaxCategory(data);
      const { cashFlow } = SimulationDataExtractor.getCashFlowData(data);

      return {
        year: idx,
        age,
        phaseName: formattedPhaseName,
        annualContributions,
        cumulativeContributions: portfolioData.totalContributions,
        taxableBrokerage,
        taxDeferred,
        taxFree,
        cashSavings,
        annualEmployerMatch,
        cumulativeEmployerMatch: portfolioData.totalEmployerMatch,
        totalPortfolioValue,
        cashFlow,
        historicalYear,
      };
    });
  }

  static extractSingleSimulationWithdrawalsData(simulation: SimulationResult): SingleSimulationWithdrawalsTableRow[] {
    const startAge = simulation.context.startAge;
    const historicalRanges = simulation.context.historicalRanges ?? null;
    const startDateYear = new Date().getFullYear();

    let cumulativeEarlyWithdrawalPenalties = 0;
    let cumulativeEarlyWithdrawals = 0;

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const currDateYear = new Date(data.date).getFullYear();
      const age = currDateYear - startDateYear + startAge;

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      if (idx === 0) {
        return {
          year: idx,
          age,
          phaseName: formattedPhaseName,
          annualWithdrawals: null,
          cumulativeWithdrawals: null,
          taxableBrokerage: null,
          taxDeferred: null,
          taxFree: null,
          cashSavings: null,
          annualRealizedGains: null,
          cumulativeRealizedGains: null,
          annualRequiredMinimumDistributions: null,
          cumulativeRequiredMinimumDistributions: null,
          annualEarlyWithdrawals: null,
          cumulativeEarlyWithdrawals: null,
          annualEarlyWithdrawalPenalties: null,
          cumulativeEarlyWithdrawalPenalties: null,
          annualRothEarningsWithdrawals: null,
          cumulativeRothEarningsWithdrawals: null,
          totalPortfolioValue: null,
          cashFlow: null,
          withdrawalRate: null,
          historicalYear,
        };
      }

      const portfolioData = data.portfolio;
      const totalPortfolioValue = portfolioData.totalValue;
      const annualWithdrawals = portfolioData.withdrawalsForPeriod;

      const {
        taxableBrokerageWithdrawals: taxableBrokerage,
        taxDeferredWithdrawals: taxDeferred,
        taxFreeWithdrawals: taxFree,
        cashSavingsWithdrawals: cashSavings,
        earlyWithdrawals: annualEarlyWithdrawals,
      } = SimulationDataExtractor.getWithdrawalsByTaxCategory(data, age);
      cumulativeEarlyWithdrawals += annualEarlyWithdrawals;

      const { earlyWithdrawalPenalties: annualEarlyWithdrawalPenalties } = SimulationDataExtractor.getTaxAmountsByType(data);
      cumulativeEarlyWithdrawalPenalties += annualEarlyWithdrawalPenalties;

      const { cashFlow } = SimulationDataExtractor.getCashFlowData(data);
      const withdrawalRate = SimulationDataExtractor.getWithdrawalRate(data);

      return {
        year: idx,
        age,
        phaseName: formattedPhaseName,
        annualWithdrawals,
        cumulativeWithdrawals: portfolioData.totalWithdrawals,
        taxableBrokerage,
        taxDeferred,
        taxFree,
        cashSavings,
        annualRealizedGains: portfolioData.realizedGainsForPeriod,
        cumulativeRealizedGains: portfolioData.totalRealizedGains,
        annualRequiredMinimumDistributions: portfolioData.rmdsForPeriod,
        cumulativeRequiredMinimumDistributions: portfolioData.totalRmds,
        annualEarlyWithdrawals,
        cumulativeEarlyWithdrawals,
        annualEarlyWithdrawalPenalties,
        cumulativeEarlyWithdrawalPenalties,
        annualRothEarningsWithdrawals: portfolioData.earningsWithdrawnForPeriod,
        cumulativeRothEarningsWithdrawals: portfolioData.totalEarningsWithdrawn,
        totalPortfolioValue,
        cashFlow,
        withdrawalRate,
        historicalYear,
      };
    });
  }

  // ================================
  // MULTI SIMULATION DATA EXTRACTION
  // ================================

  static extractMultiSimulationData(simulations: MultiSimulationResult): MultiSimulationTableRow[] {
    return simulations.simulations.map(([seed, result]) => {
      const { data, context } = result;

      const startAge = context.startAge;

      const { retirementAge, bankruptcyAge } = SimulationDataExtractor.getMilestonesData(data, startAge);
      const {
        meanStockReturn,
        meanBondReturn,
        meanCashReturn,
        meanInflationRate,
        minStockReturn,
        maxStockReturn,
        earlyRetirementStockReturn,
      } = SimulationDataExtractor.getMeanReturnsData(result, retirementAge);

      const lastDp = data[data.length - 1];
      const success = retirementAge !== null && lastDp.portfolio.totalValue > 0.1;
      const historicalRanges = context.historicalRanges ?? null;

      const finalPhaseName = lastDp.phase?.name ?? null;
      const formattedFinalPhaseName = finalPhaseName !== null ? finalPhaseName.charAt(0).toUpperCase() + finalPhaseName.slice(1) : null;

      const { lifetimeIncomeTaxes, lifetimeFicaTaxes, lifetimeCapGainsTaxes, lifetimeEarlyWithdrawalPenalties, lifetimeTaxesAndPenalties } =
        SimulationDataExtractor.getLifetimeTaxesAndPenalties(data);

      return {
        seed,
        success,
        retirementAge,
        bankruptcyAge,
        finalPhaseName: formattedFinalPhaseName,
        finalPortfolioValue: lastDp.portfolio.totalValue,
        minStockReturn,
        maxStockReturn,
        meanStockReturn,
        earlyRetirementStockReturn,
        meanBondReturn,
        meanCashReturn,
        meanInflationRate,
        lifetimeIncomeTaxes,
        lifetimeFicaTaxes,
        lifetimeCapGainsTaxes,
        lifetimeEarlyWithdrawalPenalties,
        lifetimeTaxesAndPenalties,
        lifetimeContributions: lastDp.portfolio.totalContributions,
        lifetimeWithdrawals: lastDp.portfolio.totalWithdrawals,
        lifetimeRealizedGains: lastDp.portfolio.totalRealizedGains,
        lifetimeRequiredMinimumDistributions: lastDp.portfolio.totalRmds,
        historicalRanges,
      };
    });
  }

  static extractMultiSimulationYearlyAggregateData(simulations: MultiSimulationResult): YearlyAggregateTableRow[] {
    const res: YearlyAggregateTableRow[] = [];

    const simulationLength = simulations.simulations[0][1].data.length;

    const startAge = simulations.simulations[0][1].context.startAge;
    const startDateYear = new Date().getFullYear();

    for (let i = 0; i < simulationLength; i++) {
      if (simulations.simulations[i][1].data.length !== simulationLength) {
        throw new Error('All simulations must have the same length for yearly aggregate data extraction.');
      }

      const currDateYear = new Date(simulations.simulations[0][1].data[i].date).getFullYear();

      const totalPortfolioValues = simulations.simulations.map(([, sim]) => sim.data[i].portfolio.totalValue);
      const percentiles: Percentiles<number> = StatsUtils.calculatePercentilesFromValues(totalPortfolioValues.sort((a, b) => a - b));

      const { percentAccumulation, percentRetirement, percentBankrupt } = SimulationDataExtractor.getPercentInPhaseForYear(simulations, i);

      res.push({
        year: i,
        age: currDateYear - startDateYear + startAge,
        percentAccumulation,
        percentRetirement,
        percentBankrupt,
        p10PortfolioValue: percentiles.p10,
        p25PortfolioValue: percentiles.p25,
        p50PortfolioValue: percentiles.p50,
        p75PortfolioValue: percentiles.p75,
        p90PortfolioValue: percentiles.p90,
      });
    }

    return res;
  }

  private static getHistoricalYear(
    historicalRanges: { startYear: number; endYear: number }[] | null,
    yearsSinceStart: number
  ): number | null {
    if (!historicalRanges?.length) return null;

    let historicalYear: number | null = null;

    let cumulativeYears = 0;
    for (const range of historicalRanges) {
      const rangeLength = range.endYear - range.startYear + 1;

      if (yearsSinceStart < cumulativeYears + rangeLength) {
        const yearsIntoRange = yearsSinceStart - cumulativeYears;
        historicalYear = range.startYear + yearsIntoRange;
        break;
      }

      cumulativeYears += rangeLength;
    }

    if (historicalYear === null && historicalRanges.length > 0) {
      historicalYear = historicalRanges[historicalRanges.length - 1].endYear;
    }

    return historicalYear;
  }
}
