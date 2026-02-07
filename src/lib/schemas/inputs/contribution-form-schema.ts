import { z } from 'zod';
import { currencyFieldForbidsZero, percentageField } from '@/lib/utils/zod-schema-utils';

import type { AccountInputs } from './account-form-schema';

export const baseContributionSchema = z.object({
  type: z.enum(['spend', 'save']),
});

export type BaseContributionInputs = z.infer<typeof baseContributionSchema>;

const sharedContributionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  rank: z.number().int().min(0),
  maxBalance: currencyFieldForbidsZero('Max balance must be greater than zero').optional(),
  incomeIds: z.array(z.string()).optional(),
  disabled: z.boolean().optional(),
  employerMatch: currencyFieldForbidsZero('Employer match must be greater than zero').optional(),
  enableMegaBackdoorRoth: z.boolean().optional(),
});

export const contributionFormSchema = z
  .discriminatedUnion('contributionType', [
    z.object({
      ...sharedContributionSchema.shape,
      contributionType: z.literal('dollarAmount'),
      dollarAmount: currencyFieldForbidsZero('Dollar amount must be greater than zero'),
    }),

    z.object({
      ...sharedContributionSchema.shape,
      contributionType: z.literal('percentRemaining'),
      percentRemaining: percentageField(0, 100, 'Percentage of remaining funds'),
    }),

    z.object({
      ...sharedContributionSchema.shape,
      contributionType: z.literal('unlimited'),
    }),
  ])
  .refine((data) => data.accountId !== '', {
    message: 'Account must be selected',
    path: ['accountId'],
  });

export type ContributionInputs = z.infer<typeof contributionFormSchema>;

// Maps each account type to all types sharing its contribution limit
// (e.g., 401k contributions count against the 403b limit and vice versa)
export const sharedLimitAccounts: Record<string, AccountInputs['type'][]> = {
  '401k': ['401k', 'roth401k', '403b', 'roth403b'],
  '403b': ['401k', 'roth401k', '403b', 'roth403b'],
  roth401k: ['401k', 'roth401k', '403b', 'roth403b'],
  roth403b: ['401k', 'roth401k', '403b', 'roth403b'],
  ira: ['ira', 'rothIra'],
  rothIra: ['ira', 'rothIra'],
  hsa: ['hsa'],
};

export const getAccountTypeLimitKey = (accountType: AccountInputs['type']): string => {
  switch (accountType) {
    case '401k':
    case '403b':
    case 'roth401k':
    case 'roth403b':
      return '401kCombined';
    case 'ira':
    case 'rothIra':
      return 'iraCombined';
    default:
      return accountType;
  }
};

export const getAnnualContributionLimit = (limitKey: string, age: number): number => {
  switch (limitKey) {
    case '401kCombined':
      if (age >= 60 && age <= 63) return 35750;
      if (age >= 50) return 32500;
      return 24500;
    case 'iraCombined':
      return age >= 50 ? 8600 : 7500;
    case 'hsa':
      return age >= 55 ? 5400 : 4400;
    default:
      return Infinity;
  }
};

export const getAnnualSection415cLimit = (age: number): number => {
  if (age >= 60 && age <= 63) return 83250;
  if (age >= 50) return 80000;
  return 72000;
};

export const supportsMaxBalance = (type: AccountInputs['type']): boolean => {
  switch (type) {
    case 'savings':
      return true;
    case 'roth401k':
    case 'roth403b':
    case 'rothIra':
    case '401k':
    case '403b':
    case 'ira':
    case 'taxableBrokerage':
    case 'hsa':
      return false;
  }
};

export const supportsIncomeAllocation = (type: AccountInputs['type']): boolean => {
  switch (type) {
    case 'savings':
      return false;
    case 'roth401k':
    case 'roth403b':
    case 'rothIra':
    case '401k':
    case '403b':
    case 'ira':
    case 'taxableBrokerage':
    case 'hsa':
      return true;
  }
};

export const supportsEmployerMatch = (type: AccountInputs['type']): boolean => {
  switch (type) {
    case 'roth401k':
    case 'roth403b':
    case '401k':
    case '403b':
    case 'hsa':
      return true;
    case 'savings':
    case 'rothIra':
    case 'ira':
    case 'taxableBrokerage':
      return false;
  }
};

export const supportsMegaBackdoorRoth = (type: AccountInputs['type']): boolean => {
  switch (type) {
    case 'roth401k':
    case 'roth403b':
      return true;
    default:
      return false;
  }
};
