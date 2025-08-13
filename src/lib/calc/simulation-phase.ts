/**
 * Simulation Phases - Financial Life Stage Management
 *
 * This module provides a state machine implementation for modeling different phases of financial life
 * (accumulation vs. retirement). Each phase defines its own cash flow patterns, transition conditions,
 * and portfolio management strategies to accurately model changing financial needs over time.
 *
 * Architecture:
 * - SimulationPhase interface for consistent phase behavior
 * - State machine pattern with transition logic between phases
 * - Phase-specific cash flow management and portfolio operations
 * - Tax-aware withdrawal calculations for retirement scenarios
 *
 * Key Features:
 * - Accumulation phase with income and expense management
 * - Retirement phase with withdrawal-based cash flow
 * - Automatic phase transitions based on portfolio milestones
 * - Tax-adjusted withdrawal calculations for retirement funding
 * - FIRE (Financial Independence, Retire Early) detection logic
 * - Portfolio preservation strategies during different life stages
 */

import { QuickPlanInputs } from '@/lib/schemas/quick-plan-schema';

import { Portfolio } from './portfolio';
import { CashFlow, AnnualIncome, AnnualExpenses, PassiveRetirementIncome, RetirementExpenses } from './cash-flow';
import WithdrawalStrategy, { WithdrawalsWithMetadata } from './withdrawal-strategy';

/**
 * Simulation phase interface defining financial life stage behavior
 * Implements the strategy pattern for different phases of financial planning
 */
export interface SimulationPhase {
  /**
   * Gets the cash flow components active during this phase
   * @param inputs - User's financial planning inputs
   * @returns Array of cash flow components for this phase
   */
  getCashFlows(inputs: QuickPlanInputs): CashFlow[];

  /**
   * Determines if the portfolio and inputs meet the conditions to transition to this phase
   * Each phase owns its own entry conditions, reducing coupling between phases
   * @param portfolio - Current portfolio state
   * @param inputs - User's financial planning inputs
   * @returns True if transition to this phase is allowed
   */
  canTransitionTo(portfolio: Portfolio, inputs: QuickPlanInputs): boolean;

  /**
   * Gets the next phase in the simulation sequence
   * @param inputs - User's financial planning inputs
   * @returns Next simulation phase or null if this is the final phase
   */
  getNextPhase(inputs: QuickPlanInputs): SimulationPhase | null;

  /**
   * Gets the human-readable name of this phase
   * @returns Phase name for display purposes
   */
  getName(): string;

  /**
   * Processes a single year of this phase, applying cash flows to the portfolio
   * @param year - Current simulation year
   * @param portfolio - Current portfolio state
   * @param inputs - User's financial planning inputs
   * @returns Tuple with updated portfolio, array of cash flows, and withdrawal amount
   */
  processYear(
    year: number,
    portfolio: Portfolio,
    inputs: QuickPlanInputs
  ): [Portfolio, Array<{ name: string; amount: number }>, WithdrawalsWithMetadata];

  /**
   * Determines if this phase is sensitive to sequence of returns risk
   * Sensitive phases will be tested against all categories of historical market downturns
   * (small, medium, and large catastrophes) to provide comprehensive risk analysis
   * @returns True if this phase should undergo black swan event testing
   */
  isSensitiveToSORR(): boolean;
}

/**
 * Accumulation Phase Implementation
 * Models the working years with income generation and expense management
 */
export class AccumulationPhase implements SimulationPhase {
  getCashFlows(inputs: QuickPlanInputs): CashFlow[] {
    return [new AnnualIncome(inputs), new AnnualExpenses(inputs)];
  }

  canTransitionTo(portfolio: Portfolio, inputs: QuickPlanInputs): boolean {
    return true;
  }

  getNextPhase(inputs: QuickPlanInputs): SimulationPhase | null {
    return new RetirementPhase();
  }

  getName(): string {
    return 'Accumulation';
  }

