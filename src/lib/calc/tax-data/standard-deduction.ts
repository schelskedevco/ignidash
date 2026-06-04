/**
 * Federal standard deduction amounts by filing status and age
 *
 * Tax year 2026. Source: IRS 2026 inflation adjustments.
 * OBBBA (Omnibus Bipartisan Budget Bill Act) temporarily increased the
 * additional standard deduction for age 65+ from $1,550 to $2,000
 * for tax years 2025–2028.
 */

import type { FilingStatus } from '@/lib/schemas/inputs/tax-settings-form-schema';

export const BASE_STANDARD_DEDUCTION_SINGLE = 16100;
export const BASE_STANDARD_DEDUCTION_MARRIED_FILING_JOINTLY = 32200;
export const BASE_STANDARD_DEDUCTION_HEAD_OF_HOUSEHOLD = 24150;

/** Additional deduction per person age 65+ (OBBBA-enhanced, 2025–2028) */
export const SENIOR_ADDITIONAL_OBBBA = 2000;
/** Additional deduction per person age 65+ (pre-OBBBA, reverts 2029+) */
export const SENIOR_ADDITIONAL_PRE_OBBBA = 1550;

/** Year OBBBA enhancement expires */
export const OBBBA_EXPIRATION_YEAR = 2028;

function getBaseDeduction(filingStatus: FilingStatus): number {
  switch (filingStatus) {
    case 'single':
      return BASE_STANDARD_DEDUCTION_SINGLE;
    case 'marriedFilingJointly':
      return BASE_STANDARD_DEDUCTION_MARRIED_FILING_JOINTLY;
    case 'headOfHousehold':
      return BASE_STANDARD_DEDUCTION_HEAD_OF_HOUSEHOLD;
  }
}

export function getStandardDeduction(
  filingStatus: FilingStatus,
  age: number,
  spouseAge?: number,
  year: number = 2026,
  obbbaExpirationYear: number = OBBBA_EXPIRATION_YEAR,
): number {
  const base = getBaseDeduction(filingStatus);
  const isSeniorEnhancementActive = year <= obbbaExpirationYear;
  const seniorAdditional = isSeniorEnhancementActive ? SENIOR_ADDITIONAL_OBBBA : SENIOR_ADDITIONAL_PRE_OBBBA;

  let additionalDeduction = 0;
  if (age >= 65) additionalDeduction += seniorAdditional;
  if (filingStatus === 'marriedFilingJointly' && spouseAge !== undefined && spouseAge >= 65) {
    additionalDeduction += seniorAdditional;
  }

  return base + additionalDeduction;
}
