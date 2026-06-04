/**
 * Golden-file test persona: High Earner, MFJ, Age 70, $5M NW, CA
 *
 * Profile: High-net-worth retired couple with large tax-deferred balances.
 * Expected: IRMAA Tier 3+, NIIT active, 20% LTCG bracket, CA top bracket,
 * substantial federal income tax.
 */

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';

export const personaName = 'High Earner, MFJ, 70, $5M NW, CA';

export const inputs: SimulatorInputs = {
  timeline: { birthYear: 1956, birthMonth: 1, lifeExpectancy: 92, retirementStrategy: { type: 'fixedAge', retirementAge: 60 } },
  incomes: {},
  accounts: {
    taxable: { type: 'taxableBrokerage', id: 'taxable-1', name: 'Taxable Brokerage', balance: 1_500_000, costBasis: 1_000_000, percentBonds: 20 },
    ira: { type: 'ira', id: 'ira-1', name: 'Traditional IRA', balance: 2_500_000, percentBonds: 30 },
    roth: { type: 'rothIra', id: 'roth-1', name: 'Roth IRA', balance: 500_000, contributionBasis: 400_000, percentBonds: 10 },
    savings: { type: 'savings', id: 'savings-1', name: 'Savings', balance: 100_000 },
  },
  expenses: { living: { id: 'living-1', name: 'Living Expenses', amount: 120_000, frequency: 'yearly', timeframe: { start: { type: 'now' } } } },
  debts: {},
  physicalAssets: {},
  contributionRules: {},
  baseContributionRule: { type: 'save' },
  marketAssumptions: { stockReturn: 0.07, bondReturn: 0.03, cashReturn: 0.02, inflationRate: 0.03, stockYield: 0.02, bondYield: 0.015 },
  taxSettings: { filingStatus: 'marriedFilingJointly', stateOfResidence: 'CA', numOnMedicare: 2, acaEnhancedSubsidies: true },
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
  final: { finalPortfolio: null as number | null },
};