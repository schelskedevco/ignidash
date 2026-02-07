import type {
  SingleSimulationNetWorthChartDataPoint,
  SingleSimulationCashFlowChartDataPoint,
  SingleSimulationTaxesChartDataPoint,
  SingleSimulationReturnsChartDataPoint,
  SingleSimulationContributionsChartDataPoint,
  SingleSimulationWithdrawalsChartDataPoint,
  MultiSimulationPortfolioChartDataPoint,
  MultiSimulationPhasesChartDataPoint,
} from '@/lib/types/chart-data-points';
import { type Percentiles, StatsUtils } from '@/lib/utils/stats-utils';
import { sumTransactions, sumReturnAmounts } from '@/lib/calc/asset';

import type { SimulationResult, MultiSimulationResult } from '../simulation-engine';
import { SimulationDataExtractor } from './simulation-data-extractor';

export abstract class ChartDataExtractor {
  // ================================
  // SINGLE SIMULATION DATA EXTRACTION
  // ================================

  static extractSingleSimulationNetWorthData(simulation: SimulationResult): SingleSimulationNetWorthChartDataPoint[] {
    return simulation.data.map((data) => {
      const age = Math.floor(data.age);

      const { stockHoldings, bondHoldings, cashHoldings } = SimulationDataExtractor.getHoldingsByAssetClass(data);
      const { taxableValue, taxDeferredValue, taxFreeValue, cashSavings } = SimulationDataExtractor.getPortfolioValueByTaxCategory(data);

      const returnsData = data.returns;

      const {
        stocks: stockAmount,
        bonds: bondAmount,
        cash: cashAmount,
      } = returnsData?.returnAmountsForPeriod ?? { stocks: 0, bonds: 0, cash: 0 };

      const portfolioData = data.portfolio;
      const portfolioValue = portfolioData.totalValue;

      const annualContributions = sumTransactions(portfolioData.contributionsForPeriod);
      const annualWithdrawals = sumTransactions(portfolioData.withdrawalsForPeriod);

      const netPortfolioChange = stockAmount + bondAmount + cashAmount + annualContributions - annualWithdrawals;

      const {
        marketValue: assetValue,
        equity: assetEquity,
        securedDebtBalance,
        unsecuredDebtBalance,
        debtBalance,
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

      const netWorthChange = netPortfolioChange + netAssetChange + netDebtReduction;

      return {
        age,
        stockHoldings,
        bondHoldings,
        cashHoldings,
        taxableValue,
        taxDeferredValue,
        taxFreeValue,
        cashSavings,
        portfolioValue,
        annualReturns: stockAmount + bondAmount + cashAmount,
        annualContributions,
        annualWithdrawals,
        netPortfolioChange,
        assetValue,
        assetEquity,
        securedDebtBalance,
        unsecuredDebtBalance,
        debtBalance,
        netWorth,
        annualAssetAppreciation,
        annualPurchasedAssetValue,
        annualSoldAssetValue,
        netAssetChange,
        annualDebtIncurred,
        annualDebtPaydown,
        annualDebtPayoff,
        netDebtReduction,
        netWorthChange,
        perAccountData: Object.values(portfolioData.perAccountData),
        perAssetData: Object.values(data.physicalAssets?.perAssetData ?? {}),
        perDebtData: Object.values(data.debts?.perDebtData ?? {}),
      };
    });
  }

  static extractSingleSimulationCashFlowData(simulation: SimulationResult): SingleSimulationCashFlowChartDataPoint[] {
    return simulation.data.slice(1).map((data) => {
      const age = Math.floor(data.age);

      const {
        incomeTax,
        ficaTax,
        capGainsTax,
        niit,
        earlyWithdrawalPenalties,
        totalTaxesAndPenalties: taxesAndPenalties,
      } = SimulationDataExtractor.getTaxAmountsByType(data);
      const {
        totalIncome: income,
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
        age,
        earnedIncome,
        employerMatch,
        socialSecurityIncome,
        taxFreeIncome,
        income,
        incomeTax,
        ficaTax,
        capGainsTax,
        niit,
        earlyWithdrawalPenalties,
        taxesAndPenalties,
        expenses,
        debtPayments,
        surplusDeficit,
        savingsRate,
        amountInvested,
        amountLiquidated,
        assetPurchaseOutlay,
        assetSaleProceeds,
        netCashFlow,
        perIncomeData: Object.values(data.incomes!.perIncomeData),
        perExpenseData: Object.values(data.expenses!.perExpenseData),
        perAssetData: Object.values(data.physicalAssets!.perAssetData),
        perDebtData: Object.values(data.debts!.perDebtData),
      };
    });
  }

  static extractSingleSimulationTaxesData(simulation: SimulationResult): SingleSimulationTaxesChartDataPoint[] {
    let cumulativeIncomeTax = 0;
    let cumulativeFicaTax = 0;
    let cumulativeCapGainsTax = 0;
    let cumulativeNiit = 0;
    let cumulativeEarlyWithdrawalPenalties = 0;
    let cumulativeTotalTaxesAndPenalties = 0;

    return simulation.data.slice(1).map((data) => {
      const age = Math.floor(data.age);

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
        age,
        grossIncome: taxesData.incomeSources.grossIncome,
        adjustedGrossIncome: taxesData.incomeSources.adjustedGrossIncome,
        taxableIncome: taxesData.totalTaxableIncome,
        earnedIncome: taxesData.incomeSources.earnedIncome,
        annualFicaTax,
        cumulativeFicaTax,
        taxDeferredWithdrawals: taxesData.incomeSources.taxDeferredWithdrawals,
        earlyRothEarningsWithdrawals: taxesData.incomeSources.earlyWithdrawals.rothEarnings,
        taxableRetirementDistributions: taxesData.incomeSources.taxableRetirementDistributions,
        taxableInterestIncome: taxesData.incomeSources.taxableInterestIncome,
        taxableIncomeTaxedAsOrdinary: taxesData.incomeTaxes.taxableIncomeTaxedAsOrdinary,
        adjustedIncomeTaxedAsOrdinary: taxesData.incomeSources.adjustedIncomeTaxedAsOrdinary,
        incomeTaxedAsOrdinary: taxesData.incomeSources.incomeTaxedAsOrdinary,
        annualIncomeTax,
        cumulativeIncomeTax,
        effectiveIncomeTaxRate: taxesData.incomeTaxes.effectiveIncomeTaxRate,
        topMarginalIncomeTaxRate: taxesData.incomeTaxes.topMarginalIncomeTaxRate,
        incomeTaxBrackets: taxesData.incomeTaxes.incomeTaxBrackets,
        socialSecurityIncome: taxesData.incomeSources.socialSecurityIncome,
        taxableSocialSecurityIncome: taxesData.socialSecurityTaxes.taxableSocialSecurityIncome,
        maxTaxablePercentage: taxesData.socialSecurityTaxes.maxTaxablePercentage,
        actualTaxablePercentage: taxesData.socialSecurityTaxes.actualTaxablePercentage,
        realizedGains: taxesData.incomeSources.realizedGains,
        taxableDividendIncome: taxesData.incomeSources.taxableDividendIncome,
        taxableIncomeTaxedAsCapGains: taxesData.capitalGainsTaxes.taxableIncomeTaxedAsCapGains,
        adjustedIncomeTaxedAsCapGains: taxesData.incomeSources.adjustedIncomeTaxedAsCapGains,
        incomeTaxedAsLtcg: taxesData.incomeSources.incomeTaxedAsLtcg,
        annualCapGainsTax,
        cumulativeCapGainsTax,
        effectiveCapGainsTaxRate: taxesData.capitalGainsTaxes.effectiveCapitalGainsTaxRate,
        topMarginalCapGainsTaxRate: taxesData.capitalGainsTaxes.topMarginalCapitalGainsTaxRate,
        capitalGainsTaxBrackets: taxesData.capitalGainsTaxes.capitalGainsTaxBrackets,
        netInvestmentIncome: taxesData.niit.netInvestmentIncome,
        incomeSubjectToNiit: taxesData.niit.incomeSubjectToNiit,
        annualNiit,
        cumulativeNiit,
        niitThreshold: taxesData.niit.threshold,
        annualEarlyWithdrawalPenalties,
        cumulativeEarlyWithdrawalPenalties,
        annualTotalTaxesAndPenalties,
        cumulativeTotalTaxesAndPenalties,
        taxFreeIncome: taxesData.incomeSources.taxFreeIncome,
        adjustments: taxesData.adjustments,
        deductions: taxesData.deductions,
        taxDeductibleContributions: taxesData.adjustments.taxDeductibleContributions ?? 0,
        standardDeduction: taxesData.deductions.standardDeduction ?? 0,
        capitalLossDeduction: taxesData.incomeTaxes.capitalLossDeduction ?? 0,
      };
    });
  }

