/**
 * Federal income tax brackets by filing status
 *
 * Tax year 2025. Source: IRS Revenue Procedure 2024-40.
 */

/** Progressive bracket for ordinary income taxation */
export type IncomeTaxBracket = { min: number; max: number; rate: number };

export const INCOME_TAX_BRACKETS_SINGLE: IncomeTaxBracket[] = [
  { min: 0, max: 11925, rate: 0.1 },
  { min: 11925, max: 48475, rate: 0.12 },
  { min: 48475, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250525, rate: 0.32 },
  { min: 250525, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 },
];

export const INCOME_TAX_BRACKETS_MARRIED_FILING_JOINTLY: IncomeTaxBracket[] = [
  { min: 0, max: 23850, rate: 0.1 },
  { min: 23850, max: 96950, rate: 0.12 },
  { min: 96950, max: 206700, rate: 0.22 },
  { min: 206700, max: 394600, rate: 0.24 },
  { min: 394600, max: 501050, rate: 0.32 },
  { min: 501050, max: 751600, rate: 0.35 },
  { min: 751600, max: Infinity, rate: 0.37 },
];

export const INCOME_TAX_BRACKETS_HEAD_OF_HOUSEHOLD: IncomeTaxBracket[] = [
  { min: 0, max: 16550, rate: 0.1 },
  { min: 16550, max: 63100, rate: 0.12 },
  { min: 63100, max: 100500, rate: 0.22 },
  { min: 100500, max: 191950, rate: 0.24 },
  { min: 191950, max: 243700, rate: 0.32 },
  { min: 243700, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
];
