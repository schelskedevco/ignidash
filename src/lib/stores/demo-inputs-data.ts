import type { SimulatorInputs } from '@/lib/schemas/inputs/simulator-schema';

// Standard Demo Inputs
export const demoInputs1: SimulatorInputs = {
  timeline: {
    lifeExpectancy: 82,
    birthMonth: 1,
    birthYear: 1994,
    retirementStrategy: {
      safeWithdrawalRate: 4,
      type: 'swrTarget',
    },
  },
  incomes: {
    'income-1': {
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
    },
    'income-2': {
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
    },
  },
  expenses: {
    'expense-1': {
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
    },
    'expense-2': {
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
    },
  },
  debts: {},
  physicalAssets: {},
  accounts: {
    'account-1': {
      type: '401k',
      id: 'account-1',
      name: 'fidelity 401k',
      balance: 60000,
      percentBonds: 25,
    },
    'account-2': {
      type: 'rothIra',
      id: 'account-2',
      name: 'vanguard roth',
      balance: 30000,
      contributionBasis: 15000,
      percentBonds: 25,
    },
    'account-3': {
      type: 'taxableBrokerage',
      id: 'account-3',
      name: 'schwab brokerage',
      balance: 20000,
      costBasis: 12000,
      percentBonds: 10,
    },
    'account-4': {
      type: 'savings',
      id: 'account-4',
      name: 'emergency fund',
      balance: 10000,
    },
  },
  contributionRules: {
    'contribution-rule-1': {
      id: 'contribution-rule-1',
      accountId: 'account-1',
      rank: 1,
      contributionType: 'dollarAmount',
      dollarAmount: 11750,
      incomeIds: ['income-1'],
    },
    'contribution-rule-2': {
      id: 'contribution-rule-2',
      accountId: 'account-2',
      rank: 2,
      contributionType: 'dollarAmount',
      dollarAmount: 3500,
      incomeIds: ['income-1', 'income-2'],
    },
    'contribution-rule-3': {
      id: 'contribution-rule-3',
      accountId: 'account-3',
      rank: 3,
      contributionType: 'percentRemaining',
      percentRemaining: 60,
    },
    'contribution-rule-4': {
      id: 'contribution-rule-4',
      accountId: 'account-4',
      rank: 4,
      contributionType: 'unlimited',
      maxBalance: 30000,
    },
  },
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
    simulationSeed: 9521,
    simulationMode: 'fixedReturns',
  },
};

// Early Retirement Demo Inputs
export const demoInputs2: SimulatorInputs = {
  timeline: {
    lifeExpectancy: 87,
    birthMonth: 1,
    birthYear: 1997,
    retirementStrategy: {
      safeWithdrawalRate: 3.5,
      type: 'swrTarget',
    },
  },
  incomes: {
    'income-1': {
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
    },
    'income-2': {
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
    },
    'income-3': {
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
    },
  },
  expenses: {
    'expense-1': {
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
    },
    'expense-2': {
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
    },
    'expense-3': {
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
    },
  },
  debts: {},
  physicalAssets: {},
  accounts: {
    'account-1': {
      type: '401k',
      id: 'account-1',
      name: 'fidelity 401k',
      balance: 85000,
      percentBonds: 10,
    },
    'account-2': {
      type: 'rothIra',
      id: 'account-2',
      name: 'vanguard roth',
      balance: 42000,
      contributionBasis: 30000,
      percentBonds: 10,
    },
    'account-3': {
      type: 'taxableBrokerage',
      id: 'account-3',
      name: 'schwab brokerage',
      balance: 120000,
      costBasis: 90000,
      percentBonds: 5,
    },
    'account-4': {
      type: 'hsa',
      id: 'account-4',
      name: 'fidelity hsa',
      balance: 15000,
      percentBonds: 10,
    },
  },
  contributionRules: {
    'contribution-rule-1': {
      id: 'contribution-rule-1',
      accountId: 'account-1',
      rank: 1,
      contributionType: 'unlimited',
      incomeIds: ['income-1', 'income-2'],
    },
    'contribution-rule-2': {
      id: 'contribution-rule-2',
      accountId: 'account-2',
      rank: 2,
      contributionType: 'unlimited',
      incomeIds: ['income-1', 'income-2', 'income-3'],
    },
    'contribution-rule-3': {
      id: 'contribution-rule-3',
      accountId: 'account-4',
      rank: 3,
      contributionType: 'unlimited',
    },
    'contribution-rule-4': {
      id: 'contribution-rule-4',
      accountId: 'account-3',
      rank: 4,
      contributionType: 'percentRemaining',
      percentRemaining: 85,
    },
  },
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
    simulationSeed: 9521,
    simulationMode: 'fixedReturns',
  },
};
