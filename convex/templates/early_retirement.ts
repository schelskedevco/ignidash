import type { Doc } from '../_generated/dataModel';

export const earlyRetirementTemplate: Omit<Doc<'plans'>, '_id' | '_creationTime' | 'userId' | 'name'> = {
  isDefault: false,
  timeline: {
    lifeExpectancy: 87,
    birthMonth: 1,
    birthYear: 1997,
    retirementStrategy: {
      safeWithdrawalRate: 3.5,
      type: 'swrTarget',
    },
  },
  incomes: [
    {
      id: 'income-1',
      name: 'tech salary',
      amount: 145000,
      frequency: 'yearly',
      timeframe: {
        start: {
          type: 'now',
        },
        end: {
          type: 'atRetirement',
        },
      },
      growth: {
        growthRate: 5,
        growthLimit: 250000,
      },
      taxes: {
        incomeType: 'wage',
        withholding: 25,
      },
      disabled: false,
    },
    {
      id: 'income-2',
      name: 'RSU vesting',
      amount: 8750,
      growth: {
        growthRate: 10,
      },
      frequency: 'quarterly',
      timeframe: {
        start: {
          type: 'customAge',
          age: 30,
        },
        end: {
          type: 'customAge',
          age: 36,
        },
      },
      taxes: {
        incomeType: 'wage',
        withholding: 25,
      },
      disabled: false,
    },
    {
      id: 'income-3',
      name: 'side consulting',
      amount: 800,
      frequency: 'biweekly',
      timeframe: {
        start: {
          type: 'now',
        },
        end: {
          type: 'atRetirement',
        },
      },
      growth: {
        growthRate: 3,
      },
      taxes: {
        incomeType: 'wage',
        withholding: 25,
      },
      disabled: false,
    },
  ],
  expenses: [
    {
      id: 'expense-1',
      name: 'frugal living expenses',
      amount: 35000,
      frequency: 'yearly',
      timeframe: {
        start: {
          type: 'now',
        },
        end: {
          type: 'atLifeExpectancy',
        },
      },
      growth: {
        growthRate: 3,
        growthLimit: 50000,
      },
      disabled: false,
    },
    {
      id: 'expense-2',
      name: 'apartment rent',
      amount: 2000,
      growth: {
        growthRate: 3,
      },
      frequency: 'monthly',
      timeframe: {
        start: {
          type: 'now',
        },
        end: {
          type: 'customAge',
          age: 36,
        },
      },
      disabled: false,
    },
    {
      id: 'expense-3',
      name: 'mortgage payment',
      amount: 2333,
      growth: {},
      frequency: 'monthly',
      timeframe: {
        start: {
          type: 'customAge',
          age: 36,
        },
        end: {
          type: 'customAge',
          age: 51,
        },
      },
      disabled: false,
    },
  ],
  debts: [],
  physicalAssets: [],
  accounts: [
    {
      type: '401k',
      id: 'account-1',
      name: 'fidelity 401k',
      balance: 85000,
      percentBonds: 10,
    },
    {
      type: 'rothIra',
      id: 'account-2',
      name: 'vanguard roth',
      balance: 42000,
      contributionBasis: 30000,
      percentBonds: 10,
    },
    {
      type: 'taxableBrokerage',
      id: 'account-3',
      name: 'schwab brokerage',
      balance: 120000,
      costBasis: 90000,
      percentBonds: 5,
    },
    {
      type: 'hsa',
      id: 'account-4',
      name: 'fidelity hsa',
      balance: 15000,
      percentBonds: 10,
    },
  ],
  contributionRules: [
    {
      id: 'contribution-rule-1',
      accountId: 'account-1',
      rank: 1,
      amount: { type: 'unlimited' },
      disabled: false,
      incomeIds: ['income-1', 'income-2'],
      employerMatch: 11750,
    },
    {
      id: 'contribution-rule-2',
      accountId: 'account-2',
      rank: 2,
      amount: { type: 'unlimited' },
      disabled: false,
      incomeIds: ['income-1', 'income-2', 'income-3'],
    },
    {
      id: 'contribution-rule-3',
      accountId: 'account-4',
      rank: 3,
      amount: { type: 'unlimited' },
      disabled: false,
    },
    {
      id: 'contribution-rule-4',
      accountId: 'account-3',
      rank: 4,
      amount: { type: 'percentRemaining', percentRemaining: 85 },
      disabled: false,
    },
  ],
  baseContributionRule: {
    type: 'save',
  },
  marketAssumptions: {
    stockReturn: 9,
    stockYield: 2,
    bondReturn: 4,
    bondYield: 3.5,
    cashReturn: 3,
    inflationRate: 3,
  },
  taxSettings: {
    filingStatus: 'single',
  },
  privacySettings: {
    isPrivate: true,
  },
  simulationSettings: {
    simulationMode: 'fixedReturns',
    simulationSeed: 9521,
  },
};
