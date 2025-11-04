import { z } from 'zod';
import { currencyFieldForbidsZero, percentageField } from '@/lib/utils/zod-schema-utils';

import type { AccountInputs } from './account-form-schema';

export const baseContributionSchema = z.object({
  type: z.enum(['spend', 'save']),
});

export type BaseContributionInputs = z.infer<typeof baseContributionSchema>;

const employerMatchSchema = z
  .object({
    matchRate: percentageField(0, 100, 'Employer match rate').optional(),
    matchSalaryCap: percentageField(0, 100, 'Employer match salary cap').optional(),
  })
  .optional()
  .refine(
    (data) => {
      if (!data || data.matchSalaryCap === undefined) return true;
      return data.matchRate !== undefined;
    },
    {
      message: 'Match % required when Salary Cap % is specified',
      path: ['matchRate'],
    }
  )
  .refine(
    (data) => {
      if (!data || data.matchRate === undefined) return true;
      return data.matchSalaryCap !== undefined;
    },
    {
      message: 'Salary Cap % required when Match % is specified',
      path: ['matchSalaryCap'],
    }
  );

const sharedContributionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  rank: z.number().int().min(0),
  maxBalance: currencyFieldForbidsZero('Max balance must be greater than zero').optional(),
  incomeIds: z.array(z.string()).optional(),
  disabled: z.boolean().optional(),
  employerMatch: employerMatchSchema,
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

export const sharedLimitAccounts: Record<string, AccountInputs['type'][]> = {
  '401k': ['401k', 'roth401k'],
  roth401k: ['401k', 'roth401k'],
  ira: ['ira', 'rothIra'],
  rothIra: ['ira', 'rothIra'],
  hsa: ['hsa'],
};

export const getAccountTypeLimitKey = (accountType: AccountInputs['type']): string => {
  switch (accountType) {
    case '401k':
    case 'roth401k':
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
      return age < 50 ? 23500 : 31000;
    case 'iraCombined':
      return age < 50 ? 7000 : 8000;
    case 'hsa':
      return age < 55 ? 4300 : 5300;
    default:
      return Infinity;
  }
};

export const supportsMaxBalance = (type: AccountInputs['type']): boolean => {
  switch (type) {
    case 'savings':
      return true;
    case 'roth401k':
    case 'rothIra':
    case '401k':
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
    case 'rothIra':
    case '401k':
    case 'ira':
    case 'taxableBrokerage':
    case 'hsa':
      return true;
  }
};

export const supportsEmployerMatch = (type: AccountInputs['type']): boolean => {
  switch (type) {
    case 'roth401k':
    case '401k':
    case 'hsa':
      return true;
    case 'savings':
    case 'rothIra':
    case 'ira':
    case 'taxableBrokerage':
      return false;
  }
};