  static extractSingleSimulationReturnsData(simulation: SimulationResult): SingleSimulationReturnsChartDataPoint[] {
    let cumulativeAssetAppreciation = 0;

    return simulation.data.slice(1).map((data) => {
      const age = Math.floor(data.age);

      const returnsData = data.returns!;

      const totalCumulativeGains = sumReturnAmounts(returnsData.cumulativeReturnAmounts);
      const totalAnnualGains = sumReturnAmounts(returnsData.returnAmountsForPeriod);

      const { taxableGains, taxDeferredGains, taxFreeGains, cashSavingsGains } = SimulationDataExtractor.getGainsByTaxCategory(data);

      const physicalAssetsData = data.physicalAssets!;

      const annualAssetAppreciation = physicalAssetsData.totalAppreciation;
      cumulativeAssetAppreciation += annualAssetAppreciation;

      return {
        age,
        realStockReturnRate: returnsData.annualReturnRates.stocks,
        realBondReturnRate: returnsData.annualReturnRates.bonds,
        realCashReturnRate: returnsData.annualReturnRates.cash,
        inflationRate: returnsData.annualInflationRate,
        cumulativeStockGain: returnsData.cumulativeReturnAmounts.stocks,
        cumulativeBondGain: returnsData.cumulativeReturnAmounts.bonds,
        cumulativeCashGain: returnsData.cumulativeReturnAmounts.cash,
        totalCumulativeGains,
        annualStockGain: returnsData.returnAmountsForPeriod.stocks,
        annualBondGain: returnsData.returnAmountsForPeriod.bonds,
        annualCashGain: returnsData.returnAmountsForPeriod.cash,
        totalAnnualGains,
        taxableGains,
        taxDeferredGains,
        taxFreeGains,
        cashSavingsGains,
        annualAssetAppreciation,
        cumulativeAssetAppreciation,
        perAccountData: Object.values(returnsData.perAccountData),
        perAssetData: Object.values(physicalAssetsData.perAssetData),
      };
    });
  }

