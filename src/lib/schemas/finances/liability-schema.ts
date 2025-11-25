import { z } from 'zod';

import { currencyFieldAllowsZero, percentageField } from '@/lib/utils/zod-schema-utils';

export const liabilityFormSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  balance: currencyFieldAllowsZero('Balance cannot be negative'),
  interestRate: percentageField(0, 999, 'Interest rate'),
  monthlyPayment: currencyFieldAllowsZero('Monthly payment cannot be negative'),
  updatedAt: z.number(),
  type: z.enum(['mortgage', 'autoLoan', 'studentLoan', 'personalLoan', 'creditCard', 'medicalDebt', 'other']),
});

export type LiabilityInputs = z.infer<typeof liabilityFormSchema>;

export const liabilityTypeForDisplay = (type: LiabilityInputs['type']): string => {
  switch (type) {
    case 'mortgage':
      return 'Mortgage';
    case 'autoLoan':
      return 'Auto Loan';
    case 'studentLoan':
      return 'Student Loan';
    case 'personalLoan':
      return 'Personal Loan';
    case 'creditCard':
      return 'Credit Card';
    case 'medicalDebt':
      return 'Medical Debt';
    case 'other':
      return 'Other Liability';
  }
};
