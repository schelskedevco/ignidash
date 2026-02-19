import { z } from 'zod';

import { currencyFieldAllowsZero, percentageField } from '@/lib/utils/zod-schema-utils';
import type { TaxCategory } from '@/lib/calc/asset';

const baseAccountSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  balance: currencyFieldAllowsZero('Balance cannot be negative'),
  syncedFinanceId: z.string().optional(),
});

const investmentAccountSchema = baseAccountSchema.extend({
  percentBonds: percentageField(0, 100, 'Percentage of bonds'),
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
    type: z.enum(['roth401k', 'roth403b', 'rothIra']),
    contributionBasis: currencyFieldAllowsZero('Contribution basis cannot be negative').optional(),
  }),

  // Tax Deferred
  z.object({
    ...investmentAccountSchema.shape,
    type: z.enum(['401k', '403b', 'ira']),
  }),

  // HSA
  z.object({
    ...investmentAccountSchema.shape,
    type: z.literal('hsa'),
  }),
]);

export type AccountInputs = z.infer<typeof accountFormSchema>;

export type RothAccountType = 'roth401k' | 'roth403b' | 'rothIra';
export type TraditionalAccountType = '401k' | '403b' | 'ira';
export type InvestmentAccountType = Exclude<AccountInputs['type'], 'savings'>;

export const isRothAccount = (type: AccountInputs['type']): type is RothAccountType =>
  type === 'roth401k' || type === 'roth403b' || type === 'rothIra';
export const isTraditionalAccount = (type: AccountInputs['type']): type is TraditionalAccountType =>
  type === '401k' || type === '403b' || type === 'ira';
export const isInvestmentAccount = (type: AccountInputs['type']): type is InvestmentAccountType => type !== 'savings';

export const accountTypeForDisplay = (type: AccountInputs['type']): string => {
  switch (type) {
    case 'savings':
      return 'Savings';
    case 'taxableBrokerage':
      return 'Taxable';
    case 'roth401k':
      return 'Roth 401(k)';
    case 'roth403b':
      return 'Roth 403(b)';
    case 'rothIra':
      return 'Roth IRA';
    case '401k':
      return '401(k)';
    case '403b':
      return '403(b)';
    case 'ira':
      return 'IRA';
    case 'hsa':
      return 'HSA';
  }
};

export const taxCategoryFromAccountTypeForDisplay = (type: AccountInputs['type']): string => {
  switch (type) {
    case 'savings':
      return 'Cash Savings';
    case 'taxableBrokerage':
      return 'Taxable';
    case 'roth401k':
    case 'roth403b':
    case 'rothIra':
      return 'Tax-Free';
    case '401k':
    case '403b':
    case 'ira':
    case 'hsa':
      return 'Tax-Deferred';
  }
};

export const taxCategoryFromAccountType = (type: AccountInputs['type']): TaxCategory => {
  switch (type) {
    case 'savings':
      return 'cashSavings';
    case 'taxableBrokerage':
      return 'taxable';
    case 'roth401k':
    case 'roth403b':
    case 'rothIra':
      return 'taxFree';
    case '401k':
    case '403b':
    case 'ira':
    case 'hsa':
      return 'taxDeferred';
  }
};
