/**
 * Golden-file test persona: Early Retiree, MFJ, Age 55, $3M NW, TX
 *
 * Profile: Married couple, early retired, living in Texas (no state tax).
 * Expected: No state income tax, approaching IRMAA threshold as portfolio
 * withdrawals push MAGI higher, ACA subsidy may phase out.
 */

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';

export const personaName = 'Early Retiree, MFJ, 55, $3M NW, TX';

export const inputs: SimulatorInputs = {
  timeline: {
    birthYear: 1971,
    birthMonth: 3,
    lifeExpectancy: 92,
    retirementStrategy: { type: 'fixedAge', retirementAge: 55 },
  },
  incomes: {},
  accounts: {
    taxable: {
      type: 'taxableBrokerage',
      id: 'taxable-1',
      name: 'Taxable Brokerage',
      balance: 1_000_000,
      costBasis: 700_000,
      percentBonds: 20,
    },
    ira: {
      type: 'ira',
      id: 'ira-1',
      name: 'Traditional IRA',
      balance: 1_500_000,
      percentBonds: 30,
    },
    roth: {
      type: 'rothIra',
      id: 'roth-1',
      name: 'Roth IRA',
      balance: 500_000,
      contributionBasis: 350_000,
      percentBonds: 10,
    },
    savings: {
      type: 'savings',
      id: 'savings-1',
      name: 'Savings',
      balance: 30_000,
    },
  },
  expenses: {
    living: {
      id: 'living-1',
      name: 'Living Expenses',
      amount: 70_000,
      frequency: 'yearly',
      timeframe: { start: { type: 'now' } },
    },
  },
  debts: {},
  physicalAssets: {},
  contributionRules: {},
  baseContributionRule: { type: 'save' },
  marketAssumptions: {
    stockReturn: 0.07,
    bondReturn: 0.03,
    cashReturn: 0.02,
    inflationRate: 0.03,
    stockYield: 0.02,
    bondYield: 0.015,
  },
  taxSettings: {
    filingStatus: 'marriedFilingJointly',
    stateOfResidence: 'TX',
    numOnMedicare: 2,
    acaEnhancedSubsidies: true,
  },
  privacySettings: { isPrivate: true },
  simulationSettings: { simulationSeed: 42, simulationMode: 'fixedReturns' },
  glidePath: undefined,
  conversionRules: [],
};

export const expectedOutputs = {
  year1: {
    federalIncomeTax: 0,
    stateTax: 0,
    irmaaPartB: 0,
    irmaaPartD: 0,
  },
  final: {
    finalPortfolio: null as number | null,
  },
};