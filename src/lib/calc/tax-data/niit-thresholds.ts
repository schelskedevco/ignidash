/**
 * Net Investment Income Tax (NIIT) rate and thresholds by filing status
 *
 * The NIIT is a 3.8% surtax on investment income for high earners.
 * Source: IRC §1411, IRS Form 8960.
 */

import type { FilingStatus } from '@/lib/schemas/inputs/tax-settings-form-schema';

/** 3.8% surtax on net investment income above the applicable threshold */
export const NIIT_RATE = 0.038;

export const NIIT_THRESHOLDS: Record<FilingStatus, number> = {
  single: 200000,
  marriedFilingJointly: 250000,
  headOfHousehold: 200000,
};
