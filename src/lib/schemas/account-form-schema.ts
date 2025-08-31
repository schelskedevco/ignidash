import { z } from 'zod';

import { currencyFieldAllowsZero, percentageField } from '@/lib/utils/zod-schema-helpers';

const baseAccountSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  currentValue: currencyFieldAllowsZero('Value cannot be negative'),
});

const investmentAccountSchema = baseAccountSchema.extend({
  percentBonds: percentageField(0, 100, 'Percentage of bonds').optional(),
});

export const accountFormSchema = z.discriminatedUnion('type', [
  // Savings
  z.object({
    ...baseAccountSchema.shape,
    type: z.literal('savings'),
  }),

  // Taxable Brokerage
  z.object({
    ...investmentAccountSchema.shape,
    type: z.literal('taxableBrokerage'),
    costBasis: currencyFieldAllowsZero('Cost basis cannot be negative').optional(),
  }),

  // Roth
  z.object({
    ...investmentAccountSchema.shape,
    type: z.enum(['roth401k', 'rothIra']),
    contributions: currencyFieldAllowsZero('Contributions cannot be negative').optional(),
  }),

  // Tax Deferred
  z.object({
    ...investmentAccountSchema.shape,
    type: z.enum(['401k', 'ira']),
  }),

  // HSA
  z.object({
    ...investmentAccountSchema.shape,
    type: z.literal('hsa'),
  }),
]);

export type AccountInputs = z.infer<typeof accountFormSchema>;

export type RothAccountType = 'roth401k' | 'rothIra';
export type TraditionalAccountType = '401k' | 'ira';
export type InvestmentAccountType = Exclude<AccountInputs['type'], 'savings'>;

export const isRothAccount = (type: AccountInputs['type']): type is RothAccountType => type === 'roth401k' || type === 'rothIra';
export const isInvestmentAccount = (type: AccountInputs['type']): type is InvestmentAccountType => type !== 'savings';
export const hasContributionLimit = (type: AccountInputs['type']): boolean => type !== 'savings' && type !== 'taxableBrokerage';

export const accountTypeForDisplay = (type: AccountInputs['type']): string => {
  switch (type) {
    case 'savings':
      return 'Savings';
    case 'taxableBrokerage':
      return 'Taxable Brokerage';
    case 'roth401k':
      return 'Roth 401(k)';
    case 'rothIra':
      return 'Roth IRA';
    case '401k':
      return '401(k)';
    case 'ira':
      return 'IRA';
    case 'hsa':
      return 'HSA';
  }
};

export const accountTypeRequiresIncomeForContributions = (type: AccountInputs['type']): boolean => {
  switch (type) {
    case 'savings':
    case 'taxableBrokerage':
    case 'hsa':
      return false;
    case 'roth401k':
    case 'rothIra':
    case '401k':
    case 'ira':
      return true;
  }
};