  static extractSingleSimulationContributionsData(simulation: SimulationResult): SingleSimulationContributionsChartDataPoint[] {
    return simulation.data.slice(1).map((data) => {
      const age = Math.floor(data.age);

      const portfolioData = data.portfolio;
      const annualContributions = sumTransactions(portfolioData.contributionsForPeriod);
      const cumulativeContributions = sumTransactions(portfolioData.cumulativeContributions);

      const { taxableContributions, taxDeferredContributions, taxFreeContributions, cashSavingsContributions } =
        SimulationDataExtractor.getContributionsByTaxCategory(data);

      return {
        age,
        annualContributions,
        cumulativeContributions,
        annualStockContributions: portfolioData.contributionsForPeriod.stocks,
        cumulativeStockContributions: portfolioData.cumulativeContributions.stocks,
        annualBondContributions: portfolioData.contributionsForPeriod.bonds,
        cumulativeBondContributions: portfolioData.cumulativeContributions.bonds,
        annualCashContributions: portfolioData.contributionsForPeriod.cash,
        cumulativeCashContributions: portfolioData.cumulativeContributions.cash,
        annualEmployerMatch: portfolioData.employerMatchForPeriod,
        cumulativeEmployerMatch: portfolioData.cumulativeEmployerMatch,
        perAccountData: Object.values(portfolioData.perAccountData),
        taxableContributions,
        taxDeferredContributions,
        taxFreeContributions,
        cashSavingsContributions,
        annualShortfallRepaid: portfolioData.shortfallRepaidForPeriod,
        outstandingShortfall: portfolioData.outstandingShortfall,
      };
    });
  }

