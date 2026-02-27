import { z } from 'zod';
import { HouseIcon, CarIcon, SchoolIcon, FileUserIcon, CreditCardIcon, StethoscopeIcon, FileQuestionMarkIcon } from 'lucide-react';

import { currencyFieldAllowsZero } from '@/lib/utils/zod-utils';

export const liabilityFormSchema = z.object({
  id: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be at most 50 characters'),
  balance: currencyFieldAllowsZero('Balance cannot be negative'),
  updatedAt: z.number(),
  url: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;

        try {
          const parsed = new URL(val);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'Must be a valid http:// or https:// URL' }
    ),
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

export const liabilityIconForDisplay = (
  type: LiabilityInputs['type']
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
> => {
  switch (type) {
    case 'mortgage':
      return HouseIcon;
    case 'autoLoan':
      return CarIcon;
    case 'studentLoan':
      return SchoolIcon;
    case 'personalLoan':
      return FileUserIcon;
    case 'creditCard':
      return CreditCardIcon;
    case 'medicalDebt':
      return StethoscopeIcon;
    case 'other':
      return FileQuestionMarkIcon;
  }
};
