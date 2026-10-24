/**
 * FICA tax parameters (Social Security and Medicare)
 *
 * Social Security wage base and Additional Medicare Tax thresholds.
 * Updated annually by the IRS and SSA.
 */

export const SS_WAGE_BASE: Record<number, number> = {
  2026: 176100,
};

export const ADDITIONAL_MEDICARE_THRESHOLDS: Record<string, number> = {
  single: 200000,
  marriedFilingJointly: 250000,
  headOfHousehold: 200000,
};

export const SOCIAL_SECURITY_TAX_RATE = 0.062;
export const MEDICARE_TAX_RATE = 0.0145;
export const ADDITIONAL_MEDICARE_TAX_RATE = 0.009;

/** Self-employment Social Security rate (employee + employer portions) */
export const SE_SOCIAL_SECURITY_TAX_RATE = 0.124;
/** Self-employment Medicare rate (employee + employer portions) */
export const SE_MEDICARE_TAX_RATE = 0.029;
/** 92.35% of SE net earnings are subject to SE tax */
export const SE_DEDUCTION_RATIO = 0.9235;