  static extractSingleSimulationWithdrawalsData(simulation: SimulationResult): SingleSimulationWithdrawalsChartDataPoint[] {
    let cumulativeEarlyWithdrawals = 0;

    return simulation.data.slice(1).map((data) => {
      const age = Math.floor(data.age);

      const portfolioData = data.portfolio;
      const annualWithdrawals = sumTransactions(portfolioData.withdrawalsForPeriod);
      const cumulativeWithdrawals = sumTransactions(portfolioData.cumulativeWithdrawals);

      const { taxableWithdrawals, taxDeferredWithdrawals, taxFreeWithdrawals, cashSavingsWithdrawals } =
        SimulationDataExtractor.getWithdrawalsByTaxCategory(data, age);

      const annualEarlyWithdrawals = SimulationDataExtractor.getEarlyWithdrawals(data, age);
      cumulativeEarlyWithdrawals += annualEarlyWithdrawals;

      const withdrawalRate = SimulationDataExtractor.getWithdrawalRate(data);

      return {
        age,
        rmdAge: simulation.context.rmdAge,
        annualWithdrawals,
        cumulativeWithdrawals,
        annualStockWithdrawals: portfolioData.withdrawalsForPeriod.stocks,
        cumulativeStockWithdrawals: portfolioData.cumulativeWithdrawals.stocks,
        annualBondWithdrawals: portfolioData.withdrawalsForPeriod.bonds,
        cumulativeBondWithdrawals: portfolioData.cumulativeWithdrawals.bonds,
        annualCashWithdrawals: portfolioData.withdrawalsForPeriod.cash,
        cumulativeCashWithdrawals: portfolioData.cumulativeWithdrawals.cash,
        annualRealizedGains: portfolioData.realizedGainsForPeriod,
        cumulativeRealizedGains: portfolioData.cumulativeRealizedGains,
        annualRequiredMinimumDistributions: portfolioData.rmdsForPeriod,
        cumulativeRequiredMinimumDistributions: portfolioData.cumulativeRmds,
        annualRothEarningsWithdrawals: portfolioData.earningsWithdrawnForPeriod,
        cumulativeRothEarningsWithdrawals: portfolioData.cumulativeEarningsWithdrawn,
        annualEarlyWithdrawals,
        cumulativeEarlyWithdrawals,
        perAccountData: Object.values(portfolioData.perAccountData),
        taxableWithdrawals,
        taxDeferredWithdrawals,
        taxFreeWithdrawals,
        cashSavingsWithdrawals,
        withdrawalRate,
        annualShortfall: portfolioData.shortfallForPeriod,
        outstandingShortfall: portfolioData.outstandingShortfall,
      };
    });
  }

  // ================================
  // MULTI SIMULATION DATA EXTRACTION
  // ================================

  static extractMultiSimulationPortfolioData(simulations: MultiSimulationResult): MultiSimulationPortfolioChartDataPoint[] {
    const res: MultiSimulationPortfolioChartDataPoint[] = [];

    const simulationLength = simulations.simulations[0][1].data.length;

    for (let i = 0; i < simulationLength; i++) {
      if (simulations.simulations[i][1].data.length !== simulationLength) {
        throw new Error('All simulations must have the same length for yearly aggregate data extraction.');
      }

      const age = Math.floor(simulations.simulations[0][1].data[i].age);

      const totalPortfolioValues = simulations.simulations.map(([, sim]) => sim.data[i].portfolio.totalValue);
      const sortedValues = totalPortfolioValues.sort((a, b) => a - b);
      const percentiles: Percentiles<number> = StatsUtils.calculatePercentilesFromValues(sortedValues);

      res.push({
        age,
        meanPortfolioValue: StatsUtils.mean(totalPortfolioValues),
        minPortfolioValue: StatsUtils.minFromSorted(sortedValues),
        maxPortfolioValue: StatsUtils.maxFromSorted(sortedValues),
        stdDevPortfolioValue: StatsUtils.standardDeviation(totalPortfolioValues),
        p10PortfolioValue: percentiles.p10,
        p25PortfolioValue: percentiles.p25,
        p50PortfolioValue: percentiles.p50,
        p75PortfolioValue: percentiles.p75,
        p90PortfolioValue: percentiles.p90,
      });
    }

    return res;
  }

