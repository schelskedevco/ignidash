import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';
import { TimelineInputs } from '@/lib/schemas/timeline-form-schema';

import { ReturnsProvider } from '../returns-provider';
import { StochasticReturnsProvider } from '../stochastic-returns-provider';
import { LcgHistoricalBacktestReturnsProvider } from '../lcg-historical-backtest-returns-provider';

import { Portfolio, PortfolioData, PortfolioProcessor } from './portfolio';
import { ContributionRules } from './contribution-rules';
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
  readonly startAge: number;
  readonly endAge: number;
  readonly yearsToSimulate: number;
  readonly startDate: Date;
  readonly endDate: Date;
  readonly birthDate: Date;
}

export interface SimulationState {
  time: {
    date: Date;
    age: number;
    year: number;
  };
  portfolio: Portfolio;
  phaseName: PhaseName;
  annualData: {
    returns: ReturnsData[];
    incomes: IncomesData[];
    expenses: ExpensesData[];
    portfolio: PortfolioData[];
  };
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
    const contributionRules = new ContributionRules(Object.values(this.inputs.contributionRules), this.inputs.baseContributionRule);

    const returnsProcessor = new ReturnsProcessor(simulationState, returnsProvider);
    const incomesProcessor = new IncomesProcessor(simulationState, incomes);
    const expensesProcessor = new ExpensesProcessor(simulationState, expenses);
    const portfolioProcessor = new PortfolioProcessor(simulationState, contributionRules);
    const taxProcessor = new TaxProcessor(simulationState);

    let monthCount = 0;
    while (simulationState.time.date < simulationContext.endDate) {
      monthCount++;
      this.incrementSimulationTime(simulationState);

      const returnsData = returnsProcessor.process();
      const incomesData = incomesProcessor.process(returnsData);
      const expensesData = expensesProcessor.process(returnsData);
      const grossCashFlow = incomesData.totalGrossIncome - expensesData.totalExpenses;
      const portfolioData = portfolioProcessor.process(grossCashFlow);
      const taxesData = taxProcessor.process(incomesData);

      simulationState.phaseName = phaseIdentifier.getCurrentPhase(simulationState.time.date).name;

      simulationState.annualData.returns.push(returnsData);
      simulationState.annualData.incomes.push(incomesData);
      simulationState.annualData.expenses.push(expensesData);
      simulationState.annualData.portfolio.push(portfolioData);

      if (monthCount % 12 === 0) {
        const annualData = simulationState.annualData;

        const annualPortfolioData = annualData.portfolio.reduce(
          (acc, curr) => {
            acc.totalValue += curr.totalValue;
            acc.totalContributions += curr.totalContributions;
            acc.totalWithdrawals += curr.totalWithdrawals;
            return acc;
          },
          { totalValue: 0, totalContributions: 0, totalWithdrawals: 0 }
        );
        const annualIncomesData = annualData.incomes.reduce(
          (acc, curr) => {
            acc.totalGrossIncome += curr.totalGrossIncome;
            return acc;
          },
          { totalGrossIncome: 0 }
        );
        const annualExpensesData = annualData.expenses.reduce(
          (acc, curr) => {
            acc.totalExpenses += curr.totalExpenses;
            return acc;
          },
          { totalExpenses: 0 }
        );
        const annualReturnsData = annualData.returns.reduce(
          (acc, curr) => {
            return {
              ...acc,
              returnAmounts: {
                stocks: acc.returnAmounts.stocks + curr.returnAmounts.stocks,
                bonds: acc.returnAmounts.bonds + curr.returnAmounts.bonds,
                cash: acc.returnAmounts.cash + curr.returnAmounts.cash,
              },
            };
          },
          {
            ...annualData.returns[0],
            returnAmounts: { stocks: 0, bonds: 0, cash: 0 },
          }
        );

        resultData.push({
          date: simulationState.time.date.toISOString().split('T')[0],
          portfolio: annualPortfolioData,
          incomes: annualIncomesData,
          expenses: annualExpensesData,
          phase: phaseIdentifier.getCurrentPhase(simulationState.time.date),
          taxes: taxesData,
          returns: annualReturnsData,
        });

        simulationState.annualData = {
          returns: [],
          incomes: [],
          expenses: [],
          portfolio: [],
        };
      }
    }

    return { data: resultData };
  }

  private incrementSimulationTime(simulationState: SimulationState): void {
    simulationState.time.date = new Date(simulationState.time.date.getFullYear(), simulationState.time.date.getMonth() + 1, 1);
    simulationState.time.age += 1 / 12;
    simulationState.time.year += 1 / 12;
  }

  private initSimulationContext(timeline: TimelineInputs): SimulationContext {
    const startAge = timeline.currentAge;
    const endAge = timeline.lifeExpectancy;
    const yearsToSimulate = Math.ceil(endAge - startAge);
    const startDate = new Date();
    const endDate = new Date(startDate.getFullYear() + yearsToSimulate, startDate.getMonth(), 1);
    const birthDate = new Date(startDate.getFullYear() - startAge, startDate.getMonth(), 1); // TODO: Use user input birth date.

    return { startAge, endAge, yearsToSimulate, startDate, endDate, birthDate };
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
      annualData: {
        returns: [],
        incomes: [],
        expenses: [],
        portfolio: [],
      },
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
