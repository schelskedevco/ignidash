/**
 * Federal income tax brackets by filing status
 *
 * Tax year 2026. Source: IRS 2026 inflation adjustments (including OBBBA amendments).
 */

/** Progressive bracket for ordinary income taxation */
export type FederalIncomeTaxBracket = { min: number; max: number; rate: number };

export const FEDERAL_INCOME_TAX_BRACKETS_SINGLE: FederalIncomeTaxBracket[] = [
  { min: 0, max: 12400, rate: 0.1 },
  { min: 12400, max: 50400, rate: 0.12 },
  { min: 50400, max: 105700, rate: 0.22 },
  { min: 105700, max: 201775, rate: 0.24 },
  { min: 201775, max: 256225, rate: 0.32 },
  { min: 256225, max: 640600, rate: 0.35 },
  { min: 640600, max: Infinity, rate: 0.37 },
];

export const FEDERAL_INCOME_TAX_BRACKETS_MARRIED_FILING_JOINTLY: FederalIncomeTaxBracket[] = [
  { min: 0, max: 24800, rate: 0.1 },
  { min: 24800, max: 100800, rate: 0.12 },
  { min: 100800, max: 211400, rate: 0.22 },
  { min: 211400, max: 403550, rate: 0.24 },
  { min: 403550, max: 512450, rate: 0.32 },
  { min: 512450, max: 768700, rate: 0.35 },
  { min: 768700, max: Infinity, rate: 0.37 },
];

export const FEDERAL_INCOME_TAX_BRACKETS_HEAD_OF_HOUSEHOLD: FederalIncomeTaxBracket[] = [
  { min: 0, max: 17700, rate: 0.1 },
  { min: 17700, max: 67450, rate: 0.12 },
  { min: 67450, max: 105700, rate: 0.22 },
  { min: 105700, max: 201775, rate: 0.24 },
  { min: 201775, max: 256200, rate: 0.32 },
  { min: 256200, max: 640600, rate: 0.35 },
  { min: 640600, max: Infinity, rate: 0.37 },
];
