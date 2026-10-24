/**
 * Roth conversion processing for the simulation engine
 *
 * Handles moving funds from tax-deferred accounts (IRA, 401k, 403b) to
 * Roth accounts (Roth IRA, Roth 401k, Roth 403b). Supports fixed amount,
 * bracket-filling, and full balance conversion strategies.
 *
 * Conversions are processed annually (before tax settlement) so the converted
 * amount is included in ordinary income for the tax calculation.
 */

import type { ConversionRuleInputs } from '@/lib/schemas/inputs/conversion-rule-schema';
import type { PhaseData } from './phase';
import { TaxDeferredAccount, TaxFreeAccount } from './account';
import { Portfolio } from './portfolio';
import { type AssetAllocation, zeroAssetAmounts } from './asset';

/** Annual conversion tracking data */
export interface ConversionData {
  totalConverted: number;
  conversionsByRule: Record<string, number>;
  perAccountConversions: Record<
    string,
    { fromAccountId: string; toAccountId: string; amount: number }
  >;
}

/** Processes Roth conversion rules during simulation */
export class ConversionProcessor {
  private annualConversionData: ConversionData = {
    totalConverted: 0,
    conversionsByRule: {},
    perAccountConversions: {},
  };

  /** Cached last-year tax data for bracket-filling estimation */
  private lastTopMarginalRate: number | null = null;
  private lastTaxableIncome: number | null = null;

  constructor(
    private portfolio: Portfolio,
    private getAge: () => number,
    private getRmdAge: () => number
  ) {}

  /**
   * Records marginal rate info from the tax processor for bracket-filling in the next year
   */
  recordTaxData(topMarginalRate: number, taxableIncome: number): void {
    this.lastTopMarginalRate = topMarginalRate;
    this.lastTaxableIncome = taxableIncome;
  }

  /**
   * Processes all active conversion rules for the current simulation year
   * @param rules - All conversion rules (enabled/disabled)
   * @param phase - Current simulation phase (accumulation/retirement)
   * @returns Conversion data with per-rule and per-account breakdowns
   */
  processConversionRules(
    rules: ConversionRuleInputs[],
    phase: PhaseData | null
  ): ConversionData {
    // Reset annual data
    this.annualConversionData = {
      totalConverted: 0,
      conversionsByRule: {},
      perAccountConversions: {},
    };

    const activeRules = rules.filter(
      (rule) => rule.enabled && this.isRuleActive(rule, phase)
    );

    for (const rule of activeRules) {
      const fromAccount = this.portfolio
        .getAccounts()
        .find(
          (a) => a.getAccountID() === rule.sourceAccountId
        ) as TaxDeferredAccount | undefined;
      const toAccount = this.portfolio
        .getAccounts()
        .find(
          (a) => a.getAccountID() === rule.targetAccountId
        ) as TaxFreeAccount | undefined;

      if (!fromAccount || !toAccount) continue;
      if (fromAccount.getBalance() <= 0) continue;

      const conversionAmount = this.calculateConversionAmount(rule, fromAccount);
      if (conversionAmount <= 0) continue;

      // Cap conversion at available balance
      const actualAmount = Math.min(conversionAmount, fromAccount.getBalance());
      if (actualAmount <= 0) continue;

      // Use the portfolio's weighted asset allocation for conversion asset mix
      const allocation =
        this.portfolio.getWeightedAssetAllocation() ?? {
          stocks: 0.6,
          bonds: 0.4,
          cash: 0,
        };

      // Execute the conversion: withdraw from tax-deferred, deposit into Roth
      fromAccount.applyConversion(actualAmount, allocation);
      toAccount.applyConversion(actualAmount, allocation);

      this.annualConversionData.totalConverted += actualAmount;
      this.annualConversionData.conversionsByRule[rule.id] = actualAmount;
      this.annualConversionData.perAccountConversions[rule.sourceAccountId] = {
        fromAccountId: rule.sourceAccountId,
        toAccountId: rule.targetAccountId,
        amount: actualAmount,
      };
    }

    return this.annualConversionData;
  }

  /**
   * Determines if a conversion rule is active at the current simulation time
   */
  private isRuleActive(
    rule: ConversionRuleInputs,
    phase: PhaseData | null
  ): boolean {
    const age = this.getAge();

    // Check start condition
    switch (rule.startTimePoint.type) {
      case 'immediate':
        break; // Always active
      case 'customAge':
        if (age < rule.startTimePoint.age) return false;
        break;
      case 'retirement':
        if (phase?.name !== 'retirement') return false;
        break;
    }

    // Check end condition
    if (rule.endTimePoint) {
      switch (rule.endTimePoint.type) {
        case 'customAge':
          if (age >= rule.endTimePoint.age) return false;
          break;
        case 'rmdAge':
          if (age >= this.getRmdAge()) return false;
          break;
      }
    }

    return true;
  }

  /**
   * Calculates the conversion amount for a rule based on its strategy
   */
  private calculateConversionAmount(
    rule: ConversionRuleInputs,
    fromAccount: TaxDeferredAccount
  ): number {
    switch (rule.amount.type) {
      case 'fixedAmount':
        return rule.amount.dollarAmount;
      case 'fullBalance':
        return fromAccount.getBalance();
      case 'fillBracket': {
        // Need tax data from previous year to estimate bracket headroom
        if (this.lastTopMarginalRate === null || this.lastTaxableIncome === null) {
          return 0; // Can't compute in first year
        }

        const targetRate = rule.amount.targetBracket;
        if (this.lastTopMarginalRate >= targetRate) {
          return 0; // Already at or above target bracket
        }

        // Estimate: fill up to the target bracket's max
        // This is approximate — real bracket-filling requires iterating the tax loop
        // with the conversion included. For a first pass, we estimate using the
        // previous year's tax brackets.
        const headroom = this.estimateBracketHeadroom(targetRate);

        return Math.max(0, Math.min(headroom, fromAccount.getBalance()));
      }
    }
  }

  /**
   * Estimates the headroom available in the target bracket.
   *
   * Uses the previous year's marginal bracket and attempts to approximate
   * how much additional income can be added before hitting the target rate.
   *
   * This is a simplified approach — a full implementation would iterate
   * within the tax convergence loop for exact bracket-filling.
   */
  private estimateBracketHeadroom(targetRate: number): number {
    // Simplified: use last year's taxable income and approximate bracket boundaries.
    // The standard deduction is ~$15,000 for single and brackets start after that.
    // We estimate: convert enough to reach targetRate bracket but not exceed it.
    if (this.lastTaxableIncome === null) return 0;

    // Common 2026 tax brackets (single) for estimation
    const bracketThresholds: Array<{ min: number; max: number; rate: number }> = [
      { min: 0, max: 11925, rate: 0.1 },
      { min: 11925, max: 48475, rate: 0.12 },
      { min: 48475, max: 103350, rate: 0.22 },
      { min: 103350, max: 197300, rate: 0.24 },
      { min: 197300, max: 250525, rate: 0.32 },
      { min: 250525, max: 626350, rate: 0.35 },
      { min: 626350, max: Infinity, rate: 0.37 },
    ];

    const targetBracket = bracketThresholds.find((b) => b.rate === targetRate);
    if (!targetBracket) return 0;

    // Headroom = target bracket max - last year's taxable income
    return Math.max(0, targetBracket.max - this.lastTaxableIncome);
  }

  resetAnnualData(): void {
    this.annualConversionData = {
      totalConverted: 0,
      conversionsByRule: {},
      perAccountConversions: {},
    };
  }

  getAnnualData(): ConversionData {
    return this.annualConversionData;
  }
}