import type { FilingStatus } from '@/lib/schemas/inputs/tax-settings-form-schema';

export const NIIT_RATE = 0.038;

export const NIIT_THRESHOLDS: Record<FilingStatus, number> = {
  single: 200000,
  marriedFilingJointly: 250000,
  headOfHousehold: 200000,
};
