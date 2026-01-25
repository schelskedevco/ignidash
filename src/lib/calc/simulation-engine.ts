import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';
import { type TimelineInputs, type RetirementStrategyInputs, calculatePreciseAge } from '@/lib/schemas/inputs/timeline-form-schema';

import type { ReturnsProvider } from './returns-providers/returns-provider';
import { StochasticReturnsProvider } from './returns-providers/stochastic-returns-provider';
import { LcgHistoricalBacktestReturnsProvider } from './returns-providers/lcg-historical-backtest-returns-provider';

import { Portfolio, type PortfolioData, PortfolioProcessor } from './portfolio';
import type { AccountDataWithTransactions } from './account';
import { ContributionRules } from './contribution-rules';
import { PhaseIdentifier, type PhaseData } from './phase';
import { ReturnsProcessor, type ReturnsData } from './returns';
import { Incomes, IncomesProcessor, type IncomesData } from './incomes';
import { Expenses, ExpensesProcessor, type ExpensesData } from './expenses';
import { Debts, DebtsProcessor, type DebtsData } from './debts';
import { PhysicalAssets, PhysicalAssetsProcessor, type PhysicalAssetsData } from './physical-assets';
import { TaxProcessor, type TaxesData } from './taxes';

/**
 * Tax convergence threshold in dollars.
 * The iterative tax reconciliation loop converges when the remaining taxes due
 * are within this threshold, leaving small residual values in cash flow calculations.
 */
export const TAX_CONVERGENCE_THRESHOLD = 1;

type ISODateString = string;

export interface SimulationDataPoint {
  date: ISODateString;
  age: number;
  portfolio: PortfolioData;
  incomes: IncomesData | null;
  expenses: ExpensesData | null;
  debts: DebtsData | null;
  physicalAssets: PhysicalAssetsData | null;
  phase: PhaseData | null;
  taxes: TaxesData | null;
  returns: ReturnsData | null;
}

export interface SimulationResult {
  data: Array<SimulationDataPoint>;
  context: {
    startAge: number;
    endAge: number;
    yearsToSimulate: number;
    startDate: ISODateString;
    endDate: ISODateString;
    retirementStrategy: RetirementStrategyInputs;
    rmdAge: number;
    historicalRanges?: Array<{ startYear: number; endYear: number }>;
  };
}

export interface SimulationContext {
  readonly startAge: number;
  readonly endAge: number;
  readonly yearsToSimulate: number;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly retirementStrategy: RetirementStrategyInputs;
  readonly rmdAge: number;
}

export interface SimulationState {
  time: { date: Date; age: number; year: number; month: number };
  portfolio: Portfolio;
  phase: PhaseData | null;
  annualData: { expenses: ExpensesData[] };
}

export class FinancialSimulationEngine {
  constructor(protected readonly inputs: SimulatorInputs) {}

