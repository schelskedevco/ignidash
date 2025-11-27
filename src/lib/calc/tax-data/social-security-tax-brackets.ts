export type SocialSecurityTaxBracket = { min: number; max: number; taxableRate: number };

export const SOCIAL_SECURITY_TAX_BRACKETS_SINGLE: SocialSecurityTaxBracket[] = [
  { min: 0, max: 25000, taxableRate: 0 },
  { min: 25000, max: 34000, taxableRate: 0.5 },
  { min: 34000, max: Infinity, taxableRate: 0.85 },
];

export const SOCIAL_SECURITY_TAX_BRACKETS_MARRIED_FILING_JOINTLY: SocialSecurityTaxBracket[] = [
  { min: 0, max: 32000, taxableRate: 0 },
  { min: 32000, max: 44000, taxableRate: 0.5 },
  { min: 44000, max: Infinity, taxableRate: 0.85 },
];

export const SOCIAL_SECURITY_TAX_BRACKETS_HEAD_OF_HOUSEHOLD: SocialSecurityTaxBracket[] = [
  { min: 0, max: 25000, taxableRate: 0 },
  { min: 25000, max: 34000, taxableRate: 0.5 },
  { min: 34000, max: Infinity, taxableRate: 0.85 },
];
