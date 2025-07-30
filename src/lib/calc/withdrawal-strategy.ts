/**
 * Withdrawal Strategy - Retirement Portfolio Calculation Framework
 *
 * This module provides strategic calculations for determining portfolio requirements
 * based on withdrawal strategies during retirement. It implements the foundation for
 * various withdrawal methodologies that help determine how much capital is needed
 * to sustain retirement spending while accounting for taxes and safe withdrawal rates.
 *
 * Architecture:
 * - Abstract class pattern for extensible withdrawal strategies
 * - Tax-aware calculations for gross withdrawal requirements
 * - Integration with safe withdrawal rate methodology
 *
 * Key Features:
 * - Constant dollar withdrawal strategy implementation
 * - Tax-adjusted portfolio requirement calculations
 * - Safe withdrawal rate integration for sustainable retirement planning
 * - Extensible design for future withdrawal strategy variations
 */

import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

/**
 * WithdrawalStrategy - Abstract Base for Retirement Withdrawal Calculations
 *
 * Provides strategic calculations for determining the minimum portfolio size required
 * to support retirement expenses using various withdrawal methodologies. The class
 * serves as a foundation for implementing different withdrawal strategies while
 * maintaining consistent tax and safety considerations.
 *
 * Current implementation focuses on constant dollar withdrawals with safe withdrawal
 * rate methodology, commonly used in retirement planning for predictable income streams.
 */
export default abstract class WithdrawalStrategy {
  /**
   * Calculates the required portfolio size for constant dollar withdrawals
   * Uses the safe withdrawal rate approach to determine sustainable portfolio size
   *
   * The calculation accounts for:
   * - Gross withdrawals needed after tax considerations
   * - Safe withdrawal rate to ensure portfolio longevity
   * - Effective tax rate on retirement withdrawals
   *
   * Formula: Required Portfolio = (Annual Expenses / (1 - Tax Rate)) / Safe Withdrawal Rate
   *
   * @param inputs - User's financial planning inputs including retirement goals and funding parameters
   * @returns Minimum portfolio value required to sustain retirement expenses
   * @throws Will throw if retirement expenses are not defined in inputs
   */
  static getConstantDollarRequiredPortfolio(inputs: QuickPlanInputs): number {
    const retirementExpenses = inputs.goals.retirementExpenses!;
    const { safeWithdrawalRate, effectiveTaxRate } = inputs.retirementFunding;

    const grossWithdrawal = retirementExpenses / (1 - effectiveTaxRate / 100);
    return grossWithdrawal / (safeWithdrawalRate / 100);
  }
}
