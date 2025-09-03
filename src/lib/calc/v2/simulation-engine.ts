import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';
import { TimelineInputs } from '@/lib/schemas/timeline-form-schema';

import { ReturnsProvider } from '../returns-provider';
import { StochasticReturnsProvider } from '../stochastic-returns-provider';
import { LcgHistoricalBacktestReturnsProvider } from '../lcg-historical-backtest-returns-provider';

import { Portfolio, PortfolioData, PortfolioProcessor } from './portfolio';
import { PhaseIdentifier, PhaseData, PhaseName } from './phase';
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
  phase: PhaseData;
  taxes: TaxesData | null;
  returns: ReturnsData | null;
}

export interface SimulationResult {
  data: Array<SimulationDataPoint>;
}

export interface SimulationContext {
  readonly startingAge: number;
  readonly lifeExpectancy: number;
}

export interface SimulationState {
  time: {
    date: Date;
    age: number;
    year: number;
  };
  portfolio: Portfolio;
  phaseName: PhaseName;
}

export class FinancialSimulationEngine {
  constructor(protected inputs: QuickPlanInputs) {}

  runSimulation(returnsProvider: ReturnsProvider, timeline: TimelineInputs): SimulationResult {
    const phaseIdentifier = new PhaseIdentifier(timeline);

    const simulationContext: SimulationContext = this.initSimulationContext(timeline);
    const simulationState: SimulationState = this.initSimulationState(timeline, phaseIdentifier);

    const resultData: Array<SimulationDataPoint> = [this.initSimulationDataPoint(simulationState, phaseIdentifier)];

    const incomes = new Incomes(Object.values(this.inputs.incomes));
    const expenses = new Expenses(Object.values(this.inputs.expenses));

    const returnsProcessor = new ReturnsProcessor(simulationState, returnsProvider);
    const incomesProcessor = new IncomesProcessor(simulationState, incomes);
    const taxProcessor = new TaxProcessor(simulationState);
    const expensesProcessor = new ExpensesProcessor(simulationState, expenses);
    const portfolioProcessor = new PortfolioProcessor(simulationState);

    const simulationYears = Math.ceil(simulationContext.lifeExpectancy - simulationContext.startingAge);
    for (let year = 1; year <= simulationYears; year++) {
      this.incrementSimulationTime(simulationState);

      const returnsData = returnsProcessor.process();
      const incomesData = incomesProcessor.process(returnsData);
      const expensesData = expensesProcessor.process(returnsData);
      const grossCashFlow = incomesData.totalGrossIncome - expensesData.totalExpenses;
      const portfolioData = portfolioProcessor.process(grossCashFlow);
      const taxesData = taxProcessor.process(incomesData);

      resultData.push({
        date: simulationState.time.date.toISOString().split('T')[0],
        portfolio: portfolioData,
        incomes: incomesData,
        expenses: expensesData,
        phase: phaseIdentifier.getCurrentPhase(simulationState.time.date),
        taxes: taxesData,
        returns: returnsData,
      });
    }

    return { data: resultData };

    // Process Cash Flows (income, expenses, taxes, contributions, withdrawals)
    // Check for metadata (e.g. bankruptcy)
    // Rebalance Portfolio (if necessary)
    // Apply returns to Portfolio
    // Rebalance Portfolio (if necessary)
    // Check for phase change
    // Collect data point for loop
  }

  private incrementSimulationTime(simulationState: SimulationState): void {
    simulationState.time.date = new Date(simulationState.time.date.getFullYear() + 1, simulationState.time.date.getMonth(), 1);
    simulationState.time.age += 1;
    simulationState.time.year += 1;
  }

  private initSimulationContext(timeline: TimelineInputs): SimulationContext {
    return {
      startingAge: timeline.currentAge,
      lifeExpectancy: timeline.lifeExpectancy,
    };
  }

  private initSimulationState(timeline: TimelineInputs, phaseIdentifier: PhaseIdentifier): SimulationState {
    return {
      time: {
        date: new Date(),
        age: timeline.currentAge,
        year: 0,
      },
      portfolio: new Portfolio(Object.values(this.inputs.accounts)),
      phaseName: phaseIdentifier.getCurrentPhase(new Date()).name,
    };
  }

  private initSimulationDataPoint(initialSimulationState: SimulationState, phaseIdentifier: PhaseIdentifier): SimulationDataPoint {
    return {
      date: new Date().toISOString().split('T')[0],
      portfolio: { totalValue: initialSimulationState.portfolio.getTotalValue(), totalContributions: 0, totalWithdrawals: 0 },
      incomes: null,
      expenses: null,
      phase: phaseIdentifier.getCurrentPhase(initialSimulationState.time.date),
      taxes: null,
      returns: null,
    };
  }
}

export interface HistoricalRangeInfo {
  historicalRanges: Array<{ startYear: number; endYear: number }>;
}

export interface MultiSimulationResult {
  simulations: Array<[number /* seed */, SimulationResult | (SimulationResult & HistoricalRangeInfo)]>;
}

export class MonteCarloSimulationEngine extends FinancialSimulationEngine {
  constructor(
    inputs: QuickPlanInputs,
    private baseSeed: number
  ) {
    super(inputs);
  }

  runSingleSimulation(seed: number): SimulationResult {
    const returnsProvider = new StochasticReturnsProvider(this.inputs, seed);
    const timeline = Object.values(this.inputs.timelines)[0]; // TODO: Use selected timeline. Handle nulls.
    return this.runSimulation(returnsProvider, timeline);
  }

  runMonteCarloSimulation(numSimulations: number): MultiSimulationResult {
    const simulations: Array<[number, SimulationResult]> = [];

    for (let i = 0; i < numSimulations; i++) {
      const simulationSeed = this.baseSeed + i * 1009;
      const returnsProvider = new StochasticReturnsProvider(this.inputs, simulationSeed);
      const timeline = Object.values(this.inputs.timelines)[0]; // TODO: Use selected timeline. Handle nulls.
      const result = this.runSimulation(returnsProvider, timeline);

      simulations.push([simulationSeed, result]);
    }

    return {
      simulations,
    };
  }
}

export class LcgHistoricalBacktestSimulationEngine extends FinancialSimulationEngine {
  constructor(
    inputs: QuickPlanInputs,
    private baseSeed: number
  ) {
    super(inputs);
  }

  runSingleSimulation(seed: number): SimulationResult & HistoricalRangeInfo {
    const returnsProvider = new LcgHistoricalBacktestReturnsProvider(seed);
    const timeline = Object.values(this.inputs.timelines)[0]; // TODO: Use selected timeline. Handle nulls.
    const result = this.runSimulation(returnsProvider, timeline);

    const historicalRanges = returnsProvider.getHistoricalRanges();

    return { ...result, historicalRanges };
  }

  runLcgHistoricalBacktest(numSimulations: number): MultiSimulationResult {
    const simulations: Array<[number, SimulationResult & HistoricalRangeInfo]> = [];

    for (let i = 0; i < numSimulations; i++) {
      const simulationSeed = this.baseSeed + i * 1009;
      const returnsProvider = new LcgHistoricalBacktestReturnsProvider(simulationSeed);
      const timeline = Object.values(this.inputs.timelines)[0]; // TODO: Use selected timeline. Handle nulls.
      const result = this.runSimulation(returnsProvider, timeline);

      const historicalRanges = returnsProvider.getHistoricalRanges();
      simulations.push([simulationSeed, { ...result, historicalRanges }]);
    }

    return {
      simulations,
    };
  }
}
