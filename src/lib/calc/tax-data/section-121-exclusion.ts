/**
 * Section 121 capital gains exclusion on primary residence sale
 *
 * Excludes up to $250k ($500k married) of gain from the sale of a primary residence.
 * Source: IRC §121.
 */

import type { FilingStatus } from '@/lib/schemas/inputs/tax-settings-form-schema';

export const SECTION_121_EXCLUSION: Record<FilingStatus, number> = {
  single: 250000,
  marriedFilingJointly: 500000,
  headOfHousehold: 250000,
};
