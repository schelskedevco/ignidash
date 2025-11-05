import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';
import type { TimelineInputs, RetirementStrategyInputs } from '@/lib/schemas/inputs/timeline-form-schema';

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
import { TaxProcessor, type TaxesData } from './taxes';

type ISODateString = string;

export interface SimulationDataPoint {
  date: ISODateString;
  portfolio: PortfolioData;
  incomes: IncomesData | null;
  expenses: ExpensesData | null;
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
    const simulationState: SimulationState = this.initSimulationState(timeline);

    const incomes = new Incomes(Object.values(this.inputs.incomes));
    const expenses = new Expenses(Object.values(this.inputs.expenses));
    const contributionRules = new ContributionRules(Object.values(this.inputs.contributionRules), this.inputs.baseContributionRule);

    const resultData: Array<SimulationDataPoint> = [this.initSimulationDataPoint(simulationState)];

    // Init simulation processors
    const returnsProcessor = new ReturnsProcessor(simulationState, returnsProvider);
    const incomesProcessor = new IncomesProcessor(simulationState, incomes);
    const expensesProcessor = new ExpensesProcessor(simulationState, expenses);
    const portfolioProcessor = new PortfolioProcessor(simulationState, contributionRules);
    const taxProcessor = new TaxProcessor(simulationState);

    // Init phase identifier
    const phaseIdentifier = new PhaseIdentifier(simulationState, timeline);
    simulationState.phase = phaseIdentifier.getCurrentPhase();

    while (simulationState.time.date < simulationContext.endDate) {
      this.incrementSimulationTime(simulationState);

      // Handle RMDs at start of year, before any other processing
      if (simulationState.time.age >= 73 && simulationState.time.month % 12 === 1) portfolioProcessor.processRequiredMinimumDistributions();

      // Process one month of simulation
      returnsProcessor.process();
      const incomesData = incomesProcessor.process();
      const expensesData = expensesProcessor.process();

      const { discretionaryExpense: monthlyDiscretionaryExpense } = portfolioProcessor.processCashFlows(incomesData, expensesData);
      if (monthlyDiscretionaryExpense) expensesProcessor.processDiscretionaryExpense(monthlyDiscretionaryExpense);

      if (simulationState.time.month % 12 === 0) {
        // Get annual data from processors
        const annualPortfolioDataBeforeTaxes = portfolioProcessor.getAnnualData();
        const annualIncomesData = incomesProcessor.getAnnualData();
        const annualReturnsData = returnsProcessor.getAnnualData();

        // Process taxes
        let annualTaxesData = taxProcessor.process(annualPortfolioDataBeforeTaxes, annualIncomesData, annualReturnsData);
        const { totalTaxesDue, totalTaxesRefund } = annualTaxesData;

        // Process portfolio updates after calculating taxes
        const processTaxesResult = portfolioProcessor.processTaxes(annualPortfolioDataBeforeTaxes, { totalTaxesDue, totalTaxesRefund });
        let { portfolioData: annualPortfolioDataAfterTaxes } = processTaxesResult;
        const { discretionaryExpense: annualDiscretionaryExpense } = processTaxesResult;

        // Iteratively reconcile taxes until convergence
        let totalTaxesPaid = totalTaxesDue;
        for (let i = 0; i < 10 && totalTaxesDue > 0; i++) {
          annualTaxesData = taxProcessor.process(annualPortfolioDataAfterTaxes, annualIncomesData, annualReturnsData);
          const totalTaxesDue = annualTaxesData.totalTaxesDue;

          const remainingTaxesDue = totalTaxesDue - totalTaxesPaid;
          if (Math.abs(remainingTaxesDue) < 1) break;

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
          portfolio: annualPortfolioDataAfterTaxes,
          incomes: annualIncomesData,
          expenses: annualExpensesData,
          phase: { ...simulationState.phase },
          taxes: annualTaxesData,
          returns: annualReturnsData,
        });

        // Reset monthly data for next iteration
        returnsProcessor.resetMonthlyData();
        incomesProcessor.resetMonthlyData();
        expensesProcessor.resetMonthlyData();
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
    };

    return { data: resultData, context };
  }

  private incrementSimulationTime(simulationState: SimulationState): void {
    simulationState.time.date = new Date(simulationState.time.date.getFullYear(), simulationState.time.date.getMonth() + 1, 1);

    const newAge = simulationState.time.age + 1 / 12;
    const newYear = simulationState.time.year + 1 / 12;

    const epsilon = 1e-10;

    simulationState.time.age = Math.abs(newAge - Math.round(newAge)) < epsilon ? Math.round(newAge) : newAge;
    simulationState.time.year = Math.abs(newYear - Math.round(newYear)) < epsilon ? Math.round(newYear) : newYear;
    simulationState.time.month += 1;
  }

  private initSimulationContext(timeline: TimelineInputs): SimulationContext {
    const startAge = timeline.currentAge;
    const endAge = timeline.lifeExpectancy;

    const yearsToSimulate = Math.ceil(endAge - startAge);

    const startDate = new Date();
    const endDate = new Date(startDate.getFullYear() + yearsToSimulate, startDate.getMonth(), 1);

    const retirementStrategy = timeline.retirementStrategy;

    return { startAge, endAge, yearsToSimulate, startDate, endDate, retirementStrategy };
  }

  private initSimulationState(timeline: TimelineInputs): SimulationState {
    return {
      time: { date: new Date(), age: timeline.currentAge, year: 0, month: 0 },
      portfolio: new Portfolio(Object.values(this.inputs.accounts)),
      phase: null,
      annualData: { expenses: [] },
    };
  }

  private initSimulationDataPoint(initialSimulationState: SimulationState): SimulationDataPoint {
    const totalPortfolioValue = initialSimulationState.portfolio.getTotalValue();
    const assetAllocation = initialSimulationState.portfolio.getWeightedAssetAllocation();

    const defaultTransactionsData = {
      contributionsForPeriod: 0,
      employerMatchForPeriod: 0,
      withdrawalsForPeriod: 0,
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
      portfolio: {
        totalValue: totalPortfolioValue,
        totalContributions: 0,
        totalEmployerMatch: 0,
        totalWithdrawals: 0,
        totalRealizedGains: 0,
        totalEarningsWithdrawn: 0,
        totalRmds: 0,
        totalShortfall: 0,
        contributionsForPeriod: 0,
        employerMatchForPeriod: 0,
        withdrawalsForPeriod: 0,
        realizedGainsForPeriod: 0,
        earningsWithdrawnForPeriod: 0,
        rmdsForPeriod: 0,
        shortfallForPeriod: 0,
        perAccountData,
        assetAllocation,
      },
      incomes: null,
      expenses: null,
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
