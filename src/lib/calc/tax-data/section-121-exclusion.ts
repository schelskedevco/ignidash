import type { FilingStatus } from '@/lib/schemas/inputs/tax-settings-form-schema';

export const SECTION_121_EXCLUSION: Record<FilingStatus, number> = {
  single: 250000,
  marriedFilingJointly: 500000,
  headOfHousehold: 250000,
};
