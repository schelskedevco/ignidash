import { z } from 'zod';

import { currencyFieldAllowsZero, percentageField } from '@/lib/utils/zod-schema-helpers';

const baseAccountSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  balance: currencyFieldAllowsZero('Balance cannot be negative'),
});

const investmentAccountSchema = baseAccountSchema.extend({
  percentBonds: percentageField(0, 100, 'Percent of bonds').optional(),
});

export const accountFormSchema = z.discriminatedUnion('type', [
  // Savings - just cash, no investments
  z.object({
    ...baseAccountSchema.shape,
    type: z.literal('savings'),
  }),

  // Taxable - investments with cost basis
  z.object({
    ...investmentAccountSchema.shape,
    type: z.literal('taxable-brokerage'),
    costBasis: currencyFieldAllowsZero('Cost basis cannot be negative').optional(),
  }),

  // Roth - investments with contributions
  z.object({
    ...investmentAccountSchema.shape,
    type: z.enum(['roth-401k', 'roth-ira']),
    contributions: currencyFieldAllowsZero('Contributions cannot be negative').optional(),
  }),

  // Traditional - investments, no basis needed
  z.object({
    ...investmentAccountSchema.shape,
    type: z.enum(['401k', 'ira']),
  }),

  // HSA - special case (could have medical expense tracking later)
  z.object({
    ...investmentAccountSchema.shape,
    type: z.literal('hsa'),
  }),
]);

export type AccountInputs = z.infer<typeof accountFormSchema>;

// Helper type unions
export type RothAccountType = 'roth-401k' | 'roth-ira';
export type TraditionalAccountType = '401k' | 'ira';
export type InvestmentAccountType = Exclude<AccountInputs['type'], 'savings'>;

// Helper functions
export const isRothAccount = (type: AccountInputs['type']): type is RothAccountType => type === 'roth-401k' || type === 'roth-ira';
export const isInvestmentAccount = (type: AccountInputs['type']): type is InvestmentAccountType => type !== 'savings';
export const hasContributionLimit = (type: AccountInputs['type']): boolean => type !== 'savings' && type !== 'taxable-brokerage';
