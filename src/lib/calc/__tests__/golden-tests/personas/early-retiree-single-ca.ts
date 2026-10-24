/**
 * Golden-file test persona: Early Retiree, Single, Age 45, $1.5M NW, CA
 *
 * Profile: FIRE retiree with no earned income. Relies on portfolio withdrawals.
 * Expected: ACA subsidy active (pre-Medicare), 0% LTCG bracket, no IRMAA,
 * low/no federal income tax, CA state tax.
 */

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';

export const personaName = 'Early Retiree, Single, 45, $1.5M NW, CA';

export const inputs: SimulatorInputs = {
  timeline: {
    birthYear: 1981,
    birthMonth: 6,
    lifeExpectancy: 90,
    retirementStrategy: { type: 'fixedAge', retirementAge: 45 },
  },
  incomes: {},
  accounts: {
    taxable: {
      type: 'taxableBrokerage',
      id: 'taxable-1',
      name: 'Taxable Brokerage',
      balance: 500_000,
      costBasis: 400_000,
      percentBonds: 20,
    },
    ira: {
      type: 'ira',
      id: 'ira-1',
      name: 'Traditional IRA',
      balance: 800_000,
      percentBonds: 30,
    },
    roth: {
      type: 'rothIra',
      id: 'roth-1',
      name: 'Roth IRA',
      balance: 200_000,
      contributionBasis: 150_000,
      percentBonds: 10,
    },
    savings: {
      type: 'savings',
      id: 'savings-1',
      name: 'Savings',
      balance: 10_000,
    },
  },
  expenses: {
    living: {
      id: 'living-1',
      name: 'Living Expenses',
      amount: 40_000,
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
    stateOfResidence: 'CA',
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
    acaSubsidy: 0,
    acaNetPremium: 0,
    irmaaPartB: 0,
    irmaaPartD: 0,
    capitalGainsTax: 0,
    niit: 0,
    stateTax: 0,
  },
  final: {
    finalPortfolio: null as number | null,
  },
  lifetime: {
    lifetimeFederalIncomeTax: 0,
  },
};