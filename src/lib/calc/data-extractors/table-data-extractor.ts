import type {
  SingleSimulationPortfolioTableRow,
  SingleSimulationIncomeExpensesTableRow,
  SingleSimulationTaxesTableRow,
  SingleSimulationReturnsTableRow,
  SingleSimulationContributionsTableRow,
  SingleSimulationWithdrawalsTableRow,
} from '@/lib/schemas/tables/single-simulation-table-schema';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/tables/multi-simulation-table-schema';
import { type Percentiles, StatsUtils } from '@/lib/utils/stats-utils';
import { sumTransactions } from '@/lib/calc/asset';
import { sumReturns } from '@/lib/calc/returns';

import type { SimulationResult, MultiSimulationResult } from '../simulation-engine';
import { SimulationDataExtractor } from './simulation-data-extractor';

export abstract class TableDataExtractor {
  // ================================
  // SINGLE SIMULATION DATA EXTRACTION
  // ================================

  static extractSingleSimulationPortfolioData(simulation: SimulationResult): SingleSimulationPortfolioTableRow[] {
    const historicalRanges = simulation.context.historicalRanges ?? null;

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const age = Math.floor(data.age);

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      const portfolioData = data.portfolio;
      const totalPortfolioValue = portfolioData.totalValue;

      const { taxableValue, taxDeferredValue, taxFreeValue, cashSavings } = SimulationDataExtractor.getPortfolioValueByTaxCategory(data);
      const { stockHoldings, bondHoldings, cashHoldings } = SimulationDataExtractor.getHoldingsByAssetClass(data);

      if (idx === 0) {
        return {
          year: idx,
          age,
          phaseName: formattedPhaseName,
          totalPortfolioValue,
          annualReturns: null,
          annualContributions: null,
          annualWithdrawals: null,
          netPortfolioChange: null,
          stockHoldings,
          bondHoldings,
          cashHoldings,
          taxableValue,
          taxDeferredValue,
          taxFreeValue,
          cashSavings,
          historicalYear,
        };
      }

      const annualWithdrawals = sumTransactions(portfolioData.withdrawalsForPeriod);
      const annualContributions = sumTransactions(portfolioData.contributionsForPeriod);

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
        taxableValue,
        taxDeferredValue,
        taxFreeValue,
        cashSavings,
        historicalYear,
      };
    });
  }

  static extractSingleSimulationIncomeExpensesData(simulation: SimulationResult): SingleSimulationIncomeExpensesTableRow[] {
    const historicalRanges = simulation.context.historicalRanges ?? null;

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const age = Math.floor(data.age);

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      if (idx === 0) {
        return {
          year: idx,
          age,
          phaseName: formattedPhaseName,
          earnedIncome: null,
          employerMatch: null,
          socialSecurityIncome: null,
          nonTaxableIncome: null,
          incomeTax: null,
          ficaTax: null,
          capGainsTax: null,
          niit: null,
          earlyWithdrawalPenalties: null,
          totalTaxesAndPenalties: null,
          expenses: null,
          surplusDeficit: null,
          savingsRate: null,
          historicalYear,
        };
      }

      const { incomeTax, ficaTax, capGainsTax, niit, earlyWithdrawalPenalties, totalTaxesAndPenalties } =
        SimulationDataExtractor.getTaxAmountsByType(data);
      const {
        earnedIncome,
        socialSecurityIncome,
        nonTaxableIncome,
        employerMatch,
        totalExpenses: expenses,
        surplusDeficit,
      } = SimulationDataExtractor.getSurplusDeficitData(data);
      const savingsRate = SimulationDataExtractor.getSavingsRate(data);

      return {
        year: idx,
        age,
        phaseName: formattedPhaseName,
        earnedIncome,
        employerMatch,
        socialSecurityIncome,
        nonTaxableIncome,
        incomeTax,
        ficaTax,
        capGainsTax,
        niit,
        earlyWithdrawalPenalties,
        totalTaxesAndPenalties,
        expenses,
        surplusDeficit,
        savingsRate,
        historicalYear,
      };
    });
  }

  static extractSingleSimulationTaxesData(simulation: SimulationResult): SingleSimulationTaxesTableRow[] {
    const historicalRanges = simulation.context.historicalRanges ?? null;

    let cumulativeIncomeTax = 0;
    let cumulativeFicaTax = 0;
    let cumulativeCapGainsTax = 0;
    let cumulativeNiit = 0;
    let cumulativeEarlyWithdrawalPenalties = 0;
    let cumulativeTotalTaxesAndPenalties = 0;

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const age = Math.floor(data.age);

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
          taxableRetirementDistributions: null,
          taxableInterestIncome: null,
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
          taxableDividendIncome: null,
          annualCapGainsTax: null,
          cumulativeCapGainsTax: null,
          effectiveCapGainsTaxRate: null,
          topMarginalCapGainsTaxRate: null,
          netInvestmentIncome: null,
          incomeSubjectToNiit: null,
          annualNiit: null,
          cumulativeNiit: null,
          annualEarlyWithdrawalPenalties: null,
          cumulativeEarlyWithdrawalPenalties: null,
          nonTaxableIncome: null,
          annualTotalTaxesAndPenalties: null,
          cumulativeTotalTaxesAndPenalties: null,
          taxDeductibleContributions: null,
          standardDeduction: null,
          capitalLossDeduction: null,
          historicalYear,
        };
      }

      const {
        incomeTax: annualIncomeTax,
        ficaTax: annualFicaTax,
        capGainsTax: annualCapGainsTax,
        niit: annualNiit,
        earlyWithdrawalPenalties: annualEarlyWithdrawalPenalties,
        totalTaxesAndPenalties: annualTotalTaxesAndPenalties,
      } = SimulationDataExtractor.getTaxAmountsByType(data);

      cumulativeIncomeTax += annualIncomeTax;
      cumulativeFicaTax += annualFicaTax;
      cumulativeCapGainsTax += annualCapGainsTax;
      cumulativeNiit += annualNiit;
      cumulativeEarlyWithdrawalPenalties += annualEarlyWithdrawalPenalties;
      cumulativeTotalTaxesAndPenalties += annualTotalTaxesAndPenalties;

      const taxesData = data.taxes;

      return {
        year: idx,
        age,
        phaseName: formattedPhaseName,
        grossIncome: taxesData?.incomeSources.grossIncome ?? 0,
        adjustedGrossIncome: taxesData?.incomeSources.adjustedGrossIncome ?? 0,
        taxableIncome: taxesData?.totalTaxableIncome ?? 0,
        earnedIncome: taxesData?.incomeSources.earnedIncome ?? 0,
        taxableRetirementDistributions: taxesData?.incomeSources.taxableRetirementDistributions ?? 0,
        taxableInterestIncome: taxesData?.incomeSources.taxableInterestIncome ?? 0,
        annualIncomeTax,
        cumulativeIncomeTax,
        annualFicaTax,
        cumulativeFicaTax,
        effectiveIncomeTaxRate: taxesData?.incomeTaxes.effectiveIncomeTaxRate ?? 0,
        topMarginalIncomeTaxRate: taxesData?.incomeTaxes.topMarginalIncomeTaxRate ?? 0,
        socialSecurityIncome: taxesData?.incomeSources.socialSecurityIncome ?? 0,
        taxableSocialSecurityIncome: taxesData?.socialSecurityTaxes.taxableSocialSecurityIncome ?? 0,
        provisionalIncome: taxesData?.socialSecurityTaxes.provisionalIncome ?? 0,
        maxTaxableSocialSecurityPercentage: taxesData?.socialSecurityTaxes.maxTaxablePercentage ?? 0,
        actualTaxableSocialSecurityPercentage: taxesData?.socialSecurityTaxes.actualTaxablePercentage ?? 0,
        realizedGains: taxesData?.incomeSources.realizedGains ?? 0,
        taxableDividendIncome: taxesData?.incomeSources.taxableDividendIncome ?? 0,
        annualCapGainsTax,
        cumulativeCapGainsTax,
        effectiveCapGainsTaxRate: taxesData?.capitalGainsTaxes.effectiveCapitalGainsTaxRate ?? 0,
        topMarginalCapGainsTaxRate: taxesData?.capitalGainsTaxes.topMarginalCapitalGainsTaxRate ?? 0,
        netInvestmentIncome: taxesData?.niit.netInvestmentIncome ?? 0,
        incomeSubjectToNiit: taxesData?.niit.incomeSubjectToNiit ?? 0,
        annualNiit,
        cumulativeNiit,
        annualEarlyWithdrawalPenalties,
        cumulativeEarlyWithdrawalPenalties,
        nonTaxableIncome: taxesData?.incomeSources.nonTaxableIncome ?? 0,
        annualTotalTaxesAndPenalties,
        cumulativeTotalTaxesAndPenalties,
        taxDeductibleContributions: taxesData?.adjustments.taxDeductibleContributions ?? null,
        standardDeduction: taxesData?.deductions.standardDeduction ?? null,
        capitalLossDeduction: taxesData?.incomeTaxes.capitalLossDeduction ?? null,
        historicalYear,
      };
    });
  }

  static extractSingleSimulationReturnsData(simulation: SimulationResult): SingleSimulationReturnsTableRow[] {
    const historicalRanges = simulation.context.historicalRanges ?? null;

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const age = Math.floor(data.age);

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      if (idx === 0) {
        return {
          year: idx,
          age,
          phaseName: formattedPhaseName,
          totalAnnualGains: null,
          totalCumulativeGains: null,
          taxableGains: null,
          taxDeferredGains: null,
          taxFreeGains: null,
          cashSavingsGains: null,
          stockReturnRate: null,
          cumulativeStockGain: null,
          annualStockGain: null,
          stockHoldings: null,
          bondReturnRate: null,
          cumulativeBondGain: null,
          annualBondGain: null,
          bondHoldings: null,
          cashReturnRate: null,
          cumulativeCashGain: null,
          annualCashGain: null,
          cashHoldings: null,
          inflationRate: null,
          historicalYear,
        };
      }

      const { stockHoldings, bondHoldings, cashHoldings } = SimulationDataExtractor.getHoldingsByAssetClass(data);

      const returnsData = data.returns;

      const totalCumulativeGains = sumReturns(returnsData!.cumulativeReturnAmounts);
      const totalAnnualGains = sumReturns(returnsData!.returnAmountsForPeriod);

      const { taxableGains, taxDeferredGains, taxFreeGains, cashSavingsGains } = SimulationDataExtractor.getGainsByTaxCategory(data);

      return {
        year: idx,
        age,
        phaseName: formattedPhaseName,
        totalAnnualGains,
        totalCumulativeGains,
        taxableGains,
        taxDeferredGains,
        taxFreeGains,
        cashSavingsGains,
        stockReturnRate: returnsData?.annualReturnRates.stocks ?? null,
        cumulativeStockGain: returnsData?.cumulativeReturnAmounts.stocks ?? null,
        annualStockGain: returnsData?.returnAmountsForPeriod.stocks ?? null,
        stockHoldings,
        bondReturnRate: returnsData?.annualReturnRates.bonds ?? null,
        cumulativeBondGain: returnsData?.cumulativeReturnAmounts.bonds ?? null,
        annualBondGain: returnsData?.returnAmountsForPeriod.bonds ?? null,
        bondHoldings,
        cashReturnRate: returnsData?.annualReturnRates.cash ?? null,
        cumulativeCashGain: returnsData?.cumulativeReturnAmounts.cash ?? null,
        annualCashGain: returnsData?.returnAmountsForPeriod.cash ?? null,
        cashHoldings,
        inflationRate: returnsData?.annualInflationRate ?? null,
        historicalYear,
      };
    });
  }

  static extractSingleSimulationContributionsData(simulation: SimulationResult): SingleSimulationContributionsTableRow[] {
    const historicalRanges = simulation.context.historicalRanges ?? null;

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const age = Math.floor(data.age);

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      if (idx === 0) {
        return {
          year: idx,
          age,
          phaseName: formattedPhaseName,
          annualContributions: null,
          cumulativeContributions: null,
          stockContributions: null,
          bondContributions: null,
          cashContributions: null,
          taxableContributions: null,
          taxDeferredContributions: null,
          taxFreeContributions: null,
          cashSavingsContributions: null,
          annualEmployerMatch: null,
          cumulativeEmployerMatch: null,
          totalPortfolioValue: null,
          surplusDeficit: null,
          savingsRate: null,
          annualShortfallRepaid: null,
          outstandingShortfall: null,
          historicalYear,
        };
      }

      const portfolioData = data.portfolio;
      const totalPortfolioValue = portfolioData.totalValue;
      const annualContributions = sumTransactions(portfolioData.contributionsForPeriod);
      const cumulativeContributions = sumTransactions(portfolioData.cumulativeContributions);
      const annualEmployerMatch = portfolioData.employerMatchForPeriod;

      const { taxableContributions, taxDeferredContributions, taxFreeContributions, cashSavingsContributions } =
        SimulationDataExtractor.getContributionsByTaxCategory(data);
      const { surplusDeficit } = SimulationDataExtractor.getSurplusDeficitData(data);
      const savingsRate = SimulationDataExtractor.getSavingsRate(data);

      return {
        year: idx,
        age,
        phaseName: formattedPhaseName,
        annualContributions,
        cumulativeContributions,
        stockContributions: portfolioData.contributionsForPeriod.stocks,
        bondContributions: portfolioData.contributionsForPeriod.bonds,
        cashContributions: portfolioData.contributionsForPeriod.cash,
        taxableContributions,
        taxDeferredContributions,
        taxFreeContributions,
        cashSavingsContributions,
        annualEmployerMatch,
        cumulativeEmployerMatch: portfolioData.cumulativeEmployerMatch,
        totalPortfolioValue,
        surplusDeficit,
        savingsRate,
        annualShortfallRepaid: portfolioData.shortfallRepaidForPeriod,
        outstandingShortfall: portfolioData.outstandingShortfall,
        historicalYear,
      };
    });
  }

  static extractSingleSimulationWithdrawalsData(simulation: SimulationResult): SingleSimulationWithdrawalsTableRow[] {
    const historicalRanges = simulation.context.historicalRanges ?? null;

    let cumulativeEarlyWithdrawals = 0;

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = this.getHistoricalYear(historicalRanges, idx);
      const age = Math.floor(data.age);

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      if (idx === 0) {
        return {
          year: idx,
          age,
          phaseName: formattedPhaseName,
          annualWithdrawals: null,
          cumulativeWithdrawals: null,
          stockWithdrawals: null,
          bondWithdrawals: null,
          cashWithdrawals: null,
          taxableWithdrawals: null,
          taxDeferredWithdrawals: null,
          taxFreeWithdrawals: null,
          cashSavingsWithdrawals: null,
          annualRealizedGains: null,
          cumulativeRealizedGains: null,
          annualRequiredMinimumDistributions: null,
          cumulativeRequiredMinimumDistributions: null,
          annualEarlyWithdrawals: null,
          cumulativeEarlyWithdrawals: null,
          annualRothEarningsWithdrawals: null,
          cumulativeRothEarningsWithdrawals: null,
          totalPortfolioValue: null,
          surplusDeficit: null,
          withdrawalRate: null,
          annualShortfall: null,
          outstandingShortfall: null,
          historicalYear,
        };
      }

      const portfolioData = data.portfolio;
      const totalPortfolioValue = portfolioData.totalValue;
      const annualWithdrawals = sumTransactions(portfolioData.withdrawalsForPeriod);
      const cumulativeWithdrawals = sumTransactions(portfolioData.cumulativeWithdrawals);

      const { taxableWithdrawals, taxDeferredWithdrawals, taxFreeWithdrawals, cashSavingsWithdrawals } =
        SimulationDataExtractor.getWithdrawalsByTaxCategory(data, age);

      const annualEarlyWithdrawals = SimulationDataExtractor.getEarlyWithdrawals(data, age);
      cumulativeEarlyWithdrawals += annualEarlyWithdrawals;

      const { surplusDeficit } = SimulationDataExtractor.getSurplusDeficitData(data);
      const withdrawalRate = SimulationDataExtractor.getWithdrawalRate(data);

      return {
        year: idx,
        age,
        phaseName: formattedPhaseName,
        annualWithdrawals,
        cumulativeWithdrawals,
        stockWithdrawals: portfolioData.withdrawalsForPeriod.stocks,
        bondWithdrawals: portfolioData.withdrawalsForPeriod.bonds,
        cashWithdrawals: portfolioData.withdrawalsForPeriod.cash,
        taxableWithdrawals,
        taxDeferredWithdrawals,
        taxFreeWithdrawals,
        cashSavingsWithdrawals,
        annualRealizedGains: portfolioData.realizedGainsForPeriod,
        cumulativeRealizedGains: portfolioData.cumulativeRealizedGains,
        annualRequiredMinimumDistributions: portfolioData.rmdsForPeriod,
        cumulativeRequiredMinimumDistributions: portfolioData.cumulativeRmds,
        annualEarlyWithdrawals,
        cumulativeEarlyWithdrawals,
        annualRothEarningsWithdrawals: portfolioData.earningsWithdrawnForPeriod,
        cumulativeRothEarningsWithdrawals: portfolioData.cumulativeEarningsWithdrawn,
        totalPortfolioValue,
        surplusDeficit,
        withdrawalRate,
        annualShortfall: portfolioData.shortfallForPeriod,
        outstandingShortfall: portfolioData.outstandingShortfall,
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

      const {
        lifetimeIncomeTax,
        lifetimeFicaTax,
        lifetimeCapGainsTax,
        lifetimeNiit,
        lifetimeEarlyWithdrawalPenalties,
        lifetimeTaxesAndPenalties,
      } = SimulationDataExtractor.getLifetimeTaxesAndPenalties(data);

      const cumulativeReturnAmounts = lastDp.returns?.cumulativeReturnAmounts ?? { stocks: 0, bonds: 0, cash: 0 };
      const lifetimeReturns = sumReturns(cumulativeReturnAmounts);

      const lifetimeContributions = sumTransactions(lastDp.portfolio.cumulativeContributions);
      const lifetimeWithdrawals = sumTransactions(lastDp.portfolio.cumulativeWithdrawals);

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
        lifetimeIncomeTax,
        lifetimeFicaTax,
        lifetimeCapGainsTax,
        lifetimeNiit,
        lifetimeEarlyWithdrawalPenalties,
        lifetimeTaxesAndPenalties,
        lifetimeReturns,
        lifetimeContributions,
        lifetimeWithdrawals,
        lifetimeRealizedGains: lastDp.portfolio.cumulativeRealizedGains,
        lifetimeRequiredMinimumDistributions: lastDp.portfolio.cumulativeRmds,
        historicalRanges,
      };
    });
  }

  static extractMultiSimulationYearlyAggregateData(simulations: MultiSimulationResult): YearlyAggregateTableRow[] {
    const res: YearlyAggregateTableRow[] = [];

    const simulationLength = simulations.simulations[0][1].data.length;

    for (let i = 0; i < simulationLength; i++) {
      if (simulations.simulations[i][1].data.length !== simulationLength) {
        throw new Error('All simulations must have the same length for yearly aggregate data extraction.');
      }

      const age = Math.floor(simulations.simulations[0][1].data[i].age);

      const totalPortfolioValues = simulations.simulations.map(([, sim]) => sim.data[i].portfolio.totalValue);
      const percentiles: Percentiles<number> = StatsUtils.calculatePercentilesFromValues(totalPortfolioValues.sort((a, b) => a - b));

      const { percentAccumulation, percentRetirement, percentBankrupt } = SimulationDataExtractor.getPercentInPhaseForYear(simulations, i);

      res.push({
        year: i,
        age,
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