  runSimulation(returnsProvider: ReturnsProvider, timeline: TimelineInputs): SimulationResult {
    // Init context and state
    const simulationContext: SimulationContext = this.initSimulationContext(timeline);
    const simulationState: SimulationState = this.initSimulationState(simulationContext);

    const incomes = new Incomes(Object.values(this.inputs.incomes));
    const expenses = new Expenses(Object.values(this.inputs.expenses));
    const debts = new Debts(Object.values(this.inputs.debts));
    const physicalAssets = new PhysicalAssets(Object.values(this.inputs.physicalAssets));
    const contributionRules = new ContributionRules(Object.values(this.inputs.contributionRules), this.inputs.baseContributionRule);

    const resultData: Array<SimulationDataPoint> = [this.initSimulationDataPoint(simulationState)];

    // Init simulation processors
    const returnsProcessor = new ReturnsProcessor(simulationState, returnsProvider);
    const incomesProcessor = new IncomesProcessor(simulationState, incomes);
    const expensesProcessor = new ExpensesProcessor(simulationState, expenses);
    const debtsProcessor = new DebtsProcessor(simulationState, debts);
    const physicalAssetsProcessor = new PhysicalAssetsProcessor(simulationState, physicalAssets);
    const portfolioProcessor = new PortfolioProcessor(simulationState, simulationContext, contributionRules, this.inputs.glidePath);
    const taxProcessor = new TaxProcessor(simulationState, this.inputs.taxSettings.filingStatus);

    // Init phase identifier
    const phaseIdentifier = new PhaseIdentifier(simulationState, timeline);
    simulationState.phase = phaseIdentifier.getCurrentPhase();

    while (simulationState.time.date < simulationContext.endDate) {
      this.incrementSimulationTime(simulationState, simulationContext);

      // Handle RMDs at start of year, before any other processing
      if (simulationState.time.age >= simulationContext.rmdAge && simulationState.time.month % 12 === 1)
        portfolioProcessor.processRequiredMinimumDistributions();

      // Process one month of simulation
      returnsProcessor.process();
      const incomesData = incomesProcessor.process();
      const expensesData = expensesProcessor.process();
      const physicalAssetsData = physicalAssetsProcessor.process();
      const debtsData = debtsProcessor.process();

      const { discretionaryExpense: monthlyDiscretionaryExpense } = portfolioProcessor.processContributionsAndWithdrawals(
        incomesData,
        expensesData,
        debtsData,
        physicalAssetsData
      );
      if (monthlyDiscretionaryExpense) expensesProcessor.processDiscretionaryExpense(monthlyDiscretionaryExpense);

      if (simulationState.time.month % 12 === 0) {
        // Get annual data from processors
        const annualPortfolioDataBeforeTaxes = portfolioProcessor.getAnnualData();
        const annualIncomesData = incomesProcessor.getAnnualData();
        const annualReturnsData = returnsProcessor.getAnnualData();
        const annualDebtsData = debtsProcessor.getAnnualData();
        const annualPhysicalAssetsData = physicalAssetsProcessor.getAnnualData();

        // Process taxes
        let annualTaxesData = taxProcessor.process(
          annualPortfolioDataBeforeTaxes,
          annualIncomesData,
          annualReturnsData,
          annualPhysicalAssetsData
        );
        const { totalTaxesDue, totalTaxesRefund } = annualTaxesData;

        // Process portfolio updates after calculating taxes
        const processTaxesResult = portfolioProcessor.processTaxes(annualPortfolioDataBeforeTaxes, { totalTaxesDue, totalTaxesRefund });
        let { portfolioData: annualPortfolioDataAfterTaxes } = processTaxesResult;
        const { discretionaryExpense: annualDiscretionaryExpense } = processTaxesResult;

        // Iteratively reconcile taxes until convergence
        let totalTaxesPaid = totalTaxesDue;
        for (let i = 0; i < 10 && totalTaxesDue > 0; i++) {
          annualTaxesData = taxProcessor.process(
            annualPortfolioDataAfterTaxes,
            annualIncomesData,
            annualReturnsData,
            annualPhysicalAssetsData
          );
          const totalTaxesDue = annualTaxesData.totalTaxesDue;

          const remainingTaxesDue = totalTaxesDue - totalTaxesPaid;
          if (Math.abs(remainingTaxesDue) < TAX_CONVERGENCE_THRESHOLD) break;

          ({ portfolioData: annualPortfolioDataAfterTaxes } = portfolioProcessor.processTaxes(annualPortfolioDataAfterTaxes, {
            totalTaxesDue: remainingTaxesDue,
            totalTaxesRefund: 0,
          }));

          totalTaxesPaid = totalTaxesDue;
        }

        // Process expenses last to account for discretionary expenses from tax refunds
        if (annualDiscretionaryExpense) expensesProcessor.processDiscretionaryExpense(annualDiscretionaryExpense);
        const annualExpensesData = expensesProcessor.getAnnualData();

        // Update simulation state
        simulationState.annualData.expenses.push(annualExpensesData);
        simulationState.phase = phaseIdentifier.getCurrentPhase();

        // Store annual data in results
        resultData.push({
          date: simulationState.time.date.toISOString().split('T')[0],
          age: simulationState.time.age,
          portfolio: annualPortfolioDataAfterTaxes,
          incomes: annualIncomesData,
          expenses: annualExpensesData,
          debts: annualDebtsData,
          physicalAssets: annualPhysicalAssetsData,
          phase: { ...simulationState.phase },
          taxes: annualTaxesData,
          returns: annualReturnsData,
        });

        // Reset monthly data for next iteration
        returnsProcessor.resetMonthlyData();
        incomesProcessor.resetMonthlyData();
        expensesProcessor.resetMonthlyData();
        debtsProcessor.resetMonthlyData();
        physicalAssetsProcessor.resetMonthlyData();
        portfolioProcessor.resetMonthlyData();
      }
    }

    const context = {
      startAge: simulationContext.startAge,
      endAge: simulationContext.endAge,
      yearsToSimulate: simulationContext.yearsToSimulate,
      startDate: simulationContext.startDate.toISOString().split('T')[0],
      endDate: simulationContext.endDate.toISOString().split('T')[0],
      retirementStrategy: simulationContext.retirementStrategy,
      rmdAge: simulationContext.rmdAge,
    };

    return { data: resultData, context };
  }

