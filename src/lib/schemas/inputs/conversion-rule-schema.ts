/**
 * Roth conversion rule schema.
 *
 * Defines how funds move from tax-deferred accounts (IRA, 401k, 403b) to
 * Roth accounts (Roth IRA, Roth 401k, Roth 403b). Supports three amount
 * strategies: fixed dollar, fill up to a target marginal tax bracket, or
 * convert the entire balance.
 */

import { z } from 'zod';

import {
  currencyFieldForbidsZero,
  optionalCurrencyFieldAllowsZero,
  coerceNumber,
} from '@/lib/utils/zod-utils';

export const conversionRuleSchema = z.object({
  id: z.string(),
  enabled: z.boolean().default(true),
  /** Name for display in the UI */
  name: z.string().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
  /** Source account ID (must be tax-deferred: 401k, 403b, ira) */
  sourceAccountId: z.string().min(1, 'Source account is required'),
  /** Target account ID (must be Roth: roth401k, roth403b, rothIra) */
  targetAccountId: z.string().min(1, 'Target account is required'),
  /** When conversions start */
  startTimePoint: z.discriminatedUnion('type', [
    z.object({ type: z.literal('immediate') }),
    z.object({ type: z.literal('customAge'), age: coerceNumber(z.number().min(0).max(120)) }),
    z.object({ type: z.literal('retirement') }),
  ]),
  /** When conversions stop (optional — runs indefinitely if omitted) */
  endTimePoint: z
    .discriminatedUnion('type', [
      z.object({ type: z.literal('customAge'), age: coerceNumber(z.number().min(0).max(120)) }),
      z.object({ type: z.literal('rmdAge') }),
    ])
    .optional(),
  /** How the conversion amount is determined */
  amount: z.discriminatedUnion('type', [
    // Fixed dollar amount each year
    z.object({
      type: z.literal('fixedAmount'),
      dollarAmount: currencyFieldForbidsZero('Amount must be greater than 0'),
    }),
    // Fill up to a target marginal tax bracket
    z.object({
      type: z.literal('fillBracket'),
      targetBracket: coerceNumber(z.number().min(0.1).max(0.37)),
    }),
    // Convert the entire account balance
    z.object({ type: z.literal('fullBalance') }),
  ]),
});

export type ConversionRuleInputs = z.infer<typeof conversionRuleSchema>;