  static extractMultiSimulationPhasesData(simulations: MultiSimulationResult): MultiSimulationPhasesChartDataPoint[] {
    const res: MultiSimulationPhasesChartDataPoint[] = [];

    const simulationLength = simulations.simulations[0][1].data.length;

    const startAge = simulations.simulations[0][1].context.startAge;

    const milestonesData = simulations.simulations.map(([, sim]) => SimulationDataExtractor.getMilestonesData(sim.data, startAge));

    const sortedYearsToRetirement = milestonesData
      .map((m) => m.yearsToRetirement)
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);
    const sortedRetirementAge = milestonesData
      .map((m) => m.retirementAge)
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);
    const sortedYearsToBankruptcy = milestonesData
      .map((m) => m.yearsToBankruptcy)
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);
    const sortedBankruptcyAge = milestonesData
      .map((m) => m.bankruptcyAge)
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

    const chanceOfRetirement = sortedYearsToRetirement.length / milestonesData.length;
    const chanceOfBankruptcy = sortedYearsToBankruptcy.length / milestonesData.length;

    const meanYearsToRetirement = StatsUtils.mean(sortedYearsToRetirement);
    const minYearsToRetirement = StatsUtils.minFromSorted(sortedYearsToRetirement);
    const maxYearsToRetirement = StatsUtils.maxFromSorted(sortedYearsToRetirement);

    const meanRetirementAge = StatsUtils.mean(sortedRetirementAge);
    const minRetirementAge = StatsUtils.minFromSorted(sortedRetirementAge);
    const maxRetirementAge = StatsUtils.maxFromSorted(sortedRetirementAge);

    const meanYearsToBankruptcy = StatsUtils.mean(sortedYearsToBankruptcy);
    const minYearsToBankruptcy = StatsUtils.minFromSorted(sortedYearsToBankruptcy);
    const maxYearsToBankruptcy = StatsUtils.maxFromSorted(sortedYearsToBankruptcy);

    const meanBankruptcyAge = StatsUtils.mean(sortedBankruptcyAge);
    const minBankruptcyAge = StatsUtils.minFromSorted(sortedBankruptcyAge);
    const maxBankruptcyAge = StatsUtils.maxFromSorted(sortedBankruptcyAge);

    for (let i = 0; i < simulationLength; i++) {
      if (simulations.simulations[i][1].data.length !== simulationLength) {
        throw new Error('All simulations must have the same length for yearly aggregate data extraction.');
      }

      const age = Math.floor(simulations.simulations[0][1].data[i].age);

      const { percentAccumulation, numberAccumulation, percentRetirement, numberRetirement, percentBankrupt, numberBankrupt } =
        SimulationDataExtractor.getPercentInPhaseForYear(simulations, i);

      res.push({
        age,
        percentAccumulation,
        numberAccumulation,
        percentRetirement,
        numberRetirement,
        percentBankrupt,
        numberBankrupt,
        chanceOfRetirement,
        chanceOfBankruptcy,
        meanYearsToRetirement,
        minYearsToRetirement,
        maxYearsToRetirement,
        meanYearsToBankruptcy,
        minYearsToBankruptcy,
        maxYearsToBankruptcy,
        meanRetirementAge,
        minRetirementAge,
        maxRetirementAge,
        meanBankruptcyAge,
        minBankruptcyAge,
        maxBankruptcyAge,
      });
    }

    return res;
  }
}