  processYear(
    year: number,
    portfolio: Portfolio,
    inputs: QuickPlanInputs
  ): [Portfolio, Array<{ name: string; amount: number }>, WithdrawalsWithMetadata] {
    const currentAge = inputs.basics.currentAge! + year;

    let totalCashFlow = 0;
    const cashFlows: Array<{ name: string; amount: number }> = [];

    for (const cashFlow of this.getCashFlows(inputs)) {
      if (cashFlow.shouldApply(year, currentAge)) {
        const amount = cashFlow.calculateAmount(year, currentAge);
        totalCashFlow += amount;
        cashFlows.push({ name: cashFlow.name, amount });
      }
    }

    let updatedPortfolio = portfolio;
    let withdrawalAmount = 0;
    if (totalCashFlow > 0) {
      updatedPortfolio = portfolio.withCash(totalCashFlow);
    } else if (totalCashFlow < 0) {
      withdrawalAmount = Math.abs(totalCashFlow);
      updatedPortfolio = portfolio.withWithdrawal(withdrawalAmount);
    }

    const withdrawalPercentage = !portfolio.getIsDepleted() ? (withdrawalAmount / portfolio.getTotalValue()) * 100 : 0;
    return [updatedPortfolio, cashFlows, { withdrawalAmount, withdrawalPercentage }];
  }

  isSensitiveToSORR(): boolean {
    return false;
  }
}

/**
 * Retirement Phase Implementation
 * Models retirement years with portfolio withdrawals and passive income
 * Includes tax-adjusted withdrawal calculations for sustainable spending
 */
export class RetirementPhase implements SimulationPhase {
  getCashFlows(inputs: QuickPlanInputs): CashFlow[] {
    return [new PassiveRetirementIncome(inputs), new RetirementExpenses(inputs)];
  }

  canTransitionTo(portfolio: Portfolio, inputs: QuickPlanInputs): boolean {
    return portfolio.getTotalValue() >= WithdrawalStrategy.getConstantDollarRequiredPortfolio(inputs);
  }

  getNextPhase(inputs: QuickPlanInputs): SimulationPhase | null {
    return null;
  }

  getName(): string {
    return 'Retirement';
  }

  processYear(
    year: number,
    portfolio: Portfolio,
    inputs: QuickPlanInputs
  ): [Portfolio, Array<{ name: string; amount: number }>, WithdrawalsWithMetadata] {
    const currentAge = inputs.basics.currentAge! + year;

    let totalCashFlow = 0;
    const cashFlows: Array<{ name: string; amount: number }> = [];

    for (const cashFlow of this.getCashFlows(inputs)) {
      if (cashFlow.shouldApply(year, currentAge)) {
        const amount = cashFlow.calculateAmount(year, currentAge);
        totalCashFlow += amount;
        cashFlows.push({ name: cashFlow.name, amount });
      }
    }

    let updatedPortfolio;
    if (totalCashFlow >= 0) {
      updatedPortfolio = portfolio.withCash(totalCashFlow);
      return [updatedPortfolio, cashFlows, { withdrawalAmount: 0, withdrawalPercentage: 0 }];
    }

    const shortfall = Math.abs(totalCashFlow);
    const effectiveTaxRate = inputs.retirementFunding.effectiveTaxRate;
    const withdrawalAmount = shortfall / (1 - effectiveTaxRate / 100);
    updatedPortfolio = portfolio.withWithdrawal(withdrawalAmount);

    const taxAmount = withdrawalAmount - shortfall;
    if (taxAmount > 0) {
      cashFlows.push({ name: 'Withdrawal Taxes', amount: -taxAmount });
    }

    const withdrawalPercentage = !portfolio.getIsDepleted() ? (withdrawalAmount / portfolio.getTotalValue()) * 100 : 0;
    return [updatedPortfolio, cashFlows, { withdrawalAmount, withdrawalPercentage }];
  }

  isSensitiveToSORR(): boolean {
    return true;
  }
}
