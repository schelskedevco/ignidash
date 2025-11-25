import { z } from 'zod';

import { currencyFieldAllowsZero, percentageField } from '@/lib/utils/zod-schema-utils';

export const liabilitySchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  balance: currencyFieldAllowsZero('Balance cannot be negative'),
  interestRate: percentageField(0, 999, 'Interest rate'),
  monthlyPayment: currencyFieldAllowsZero('Monthly payment cannot be negative'),
  type: z.enum(['mortgage', 'autoLoan', 'studentLoan', 'personalLoan', 'creditCard', 'medicalDebt', 'other']),
});

export type LiabilityInputs = z.infer<typeof liabilitySchema>;
