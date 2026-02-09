/**
 * Federal long-term capital gains tax brackets by filing status
 *
 * Tax year 2025. Source: IRS Revenue Procedure 2024-40.
 */

/** Progressive bracket for long-term capital gains taxation */
export type CapitalGainsTaxBracket = { min: number; max: number; rate: number };

export const CAPITAL_GAINS_TAX_BRACKETS_SINGLE: CapitalGainsTaxBracket[] = [
  { min: 0, max: 47025, rate: 0.0 },
  { min: 47025, max: 518900, rate: 0.15 },
  { min: 518900, max: Infinity, rate: 0.2 },
];

export const CAPITAL_GAINS_TAX_BRACKETS_MARRIED_FILING_JOINTLY: CapitalGainsTaxBracket[] = [
  { min: 0, max: 94050, rate: 0.0 },
  { min: 94050, max: 583750, rate: 0.15 },
  { min: 583750, max: Infinity, rate: 0.2 },
];

export const CAPITAL_GAINS_TAX_BRACKETS_HEAD_OF_HOUSEHOLD: CapitalGainsTaxBracket[] = [
  { min: 0, max: 63000, rate: 0.0 },
  { min: 63000, max: 551350, rate: 0.15 },
  { min: 551350, max: Infinity, rate: 0.2 },
];