  private incrementSimulationTime(simulationState: SimulationState, simulationContext: SimulationContext): void {
    simulationState.time.month += 1;

    const monthsElapsed = simulationState.time.month;

    simulationState.time.date = new Date(
      simulationContext.startDate.getFullYear(),
      simulationContext.startDate.getMonth() + monthsElapsed,
      1
    );

    simulationState.time.age = simulationContext.startAge + monthsElapsed / 12;
    simulationState.time.year = monthsElapsed / 12;
  }

  private initSimulationContext(timeline: TimelineInputs): SimulationContext {
    const startAge = calculatePreciseAge(timeline.birthMonth, timeline.birthYear);
    const endAge = timeline.lifeExpectancy;

    const yearsToSimulate = Math.ceil(endAge - startAge);

    const startDate = new Date();
    const endDate = new Date(startDate.getFullYear() + yearsToSimulate, startDate.getMonth(), 1);

    const retirementStrategy = timeline.retirementStrategy;

    // SECURE Act 2.0: RMD age is 75 for those born 1960+, otherwise 73
    const rmdAge = timeline.birthYear >= 1960 ? 75 : 73;

    return { startAge, endAge, yearsToSimulate, startDate, endDate, retirementStrategy, rmdAge };
  }

  private initSimulationState(simulationContext: SimulationContext): SimulationState {
    const { startDate, startAge: age } = simulationContext;

    return {
      time: { date: new Date(startDate), age, year: 0, month: 0 },
      portfolio: new Portfolio(Object.values(this.inputs.accounts)),
      phase: null,
      annualData: { expenses: [] },
    };
  }

  private initSimulationDataPoint(initialSimulationState: SimulationState): SimulationDataPoint {
    const totalPortfolioValue = initialSimulationState.portfolio.getTotalValue();
    const assetAllocation = initialSimulationState.portfolio.getWeightedAssetAllocation();

    const defaultAssetTransactions = { stocks: 0, bonds: 0, cash: 0 };

    const defaultTransactionsData = {
      contributionsForPeriod: { ...defaultAssetTransactions },
      employerMatchForPeriod: 0,
      withdrawalsForPeriod: { ...defaultAssetTransactions },
      realizedGainsForPeriod: 0,
      earningsWithdrawnForPeriod: 0,
      rmdsForPeriod: 0,
    };

    const perAccountData: Record<string, AccountDataWithTransactions> = Object.fromEntries(
      initialSimulationState.portfolio
        .getAccounts()
        .map((account) => [account.getAccountID(), { ...account.getAccountData(), ...defaultTransactionsData }])
    );

    return {
      date: new Date().toISOString().split('T')[0],
      age: initialSimulationState.time.age,
      portfolio: {
        totalValue: totalPortfolioValue,
        cumulativeContributions: { ...defaultAssetTransactions },
        cumulativeEmployerMatch: 0,
        cumulativeWithdrawals: { ...defaultAssetTransactions },
        cumulativeRealizedGains: 0,
        cumulativeEarningsWithdrawn: 0,
        cumulativeRmds: 0,
        outstandingShortfall: 0,
        contributionsForPeriod: { ...defaultAssetTransactions },
        employerMatchForPeriod: 0,
        withdrawalsForPeriod: { ...defaultAssetTransactions },
        realizedGainsForPeriod: 0,
        earningsWithdrawnForPeriod: 0,
        rmdsForPeriod: 0,
        shortfallForPeriod: 0,
        shortfallRepaidForPeriod: 0,
        perAccountData,
        assetAllocation,
      },
      incomes: null,
      expenses: null,
      debts: null,
      physicalAssets: null,
      phase: null,
      taxes: null,
      returns: null,
    };
  }
}

