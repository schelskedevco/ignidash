/**
 * Table data extraction for year-by-year data tables
 *
 * Transforms raw simulation results into table row arrays for display in
 * the simulator's data tables. Supports single simulation detailed breakdowns
 * and multi-simulation summary/aggregate views.
 */

import type {
  SingleSimulationNetWorthTableRow,
  SingleSimulationCashFlowTableRow,
  SingleSimulationTaxesTableRow,
  SingleSimulationReturnsTableRow,
  SingleSimulationContributionsTableRow,
  SingleSimulationWithdrawalsTableRow,
} from '@/lib/schemas/tables/single-simulation-table-schema';
import type { MultiSimulationTableRow, YearlyAggregateTableRow } from '@/lib/schemas/tables/multi-simulation-table-schema';
import { type Percentiles, StatsUtils } from '@/lib/utils/stats-utils';
import { sumFlows, sumReturnAmounts } from '@/lib/calc/asset';

import type { SimulationResult, MultiSimulationResult } from '../simulation-engine';
import { SimulationDataExtractor } from './simulation-data-extractor';
import { getHistoricalYear } from './get-historical-year';

/** Transforms simulation results into table row arrays for data tables */
export abstract class TableDataExtractor {
  // ================================
  // SINGLE SIMULATION DATA EXTRACTION
  // ================================

