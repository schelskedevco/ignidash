/**
 * Golden-file test persona: Coast FIRE, MFJ, Age 40, $500k NW, WA
 *
 * Profile: Long horizon ahead, still working part-time, no state tax (WA).
 * Expected: No IRMAA (too young), ACA subsidy likely active, no state tax,
 * long accumulation phase ahead.
 */

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';

export const personaName = 'Coast FIRE, MFJ, 40, $500k NW, WA';

export const inputs: SimulatorInputs = {
  timeline: { birthYear: 1986, birthMonth: 1, lifeExpectancy: 95, retirementStrategy: { type: 'fixedAge', retirementAge: 55 } },
  incomes: {
    coast: { id: 'coast-1', name: 'Part-time Work', amount: 30_000, frequency: 'yearly', timeframe: { start: { type: 'now' }, end: { type: 'customAge', age: 55 } }, taxes: { incomeType: 'wage', withholding: 15 } },
  },
  accounts: {
    taxable: { type: 'taxableBrokerage', id: 'taxable-1', name: 'Taxable Brokerage', balance: 200_000, costBasis: 150_000, percentBonds: 20 },
    ira: { type: 'ira', id: 'ira-1', name: 'Traditional IRA', balance: 200_000, percentBonds: 30 },
    roth: { type: 'rothIra', id: 'roth-1', name: 'Roth IRA', balance: 100_000, contributionBasis: 80_000, percentBonds: 10 },
  },
  expenses: { living: { id: 'living-1', name: 'Living Expenses', amount: 45_000, frequency: 'yearly', timeframe: { start: { type: 'now' } } } },
  debts: {},
  physicalAssets: {},
  contributionRules: {},
  baseContributionRule: { type: 'save' },
  marketAssumptions: { stockReturn: 0.07, bondReturn: 0.03, cashReturn: 0.02, inflationRate: 0.03, stockYield: 0.02, bondYield: 0.015 },
  taxSettings: { filingStatus: 'marriedFilingJointly', stateOfResidence: 'WA', numOnMedicare: 2, acaEnhancedSubsidies: true },
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
  final: { finalPortfolio: null as number | null },
};