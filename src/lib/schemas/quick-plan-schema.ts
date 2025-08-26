/**
 * Quick Plan Schema - Financial Planning Form Validation
 *
 * This module provides comprehensive Zod schema definitions for financial planning form validation.
 * It includes schemas for user inputs across multiple categories (basics, growth rates, allocation,
 * goals, market assumptions, retirement funding) with custom validation logic and error handling.
 *
 * Architecture:
 * - Zod schemas with custom validation rules for financial data
 * - Helper functions for common field types (currency, percentage, age)
 * - Type-safe field and section validation utilities
 * - Comprehensive error formatting for UI display
 * - Custom refinement validators for complex business rules
 *
 * Key Features:
 * - Number coercion with null/empty handling
 * - Currency validation with configurable limits
 * - Percentage validation with custom ranges
 * - Age validation with customizable messages
 * - Asset allocation validation ensuring 100% total
 * - Type-safe validation helpers for form integration
 */

import { z } from 'zod';

import { currencyFieldAllowsZero, currencyFieldForbidsZero, percentageField, ageField } from '@/lib/utils/zod-schema-helpers';

import { incomeFormSchema } from './income-form-schema';
import { accountFormSchema } from './account-form-schema';
import { expenseFormSchema } from './expense-form-schema';

// ================================
// SCHEMA DEFINITIONS
// ================================

/**
 * Basic financial information schema
 * Core user data including age, income, expenses, and current assets
 */
export const basicsSchema = z.object({
  currentAge: ageField(16, 100, {
    min: 'You must be at least 16 years old to use this calculator',
    max: 'Age cannot exceed 100 years',
  }).nullable(),
  annualIncome: currencyFieldAllowsZero('Annual income cannot be negative (enter 0 if no current income)').nullable(),
  annualExpenses: currencyFieldForbidsZero('Annual expenses must be greater than 0').nullable(),
  investedAssets: currencyFieldAllowsZero('Invested assets cannot be negative (enter 0 if starting from scratch)').nullable(),
});

/**
 * Asset allocation schema (disclosure section)
 * Portfolio allocation between stocks, bonds, and cash with 100% total validation
 */
export const allocationSchema = z
  .object({
    stockAllocation: percentageField(0, 100, 'Stock allocation'),
    bondAllocation: percentageField(0, 100, 'Bond allocation'),
    cashAllocation: percentageField(0, 100, 'Cash allocation'),
  })
  .refine(
    (data) => {
      const total = data.stockAllocation + data.bondAllocation + data.cashAllocation;
      return Math.abs(total - 100) < 0.01;
    },
    {
      message: 'Asset allocation must total 100%',
      path: ['_form'], // This allows us to show a general form error
    }
  );

/**
 * Growth rates schema (disclosure section)
 * Handles income and expense growth assumptions
 */
export const growthRatesSchema = z.object({
  incomeGrowthRate: percentageField(0, 50, 'Income growth rate'),
  expenseGrowthRate: percentageField(0, 10, 'Expense growth rate'),
});

/**
 * Goals schema
 * Retirement planning targets and expected income sources
 */
export const goalsSchema = z.object({
  retirementExpenses: currencyFieldForbidsZero('Retirement expenses are required and must be greater than 0').nullable(),
});

/**
 * Market assumptions schema
 * Expected returns for different asset classes and inflation rate
 */
export const marketAssumptionsSchema = z.object({
  stockReturn: percentageField(0, 20, 'Stock return'),
  bondReturn: percentageField(0, 15, 'Bond return'),
  cashReturn: percentageField(0, 10, 'Cash return'),
  inflationRate: percentageField(0, 8, 'Inflation rate'),
  simulationMode: z.enum(['fixedReturns', 'monteCarlo', 'historicalBacktest']),
});

/**
 * Retirement funding schema
 * Advanced retirement planning parameters including withdrawal rates and tax considerations
 */
export const retirementFundingSchema = z.object({
  safeWithdrawalRate: percentageField(2, 6, 'Safe withdrawal rate'),
  retirementIncome: currencyFieldAllowsZero(
    'Passive retirement income cannot be negative (enter 0 if no pensions/Social Security expected)'
  ),
  lifeExpectancy: ageField(50, 110, {
    min: 'Life expectancy must be at least 50 years',
    max: 'Life expectancy must be at most 110 years',
  }),
  effectiveTaxRate: percentageField(0, 50, 'Effective tax rate'),
});

/**
 * Combined schema for all inputs
 * Master schema that includes all sections of the financial planning form
 */
