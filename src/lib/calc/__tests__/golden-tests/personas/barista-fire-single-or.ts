/**
 * Golden-file test persona: Barista FIRE, Single, Age 50, $1M NW, OR
 *
 * Profile: Part-time income supplements portfolio withdrawals. Pre-Medicare.
 * Expected: ACA subsidy, OR state tax, partial earned income, modest federal tax.
 */

import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';

export const personaName = 'Barista FIRE, Single, 50, $1M NW, OR';

export const inputs: SimulatorInputs = {
  timeline: { birthYear: 1976, birthMonth: 1, lifeExpectancy: 92, retirementStrategy: { type: 'fixedAge', retirementAge: 50 } },
  incomes: {
    barista: { id: 'barista-1', name: 'Part-time Work', amount: 20_000, frequency: 'yearly', timeframe: { start: { type: 'now' } }, taxes: { incomeType: 'wage', withholding: 12 } },
  },
  accounts: {
    taxable: { type: 'taxableBrokerage', id: 'taxable-1', name: 'Taxable Brokerage', balance: 300_000, costBasis: 200_000, percentBonds: 20 },
    ira: { type: 'ira', id: 'ira-1', name: 'Traditional IRA', balance: 500_000, percentBonds: 30 },
    roth: { type: 'rothIra', id: 'roth-1', name: 'Roth IRA', balance: 200_000, contributionBasis: 150_000, percentBonds: 10 },
  },
  expenses: { living: { id: 'living-1', name: 'Living Expenses', amount: 35_000, frequency: 'yearly', timeframe: { start: { type: 'now' } } } },
  debts: {},
  physicalAssets: {},
  contributionRules: {},
  baseContributionRule: { type: 'save' },
  marketAssumptions: { stockReturn: 0.07, bondReturn: 0.03, cashReturn: 0.02, inflationRate: 0.03, stockYield: 0.02, bondYield: 0.015 },
  taxSettings: { filingStatus: 'single', stateOfResidence: 'OR', numOnMedicare: 1, acaEnhancedSubsidies: true },
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