  /**
   * Extracts year-by-year net worth table data
   * @param simulation - A single simulation result
   * @returns Array of table rows with portfolio, asset, and debt values per year
   */
  static extractSingleSimulationNetWorthData(simulation: SimulationResult): SingleSimulationNetWorthTableRow[] {
    const historicalRanges = simulation.context.historicalRanges ?? null;

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = getHistoricalYear(historicalRanges, idx);
      const age = Math.floor(data.age);

      const phaseName = data.phase?.name ?? null;
      const formattedPhaseName = phaseName !== null ? phaseName.charAt(0).toUpperCase() + phaseName.slice(1) : null;

      const portfolioData = data.portfolio;
      const totalPortfolioValue = portfolioData.totalValue;

      const { taxableValue, taxDeferredValue, taxFreeValue, cashSavings } = SimulationDataExtractor.getPortfolioValueByTaxCategory(data);
      const { stockHoldings, bondHoldings, cashHoldings } = SimulationDataExtractor.getHoldingsByAssetClass(data);

      const {
        marketValue: assetValue,
        equity: assetEquity,
        securedDebtBalance,
        unsecuredDebtBalance,
        debtBalance: totalDebtBalance,
        netWorth,
        appreciation: annualAssetAppreciation,
        purchasedAssetValue: annualPurchasedAssetValue,
        soldAssetValue: annualSoldAssetValue,
        netAssetChange,
        debtIncurred: annualDebtIncurred,
        debtPaydown: annualDebtPaydown,
        debtPayoff: annualDebtPayoff,
        netDebtReduction,
      } = SimulationDataExtractor.getAssetsAndLiabilitiesData(data);

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
          assetValue,
          assetEquity,
          securedDebtBalance,
          unsecuredDebtBalance,
          totalDebtBalance,
          netWorth,
          annualAssetAppreciation: null,
          annualPurchasedAssetValue: null,
          annualSoldAssetValue: null,
          netAssetChange: null,
          annualDebtIncurred: null,
          annualDebtPaydown: null,
          annualDebtPayoff: null,
          netDebtReduction: null,
          netWorthChange: null,
          historicalYear,
        };
      }

      const annualWithdrawals = sumFlows(portfolioData.withdrawals);
      const annualContributions = sumFlows(portfolioData.contributions);

      const returnsData = data.returns;
      const { stocks: stockAmount, bonds: bondAmount, cash: cashAmount } = returnsData?.returnAmounts ?? { stocks: 0, bonds: 0, cash: 0 };

      const netPortfolioChange = stockAmount + bondAmount + cashAmount + annualContributions - annualWithdrawals;

      return {
        year: idx,
        age,
        phaseName: formattedPhaseName,
        totalPortfolioValue,
        annualReturns: stockAmount + bondAmount + cashAmount,
        annualContributions,
        annualWithdrawals,
        netPortfolioChange,
        stockHoldings,
        bondHoldings,
        cashHoldings,
        taxableValue,
        taxDeferredValue,
        taxFreeValue,
        cashSavings,
        assetValue,
        assetEquity,
        securedDebtBalance,
        unsecuredDebtBalance,
        totalDebtBalance,
        netWorth,
        annualAssetAppreciation,
        annualPurchasedAssetValue,
        annualSoldAssetValue,
        netAssetChange,
        annualDebtIncurred,
        annualDebtPaydown,
        annualDebtPayoff,
        netDebtReduction,
        netWorthChange: netPortfolioChange + netAssetChange + netDebtReduction,
        historicalYear,
      };
    });
  }

  /**
   * Extracts year-by-year cash flow table data
   * @param simulation - A single simulation result
   * @returns Array of table rows with income, expenses, taxes, and savings per year
   */
  static extractSingleSimulationCashFlowData(simulation: SimulationResult): SingleSimulationCashFlowTableRow[] {
    const historicalRanges = simulation.context.historicalRanges ?? null;

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = getHistoricalYear(historicalRanges, idx);
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
          taxFreeIncome: null,
          incomeTax: null,
          ficaTax: null,
          capGainsTax: null,
          niit: null,
          earlyWithdrawalPenalties: null,
          totalTaxesAndPenalties: null,
          expenses: null,
          debtPayments: null,
          surplusDeficit: null,
          savingsRate: null,
          amountInvested: null,
          amountLiquidated: null,
          assetPurchaseOutlay: null,
          assetSaleProceeds: null,
          netCashFlow: null,
          historicalYear,
        };
      }

      const { incomeTax, ficaTax, capGainsTax, niit, earlyWithdrawalPenalties, totalTaxesAndPenalties } =
        SimulationDataExtractor.getTaxAmountsByType(data);
      const {
        earnedIncome,
        socialSecurityIncome,
        taxFreeIncome,
        employerMatch,
        totalExpenses: expenses,
        totalDebtPayments: debtPayments,
        surplusDeficit,
        amountInvested,
        amountLiquidated,
        assetPurchaseOutlay,
        assetSaleProceeds,
        netCashFlow,
      } = SimulationDataExtractor.getCashFlowData(data);
      const savingsRate = SimulationDataExtractor.getSavingsRate(data);

      return {
        year: idx,
        age,
        phaseName: formattedPhaseName,
        earnedIncome,
        employerMatch,
        socialSecurityIncome,
        taxFreeIncome,
        incomeTax,
        ficaTax,
        capGainsTax,
        niit,
        earlyWithdrawalPenalties,
        totalTaxesAndPenalties,
        expenses,
        debtPayments,
        surplusDeficit,
        savingsRate,
        amountInvested,
        amountLiquidated,
        assetPurchaseOutlay,
        assetSaleProceeds,
        netCashFlow,
        historicalYear,
      };
    });
  }

  /**
   * Extracts year-by-year tax table data with income sources and bracket details
   * @param simulation - A single simulation result
   * @returns Array of table rows with detailed tax breakdowns per year
   */
  static extractSingleSimulationTaxesData(simulation: SimulationResult): SingleSimulationTaxesTableRow[] {
    const historicalRanges = simulation.context.historicalRanges ?? null;

    let cumulativeIncomeTax = 0;
    let cumulativeFicaTax = 0;
    let cumulativeCapGainsTax = 0;
    let cumulativeNiit = 0;
    let cumulativeEarlyWithdrawalPenalties = 0;
    let cumulativeTotalTaxesAndPenalties = 0;

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = getHistoricalYear(historicalRanges, idx);
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
          maxTaxablePercentage: null,
          actualTaxablePercentage: null,
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
          annualTotalTaxesAndPenalties: null,
          cumulativeTotalTaxesAndPenalties: null,
          taxFreeIncome: null,
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

      const taxesData = data.taxes!;

      return {
        year: idx,
        age,
        phaseName: formattedPhaseName,
        grossIncome: taxesData.incomeSources.grossIncome,
        adjustedGrossIncome: taxesData.incomeSources.adjustedGrossIncome,
        taxableIncome: taxesData.totalTaxableIncome,
        earnedIncome: taxesData.incomeSources.earnedIncome,
        taxableRetirementDistributions: taxesData.incomeSources.taxableRetirementDistributions,
        taxableInterestIncome: taxesData.incomeSources.taxableInterestIncome,
        annualIncomeTax,
        cumulativeIncomeTax,
        annualFicaTax,
        cumulativeFicaTax,
        effectiveIncomeTaxRate: taxesData.incomeTaxes.effectiveIncomeTaxRate,
        topMarginalIncomeTaxRate: taxesData.incomeTaxes.topMarginalIncomeTaxRate,
        socialSecurityIncome: taxesData.incomeSources.socialSecurityIncome,
        taxableSocialSecurityIncome: taxesData.socialSecurityTaxes.taxableSocialSecurityIncome,
        provisionalIncome: taxesData.socialSecurityTaxes.provisionalIncome,
        maxTaxablePercentage: taxesData.socialSecurityTaxes.maxTaxablePercentage,
        actualTaxablePercentage: taxesData.socialSecurityTaxes.actualTaxablePercentage,
        realizedGains: taxesData.incomeSources.realizedGains,
        taxableDividendIncome: taxesData.incomeSources.taxableDividendIncome,
        annualCapGainsTax,
        cumulativeCapGainsTax,
        effectiveCapGainsTaxRate: taxesData.capitalGainsTaxes.effectiveCapitalGainsTaxRate,
        topMarginalCapGainsTaxRate: taxesData.capitalGainsTaxes.topMarginalCapitalGainsTaxRate,
        netInvestmentIncome: taxesData.niit.netInvestmentIncome,
        incomeSubjectToNiit: taxesData.niit.incomeSubjectToNiit,
        annualNiit,
        cumulativeNiit,
        annualEarlyWithdrawalPenalties,
        cumulativeEarlyWithdrawalPenalties,
        annualTotalTaxesAndPenalties,
        cumulativeTotalTaxesAndPenalties,
        taxFreeIncome: taxesData.incomeSources.taxFreeIncome,
        taxDeductibleContributions: taxesData.adjustments.taxDeductibleContributions,
        standardDeduction: taxesData.deductions.standardDeduction,
        capitalLossDeduction: taxesData.incomeTaxes.capitalLossDeduction ?? null,
        historicalYear,
      };
    });
  }

  /**
   * Extracts year-by-year returns table data with gains by asset class and tax category
   * @param simulation - A single simulation result
   * @returns Array of table rows with return rates and gain amounts per year
   */
  static extractSingleSimulationReturnsData(simulation: SimulationResult): SingleSimulationReturnsTableRow[] {
    const historicalRanges = simulation.context.historicalRanges ?? null;

    let cumulativeAssetAppreciation = 0;

    let stockProduct = 1;
    let bondProduct = 1;
    let cashProduct = 1;

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = getHistoricalYear(historicalRanges, idx);
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
          stockCagr: null,
          cumulativeStockGain: null,
          annualStockGain: null,
          stockHoldings: null,
          bondReturnRate: null,
          bondCagr: null,
          cumulativeBondGain: null,
          annualBondGain: null,
          bondHoldings: null,
          cashReturnRate: null,
          cashCagr: null,
          cumulativeCashGain: null,
          annualCashGain: null,
          cashHoldings: null,
          inflationRate: null,
          annualAssetAppreciation: null,
          cumulativeAssetAppreciation: null,
          historicalYear,
        };
      }

      const { stockHoldings, bondHoldings, cashHoldings } = SimulationDataExtractor.getHoldingsByAssetClass(data);

      const returnsData = data.returns!;

      const totalCumulativeGains = sumReturnAmounts(returnsData.cumulativeReturnAmounts);
      const totalAnnualGains = sumReturnAmounts(returnsData.returnAmounts);

      const { taxableGains, taxDeferredGains, taxFreeGains, cashSavingsGains } = SimulationDataExtractor.getGainsByTaxCategory(data);

      const physicalAssetsData = data.physicalAssets!;

      const annualAssetAppreciation = physicalAssetsData.totalAppreciation;
      cumulativeAssetAppreciation += annualAssetAppreciation;

      stockProduct *= 1 + returnsData.annualReturnRates.stocks;
      bondProduct *= 1 + returnsData.annualReturnRates.bonds;
      cashProduct *= 1 + returnsData.annualReturnRates.cash;
      const n = idx;

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
        stockCagr: Math.pow(stockProduct, 1 / n) - 1,
        annualStockGain: returnsData?.returnAmounts.stocks ?? null,
        stockHoldings,
        bondReturnRate: returnsData?.annualReturnRates.bonds ?? null,
        cumulativeBondGain: returnsData?.cumulativeReturnAmounts.bonds ?? null,
        bondCagr: Math.pow(bondProduct, 1 / n) - 1,
        annualBondGain: returnsData?.returnAmounts.bonds ?? null,
        bondHoldings,
        cashReturnRate: returnsData?.annualReturnRates.cash ?? null,
        cumulativeCashGain: returnsData?.cumulativeReturnAmounts.cash ?? null,
        cashCagr: Math.pow(cashProduct, 1 / n) - 1,
        annualCashGain: returnsData?.returnAmounts.cash ?? null,
        cashHoldings,
        inflationRate: returnsData?.annualInflationRate ?? null,
        annualAssetAppreciation,
        cumulativeAssetAppreciation,
        historicalYear,
      };
    });
  }

  /**
   * Extracts year-by-year contributions table data
   * @param simulation - A single simulation result
   * @returns Array of table rows with contribution amounts by tax category per year
   */
  static extractSingleSimulationContributionsData(simulation: SimulationResult): SingleSimulationContributionsTableRow[] {
    const historicalRanges = simulation.context.historicalRanges ?? null;

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = getHistoricalYear(historicalRanges, idx);
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
      const annualContributions = sumFlows(portfolioData.contributions);
      const cumulativeContributions = sumFlows(portfolioData.cumulativeContributions);
      const annualEmployerMatch = portfolioData.employerMatch;

      const { taxableContributions, taxDeferredContributions, taxFreeContributions, cashSavingsContributions } =
        SimulationDataExtractor.getContributionsByTaxCategory(data);
      const { surplusDeficit } = SimulationDataExtractor.getCashFlowData(data);
      const savingsRate = SimulationDataExtractor.getSavingsRate(data);

      return {
        year: idx,
        age,
        phaseName: formattedPhaseName,
        annualContributions,
        cumulativeContributions,
        stockContributions: portfolioData.contributions.stocks,
        bondContributions: portfolioData.contributions.bonds,
        cashContributions: portfolioData.contributions.cash,
        taxableContributions,
        taxDeferredContributions,
        taxFreeContributions,
        cashSavingsContributions,
        annualEmployerMatch,
        cumulativeEmployerMatch: portfolioData.cumulativeEmployerMatch,
        totalPortfolioValue,
        surplusDeficit,
        savingsRate,
        annualShortfallRepaid: portfolioData.shortfallRepaid,
        outstandingShortfall: portfolioData.outstandingShortfall,
        historicalYear,
      };
    });
  }

  /**
   * Extracts year-by-year withdrawals table data
   * @param simulation - A single simulation result
   * @returns Array of table rows with withdrawal amounts, RMDs, and shortfalls per year
   */
  static extractSingleSimulationWithdrawalsData(simulation: SimulationResult): SingleSimulationWithdrawalsTableRow[] {
    const historicalRanges = simulation.context.historicalRanges ?? null;

    let cumulativeEarlyWithdrawals = 0;

    return simulation.data.map((data, idx) => {
      const historicalYear: number | null = getHistoricalYear(historicalRanges, idx);
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
      const annualWithdrawals = sumFlows(portfolioData.withdrawals);
      const cumulativeWithdrawals = sumFlows(portfolioData.cumulativeWithdrawals);

      const { taxableWithdrawals, taxDeferredWithdrawals, taxFreeWithdrawals, cashSavingsWithdrawals } =
        SimulationDataExtractor.getWithdrawalsByTaxCategory(data, age);

      const annualEarlyWithdrawals = SimulationDataExtractor.getEarlyWithdrawals(data, age);
      cumulativeEarlyWithdrawals += annualEarlyWithdrawals;

      const { surplusDeficit } = SimulationDataExtractor.getCashFlowData(data);
      const withdrawalRate = SimulationDataExtractor.getWithdrawalRate(data);

      return {
        year: idx,
        age,
        phaseName: formattedPhaseName,
        annualWithdrawals,
        cumulativeWithdrawals,
        stockWithdrawals: portfolioData.withdrawals.stocks,
        bondWithdrawals: portfolioData.withdrawals.bonds,
        cashWithdrawals: portfolioData.withdrawals.cash,
        taxableWithdrawals,
        taxDeferredWithdrawals,
        taxFreeWithdrawals,
        cashSavingsWithdrawals,
        annualRealizedGains: portfolioData.realizedGains,
        cumulativeRealizedGains: portfolioData.cumulativeRealizedGains,
        annualRequiredMinimumDistributions: portfolioData.rmds,
        cumulativeRequiredMinimumDistributions: portfolioData.cumulativeRmds,
        annualEarlyWithdrawals,
        cumulativeEarlyWithdrawals,
        annualRothEarningsWithdrawals: portfolioData.earningsWithdrawn,
        cumulativeRothEarningsWithdrawals: portfolioData.cumulativeEarningsWithdrawn,
        totalPortfolioValue,
        surplusDeficit,
        withdrawalRate,
        annualShortfall: portfolioData.shortfall,
        outstandingShortfall: portfolioData.outstandingShortfall,
        historicalYear,
      };
    });
  }

  // ================================
  // MULTI SIMULATION DATA EXTRACTION
  // ================================

  /**
   * Extracts per-simulation summary rows for multi-simulation results
   * @param simulations - Multi-simulation result set
   * @returns Array of summary rows with one row per simulation run
   */
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
      const lifetimeReturns = sumReturnAmounts(cumulativeReturnAmounts);

      const lifetimeContributions = sumFlows(lastDp.portfolio.cumulativeContributions);
      const lifetimeWithdrawals = sumFlows(lastDp.portfolio.cumulativeWithdrawals);

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

  /**
   * Extracts year-by-year aggregate data with percentile bands across all simulations
   * @param simulations - Multi-simulation result set
   * @returns Array of aggregate rows with phase distributions and portfolio percentiles per year
   */
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
}