export interface MultiSimulationResult {
  simulations: Array<[number /* seed */, SimulationResult]>;
}

export class MonteCarloSimulationEngine extends FinancialSimulationEngine {
  constructor(
    inputs: SimulatorInputs,
    private baseSeed: number
  ) {
    super(inputs);
  }

  runSingleSimulation(seed: number): SimulationResult {
    const returnsProvider = new StochasticReturnsProvider(this.inputs, seed);

    const timeline = this.inputs.timeline;
    if (!timeline) throw new Error('Must have timeline data for simulation');

    return this.runSimulation(returnsProvider, timeline);
  }

  runMonteCarloSimulation(numSimulations: number, onProgress?: () => void): MultiSimulationResult {
    const timeline = this.inputs.timeline;
    if (!timeline) throw new Error('Must have timeline data for simulation');

    const simulations: Array<[number, SimulationResult]> = [];
    for (let i = 0; i < numSimulations; i++) {
      const simulationSeed = this.baseSeed + i * 1009;
      const returnsProvider = new StochasticReturnsProvider(this.inputs, simulationSeed);

      const result = this.runSimulation(returnsProvider, timeline);
      simulations.push([simulationSeed, result]);

      if (onProgress) onProgress();
    }

    return { simulations };
  }
}

export class LcgHistoricalBacktestSimulationEngine extends FinancialSimulationEngine {
  constructor(
    inputs: SimulatorInputs,
    private baseSeed: number
  ) {
    super(inputs);
  }

  runSingleSimulation(
    seed: number,
    startYearOverride: number | undefined,
    retirementStartYearOverride: number | undefined
  ): SimulationResult {
    const returnsProvider = new LcgHistoricalBacktestReturnsProvider(seed, startYearOverride, retirementStartYearOverride);

    const timeline = this.inputs.timeline;
    if (!timeline) throw new Error('Must have timeline data for simulation');

    const result = this.runSimulation(returnsProvider, timeline);
    const historicalRanges = returnsProvider.getHistoricalRanges();

    return {
      ...result,
      context: {
        ...result.context,
        historicalRanges,
      },
    };
  }

  runLcgHistoricalBacktest(numSimulations: number, onProgress?: () => void): MultiSimulationResult {
    const timeline = this.inputs.timeline;
    if (!timeline) throw new Error('Must have timeline data for simulation');

    const simulations: Array<[number, SimulationResult]> = [];
    for (let i = 0; i < numSimulations; i++) {
      const simulationSeed = this.baseSeed + i * 1009;
      const returnsProvider = new LcgHistoricalBacktestReturnsProvider(simulationSeed, undefined, undefined);

      const result = this.runSimulation(returnsProvider, timeline);
      const historicalRanges = returnsProvider.getHistoricalRanges();
      simulations.push([
        simulationSeed,
        {
          ...result,
          context: {
            ...result.context,
            historicalRanges,
          },
        },
      ]);

      if (onProgress) onProgress();
    }

    return { simulations };
  }
}
