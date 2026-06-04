/**
 * Golden-file test persona: Low Income, Single, Age 60, $200k NW, FL
 *
 * Profile: Modest portfolio, pre-Medicare.
 * Expected: Full ACA subsidy, 0% LTCG bracket, no state tax (FL), minimal federal tax.
 */

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';

export const personaName = 'Low Income, Single, 60, $200k NW, FL';

export const inputs: SimulatorInputs = {
  timeline: { birthYear: 1966, birthMonth: 1, lifeExpectancy: 90, retirementStrategy: { type: 'fixedAge', retirementAge: 60 } },
  incomes: {
    parttime: { id: 'pt-1', name: 'Part-time Work', amount: 12_000, frequency: 'yearly', timeframe: { start: { type: 'now' } }, taxes: { incomeType: 'wage', withholding: 10 } },
  },
  accounts: {
    ira: { type: 'ira', id: 'ira-1', name: 'Traditional IRA', balance: 100_000, percentBonds: 40 },
    roth: { type: 'rothIra', id: 'roth-1', name: 'Roth IRA', balance: 50_000, contributionBasis: 40_000, percentBonds: 10 },
    savings: { type: 'savings', id: 'savings-1', name: 'Savings', balance: 50_000 },
  },
  expenses: { living: { id: 'living-1', name: 'Living Expenses', amount: 25_000, frequency: 'yearly', timeframe: { start: { type: 'now' } } } },
  debts: {},
  physicalAssets: {},
  contributionRules: {},
  baseContributionRule: { type: 'save' },
  marketAssumptions: { stockReturn: 0.07, bondReturn: 0.03, cashReturn: 0.02, inflationRate: 0.03, stockYield: 0.02, bondYield: 0.015 },
  taxSettings: { filingStatus: 'single', stateOfResidence: 'FL', numOnMedicare: 1, acaEnhancedSubsidies: true },
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