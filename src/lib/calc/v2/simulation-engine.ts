import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';
import { TimelineInputs } from '@/lib/schemas/timeline-form-schema';

import { ReturnsProvider } from '../returns-provider';
import { StochasticReturnsProvider } from '../stochastic-returns-provider';
import { LcgHistoricalBacktestReturnsProvider } from '../lcg-historical-backtest-returns-provider';

import { Portfolio, PortfolioData, PortfolioProcessor } from './portfolio';
import { Phase, PhaseData } from './phase';
import { ReturnsProcessor, type ReturnsData } from './returns';
import { Incomes, IncomesProcessor } from './incomes';
import { Expenses, ExpensesProcessor } from './expenses';
import { TaxProcessor } from './taxes';

type ISODateString = string;

interface IncomesData {
  temp: string;
}

interface ExpensesData {
  temp: string;
}

interface TaxesData {
  temp: string;
}

interface ContributionsData {
  temp: string;
}

interface WithdrawalsData {
  temp: string;
}

export interface SimulationDataPoint {
  date: ISODateString;
  portfolio: PortfolioData;
  incomes: IncomesData | null;
  expenses: ExpensesData | null;
  phase: PhaseData;
  taxes: TaxesData | null;
  contributions: ContributionsData | null;
  withdrawals: WithdrawalsData | null;
  returns: ReturnsData | null;
}

export interface SimulationResult {
  data: Array<SimulationDataPoint>;
}

export interface SimulationState {
  date: Date;
  age: number;
  year: number;
  period: number;
  lifeExpectancy: number;
  portfolio: Portfolio;
  incomes: Incomes;
  expenses: Expenses;
  phase: Phase;
}

export class FinancialSimulationEngine {
  constructor(protected inputs: QuickPlanInputs) {}

  runSimulation(returnsProvider: ReturnsProvider, timeline: TimelineInputs): SimulationResult {
    const simulationState: SimulationState = {
      date: new Date(),
      age: timeline.currentAge,
      year: 0,
      period: 0,
      lifeExpectancy: timeline.lifeExpectancy,
      portfolio: new Portfolio(Object.values(this.inputs.accounts)),
      incomes: new Incomes(Object.values(this.inputs.incomes)),
      expenses: new Expenses(Object.values(this.inputs.expenses)),
      phase: new Phase(timeline),
    };

    const resultData: Array<SimulationDataPoint> = [
      {
        date: new Date().toISOString().split('T')[0],
        portfolio: { totalValue: simulationState.portfolio.getTotalValue() },
        incomes: null,
        expenses: null,
        phase: { name: simulationState.phase.getCurrentPhaseName(simulationState) },
        taxes: null,
        contributions: null,
        withdrawals: null,
        returns: null,
      },
    ];

    const returnsProcessor = new ReturnsProcessor(simulationState, returnsProvider);
    const incomesProcessor = new IncomesProcessor(simulationState);
    const taxProcessor = new TaxProcessor(simulationState);
    const expensesProcessor = new ExpensesProcessor(simulationState);
    const portfolioProcessor = new PortfolioProcessor(simulationState);

    const simulationYears = Math.ceil(simulationState.lifeExpectancy - simulationState.age);
    for (let year = 1; year <= simulationYears; year++) {
      this.incrementSimulationTime(simulationState);

      const _returnsData = returnsProcessor.process();
      incomesProcessor.process();
      expensesProcessor.process();
      portfolioProcessor.process(); // See function for dependencies
      taxProcessor.process(); // Needs incomes, withdrawals, rebalance

      resultData.push(this.getDataPointFromSimulationState(simulationState));
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

  private getDataPointFromSimulationState(simulationState: SimulationState): SimulationDataPoint {
    return {
      date: simulationState.date.toISOString().split('T')[0],
      portfolio: { totalValue: simulationState.portfolio.getTotalValue() },
      incomes: null,
      expenses: null,
      phase: { name: simulationState.phase.getCurrentPhaseName(simulationState) },
      taxes: null,
      contributions: null,
      withdrawals: null,
      returns: null,
    };
  }

  private incrementSimulationTime(simulationState: SimulationState): void {
    simulationState.date = new Date(simulationState.date.getFullYear() + 1, simulationState.date.getMonth(), 1);
    simulationState.age += 1;
    simulationState.year += 1;
    simulationState.period += 1;
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
