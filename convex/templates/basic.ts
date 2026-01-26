import type { Doc } from '../_generated/dataModel';

export const basicTemplate: Omit<Doc<'plans'>, '_id' | '_creationTime' | 'userId' | 'name'> = {
  isDefault: false,
  timeline: {
    lifeExpectancy: 82,
    birthMonth: 1,
    birthYear: 1994,
    retirementStrategy: {
      safeWithdrawalRate: 4,
      type: 'swrTarget',
    },
  },
  incomes: [
    {
      id: 'income-1',
      name: 'software engineer salary',
      amount: 87500,
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
        growthRate: 3,
        growthLimit: 150000,
      },
      taxes: {
        incomeType: 'wage',
        withholding: 20,
      },
      disabled: false,
    },
    {
      id: 'income-2',
      name: 'freelance work',
      amount: 1000,
      frequency: 'monthly',
      timeframe: {
        start: {
          type: 'now',
        },
        end: {
          type: 'atRetirement',
        },
      },
      growth: {
        growthRate: 2,
        growthLimit: 25000,
      },
      taxes: {
        incomeType: 'wage',
        withholding: 20,
      },
      disabled: false,
    },
  ],
  expenses: [
    {
      id: 'expense-1',
      name: 'living expenses',
      amount: 55000,
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
        growthLimit: 80000,
      },
      disabled: false,
    },
    {
      id: 'expense-2',
      name: 'vacations',
      amount: 5000,
      growth: {
        growthRate: 5,
        growthLimit: 10000,
      },
      frequency: 'yearly',
      timeframe: {
        start: {
          type: 'now',
        },
        end: {
          type: 'atLifeExpectancy',
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
      balance: 60000,
      percentBonds: 25,
    },
    {
      type: 'rothIra',
      id: 'account-2',
      name: 'vanguard roth',
      balance: 30000,
      contributionBasis: 15000,
      percentBonds: 25,
    },
    {
      type: 'taxableBrokerage',
      id: 'account-3',
      name: 'schwab brokerage',
      balance: 20000,
      costBasis: 12000,
      percentBonds: 10,
    },
    {
      type: 'savings',
      id: 'account-4',
      name: 'emergency fund',
      balance: 10000,
    },
  ],
  contributionRules: [
    {
      id: 'contribution-rule-1',
      accountId: 'account-1',
      rank: 1,
      amount: {
        type: 'dollarAmount',
        dollarAmount: 11750,
      },
      disabled: false,
      incomeIds: ['income-1'],
      employerMatch: 7000,
    },
    {
      id: 'contribution-rule-2',
      accountId: 'account-2',
      rank: 2,
      amount: {
        type: 'dollarAmount',
        dollarAmount: 3500,
      },
      disabled: false,
      incomeIds: ['income-1', 'income-2'],
    },
    {
      id: 'contribution-rule-3',
      accountId: 'account-3',
      rank: 3,
      amount: {
        type: 'percentRemaining',
        percentRemaining: 60,
      },
      disabled: false,
    },
    {
      id: 'contribution-rule-4',
      accountId: 'account-4',
      rank: 4,
      amount: {
        type: 'unlimited',
      },
      disabled: false,
      maxBalance: 30000,
    },
  ],
  baseContributionRule: {
    type: 'spend',
  },
  marketAssumptions: {
    stockReturn: 10,
    stockYield: 3.5,
    bondReturn: 5,
    bondYield: 4.5,
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
