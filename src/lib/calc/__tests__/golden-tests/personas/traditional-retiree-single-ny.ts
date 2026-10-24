/**
 * Golden-file test persona: Traditional Retiree, Single, Age 67, $800k NW, NY
 *
 * Profile: Traditional retiree collecting Social Security, in Medicare years.
 * Expected: IRMAA Tier 1, NY state tax, Social Security taxation, moderate income.
 */

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';

export const personaName = 'Traditional Retiree, Single, 67, $800k NW, NY';

export const inputs: SimulatorInputs = {
  timeline: {
    birthYear: 1959,
    birthMonth: 1,
    lifeExpectancy: 88,
    retirementStrategy: { type: 'fixedAge', retirementAge: 65 },
  },
  incomes: {
    ss: {
      id: 'ss-1',
      name: 'Social Security',
      amount: 24_000,
      frequency: 'yearly',
      timeframe: { start: { type: 'now' } },
      taxes: { incomeType: 'socialSecurity', withholding: 0 },
    },
  },
  accounts: {
    ira: {
      type: 'ira',
      id: 'ira-1',
      name: 'Traditional IRA',
      balance: 500_000,
      percentBonds: 40,
    },
    roth: {
      type: 'rothIra',
      id: 'roth-1',
      name: 'Roth IRA',
      balance: 150_000,
      contributionBasis: 100_000,
      percentBonds: 10,
    },
    savings: {
      type: 'savings',
      id: 'savings-1',
      name: 'Savings',
      balance: 50_000,
    },
  },
  expenses: {
    living: {
      id: 'living-1',
      name: 'Living Expenses',
      amount: 45_000,
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
    filingStatus: 'single',
    stateOfResidence: 'NY',
    numOnMedicare: 1,
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
    irmaaPartB: 0,
    irmaaPartD: 0,
    stateTax: 0,
  },
  final: {
    finalPortfolio: null as number | null,
  },
};