export const quickPlanSchema = z.object({
  basics: basicsSchema,
  growthRates: growthRatesSchema,
  allocation: allocationSchema,
  goals: goalsSchema,
  marketAssumptions: marketAssumptionsSchema,
  retirementFunding: retirementFundingSchema,
  incomes: z.record(z.string(), incomeFormSchema),
  accounts: z.record(z.string(), accountFormSchema),
  expenses: z.record(z.string(), expenseFormSchema),
});

// ================================
// TYPE DEFINITIONS
// ================================

/**
 * TypeScript type definitions inferred from Zod schemas
 * Provides type safety for all financial planning form data
 */
export type QuickPlanInputs = z.infer<typeof quickPlanSchema>;
export type BasicsInputs = z.infer<typeof basicsSchema>;
export type GrowthRatesInputs = z.infer<typeof growthRatesSchema>;
export type AllocationInputs = z.infer<typeof allocationSchema>;
export type GoalsInputs = z.infer<typeof goalsSchema>;
export type MarketAssumptionsInputs = z.infer<typeof marketAssumptionsSchema>;
export type RetirementFundingInputs = z.infer<typeof retirementFundingSchema>;

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Formats Zod validation errors for UI display
 * Converts Zod error objects into a flat record of field paths to error messages
 *
 * @param error - The Zod error object to format
 * @returns A flat object mapping field paths to error messages
 *
 * @example
 * ```typescript
 * const result = schema.safeParse(data);
 * if (!result.success) {
 *   const errors = formatZodErrors(result.error);
 *   // errors = { "basics.currentAge": "Age must be at least 16" }
 * }
 * ```
 */
export const formatZodErrors = (error: z.ZodError) => {
  const formatted: Record<string, string> = {};

  error.issues.forEach((err) => {
    const path = err.path.join('.');
    formatted[path] = err.message;
  });

  return formatted;
};

/**
 * Type constraint to ensure section exists in both QuickPlanInputs and quickPlanSchema.shape
 * Provides type safety for validation functions
 */
type ValidSection = keyof QuickPlanInputs & keyof typeof quickPlanSchema.shape;

/**
 * Validates a single field within a section
 * Used for real-time form validation as users type
 *
 * @param section - The section name (e.g., 'basics', 'goals')
 * @param field - The field name within the section
 * @param value - The new value to validate
 * @param currentData - The current section data
 * @returns Validation result with success status, validated data, or error message
 *
 * @example
 * ```typescript
 * const result = validateField('basics', 'currentAge', 25, currentBasicsData);
 * if (result.valid) {
 *   // Use result.data for the validated section data
 * } else {
 *   // Display result.error to the user
 * }
 * ```
 */
export const validateField = <T extends ValidSection>(
  section: T,
  field: keyof QuickPlanInputs[T],
  value: unknown,
  currentData: QuickPlanInputs[T]
): { valid: boolean; data?: QuickPlanInputs[T]; error?: string } => {
  // Get the schema for this section
  const sectionSchema = quickPlanSchema.shape[section];

  // Create updated data
  const updatedData = { ...currentData, [field]: value };

  // Use safeParse for cleaner error handling
  const result = sectionSchema.safeParse(updatedData);

  if (result.success) {
    return {
      valid: true,
      data: result.data as QuickPlanInputs[T],
    };
  }

  // Extract the most relevant error message for field validation
  const { error } = result;

  // Find field-specific error or form-level error
  const relevantIssue =
    error.issues.find((issue) => {
      return issue.path[0] === field || issue.path.length === 0;
    }) || error.issues[0];

  return {
    valid: false,
    error: relevantIssue.message,
  };
};

/**
 * Validates an entire section of the form
 * Used for section-level validation and form submission
 *
 * @param section - The section name (e.g., 'basics', 'goals')
 * @param sectionData - The complete section data to validate
 * @returns Validation result with success status, validated data, or error message
 *
 * @example
 * ```typescript
 * const result = validateSection('allocation', allocationData);
 * if (result.valid) {
 *   // Section is valid, use result.data
 * } else {
 *   // Show result.error (e.g., "Asset allocation must total 100%")
 * }
 * ```
 */
export const validateSection = <T extends ValidSection>(
  section: T,
  sectionData: unknown
): { valid: boolean; data?: QuickPlanInputs[T]; error?: string } => {
  // Get the schema for this section
  const sectionSchema = quickPlanSchema.shape[section];

  // Use safeParse for cleaner error handling
  const result = sectionSchema.safeParse(sectionData);

  if (result.success) {
    return {
      valid: true,
      data: result.data as QuickPlanInputs[T],
    };
  }

  // Extract form-level error message for section validation
  const { error } = result;

  // For section validation, look specifically for form-level errors
  const relevantIssue =
    error.issues.find((issue) => {
      return issue.path[0] === '_form' || issue.path.length === 0;
    }) || error.issues[0];

  return {
    valid: false,
    error: relevantIssue.message,
  };
};
