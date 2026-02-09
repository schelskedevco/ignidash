/**
 * Social Security benefit taxation thresholds by filing status
 *
 * Determines what percentage of Social Security benefits are subject to income tax
 * based on combined income (AGI + nontaxable interest + half of SS benefits).
 * Source: IRS Publication 915.
 */

/** Threshold determining taxable percentage of Social Security benefits */
export type SocialSecurityTaxThreshold = { min: number; max: number; taxablePercentage: number };

export const SOCIAL_SECURITY_TAX_THRESHOLDS_SINGLE: SocialSecurityTaxThreshold[] = [
  { min: 0, max: 25000, taxablePercentage: 0 },
  { min: 25000, max: 34000, taxablePercentage: 0.5 },
  { min: 34000, max: Infinity, taxablePercentage: 0.85 },
];

export const SOCIAL_SECURITY_TAX_THRESHOLDS_MARRIED_FILING_JOINTLY: SocialSecurityTaxThreshold[] = [
  { min: 0, max: 32000, taxablePercentage: 0 },
  { min: 32000, max: 44000, taxablePercentage: 0.5 },
  { min: 44000, max: Infinity, taxablePercentage: 0.85 },
];

export const SOCIAL_SECURITY_TAX_THRESHOLDS_HEAD_OF_HOUSEHOLD: SocialSecurityTaxThreshold[] = [
  { min: 0, max: 25000, taxablePercentage: 0 },
  { min: 25000, max: 34000, taxablePercentage: 0.5 },
  { min: 34000, max: Infinity, taxablePercentage: 0.85 },
];
