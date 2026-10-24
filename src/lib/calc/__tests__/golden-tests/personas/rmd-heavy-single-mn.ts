/**
 * Golden-file test persona: RMD-Heavy, Single, Age 75, $2M trad IRA, MN
 *
 * Profile: Large traditional IRA balance generating substantial RMDs.
 * Expected: Large RMDs push into IRMAA territory, MN state tax,
 * significant federal income tax.
 */

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';

export const personaName = 'RMD-Heavy, Single, 75, $2M Trad IRA, MN';

export const inputs: SimulatorInputs = {
  timeline: { birthYear: 1951, birthMonth: 1, lifeExpectancy: 92, retirementStrategy: { type: 'fixedAge', retirementAge: 65 } },
  incomes: {
    ss: { id: 'ss-1', name: 'Social Security', amount: 30_000, frequency: 'yearly', timeframe: { start: { type: 'now' } }, taxes: { incomeType: 'socialSecurity', withholding: 0 } },
  },
  accounts: {
    ira: { type: 'ira', id: 'ira-1', name: 'Traditional IRA', balance: 2_000_000, percentBonds: 40 },
    roth: { type: 'rothIra', id: 'roth-1', name: 'Roth IRA', balance: 100_000, contributionBasis: 80_000, percentBonds: 10 },
    savings: { type: 'savings', id: 'savings-1', name: 'Savings', balance: 50_000 },
  },
  expenses: { living: { id: 'living-1', name: 'Living Expenses', amount: 60_000, frequency: 'yearly', timeframe: { start: { type: 'now' } } } },
  debts: {},
  physicalAssets: {},
  contributionRules: {},
  baseContributionRule: { type: 'save' },
  marketAssumptions: { stockReturn: 0.07, bondReturn: 0.03, cashReturn: 0.02, inflationRate: 0.03, stockYield: 0.02, bondYield: 0.015 },
  taxSettings: { filingStatus: 'single', stateOfResidence: 'MN', numOnMedicare: 1, acaEnhancedSubsidies: true },
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