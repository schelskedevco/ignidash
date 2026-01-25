import { describe, it, expect } from 'vitest';

import { TaxProcessor } from './taxes';
import { Portfolio } from './portfolio';
import {
  STANDARD_DEDUCTION_SINGLE,
  STANDARD_DEDUCTION_MARRIED_FILING_JOINTLY,
  STANDARD_DEDUCTION_HEAD_OF_HOUSEHOLD,
} from './tax-data/standard-deduction';
import { NIIT_RATE, NIIT_THRESHOLDS } from './tax-data/niit-thresholds';
import {
  createEmptyPortfolioData,
  createEmptyIncomesData,
  createEmptyReturnsData,
  createEmptyPhysicalAssetsData,
} from './__tests__/test-utils';
import type { SimulationState } from './simulation-engine';

const createMockSimulationState = (age: number): SimulationState => ({
  time: { date: new Date(2025, 0, 1), age, year: 2025, month: 1 },
  portfolio: new Portfolio([]),
  phase: { name: 'retirement' },
  annualData: { expenses: [] },
});

// ============================================================================
// Income Tax Bracket Tests
// ============================================================================

describe('TaxProcessor', () => {
  describe('income tax brackets', () => {
    describe('single filing status', () => {
      it('should apply 10% bracket for income up to $11,925', () => {
        const processor = new TaxProcessor(createMockSimulationState(65), 'single');
        const incomes = createEmptyIncomesData();
        // Income of 26,925 - standard deduction of 15,000 = 11,925 taxable
        incomes.totalIncome = 26925;

        const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

        expect(result.incomeTaxes.taxableIncomeTaxedAsOrdinary).toBe(11925);
        expect(result.incomeTaxes.incomeTaxAmount).toBeCloseTo(1192.5, 2); // 11,925 * 10%
        expect(result.incomeTaxes.topMarginalIncomeTaxRate).toBe(0.1);
      });

      it('should apply 12% bracket for income between $11,925 and $48,475', () => {
        const processor = new TaxProcessor(createMockSimulationState(65), 'single');
        const incomes = createEmptyIncomesData();
        // Income of 63,475 - standard deduction of 15,000 = 48,475 taxable
        incomes.totalIncome = 63475;

        const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

        expect(result.incomeTaxes.taxableIncomeTaxedAsOrdinary).toBe(48475);
        // 11,925 * 10% + (48,475 - 11,925) * 12% = 1,192.50 + 4,386 = 5,578.50
        expect(result.incomeTaxes.incomeTaxAmount).toBeCloseTo(5578.5, 2);
        expect(result.incomeTaxes.topMarginalIncomeTaxRate).toBe(0.12);
      });

      it('should calculate progressive tax across multiple brackets', () => {
        const processor = new TaxProcessor(createMockSimulationState(65), 'single');
        const incomes = createEmptyIncomesData();
        // Income of 115,000 - standard deduction of 15,000 = 100,000 taxable
        incomes.totalIncome = 115000;

        const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

        expect(result.incomeTaxes.taxableIncomeTaxedAsOrdinary).toBe(100000);
        // 11,925 * 10% + (48,475 - 11,925) * 12% + (100,000 - 48,475) * 22%
        // = 1,192.50 + 4,386 + 11,335.50 = 16,914
        expect(result.incomeTaxes.incomeTaxAmount).toBeCloseTo(16914, 2);
        expect(result.incomeTaxes.topMarginalIncomeTaxRate).toBe(0.22);
      });
    });

    describe('married filing jointly', () => {
      it('should use married filing jointly brackets', () => {
        const processor = new TaxProcessor(createMockSimulationState(65), 'marriedFilingJointly');
        const incomes = createEmptyIncomesData();
        // Income of 53,850 - standard deduction of 30,000 = 23,850 taxable
        incomes.totalIncome = 53850;

        const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

        expect(result.incomeTaxes.taxableIncomeTaxedAsOrdinary).toBe(23850);
        expect(result.incomeTaxes.incomeTaxAmount).toBeCloseTo(2385, 2); // 23,850 * 10%
        expect(result.incomeTaxes.topMarginalIncomeTaxRate).toBe(0.1);
      });
    });

    describe('head of household', () => {
      it('should use head of household brackets', () => {
        const processor = new TaxProcessor(createMockSimulationState(65), 'headOfHousehold');
        const incomes = createEmptyIncomesData();
        // Income of 39,050 - standard deduction of 22,500 = 16,550 taxable
        incomes.totalIncome = 39050;

        const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

        expect(result.incomeTaxes.taxableIncomeTaxedAsOrdinary).toBe(16550);
        expect(result.incomeTaxes.incomeTaxAmount).toBeCloseTo(1655, 2); // 16,550 * 10%
        expect(result.incomeTaxes.topMarginalIncomeTaxRate).toBe(0.1);
      });
    });

    describe('standard deduction', () => {
      it('should apply standard deduction before calculating taxes', () => {
        const processor = new TaxProcessor(createMockSimulationState(65), 'single');
        const incomes = createEmptyIncomesData();
        incomes.totalIncome = 50000;

        const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

        // 50,000 - 15,000 standard deduction = 35,000 taxable
        expect(result.incomeTaxes.taxableIncomeTaxedAsOrdinary).toBe(35000);
        expect(result.deductions.standardDeduction).toBe(STANDARD_DEDUCTION_SINGLE);
      });

      it('should use correct standard deduction for each filing status', () => {
        const singleProcessor = new TaxProcessor(createMockSimulationState(65), 'single');
        const marriedProcessor = new TaxProcessor(createMockSimulationState(65), 'marriedFilingJointly');
        const hohProcessor = new TaxProcessor(createMockSimulationState(65), 'headOfHousehold');
        const incomes = createEmptyIncomesData();
        incomes.totalIncome = 100000;

        const singleResult = singleProcessor.process(
          createEmptyPortfolioData(),
          incomes,
          createEmptyReturnsData(),
          createEmptyPhysicalAssetsData()
        );
        const marriedResult = marriedProcessor.process(
          createEmptyPortfolioData(),
          incomes,
          createEmptyReturnsData(),
          createEmptyPhysicalAssetsData()
        );
        const hohResult = hohProcessor.process(
          createEmptyPortfolioData(),
          incomes,
          createEmptyReturnsData(),
          createEmptyPhysicalAssetsData()
        );

        expect(singleResult.deductions.standardDeduction).toBe(STANDARD_DEDUCTION_SINGLE);
        expect(marriedResult.deductions.standardDeduction).toBe(STANDARD_DEDUCTION_MARRIED_FILING_JOINTLY);
        expect(hohResult.deductions.standardDeduction).toBe(STANDARD_DEDUCTION_HEAD_OF_HOUSEHOLD);
      });

      it('should apply standard deduction to ordinary income first, then capital gains', () => {
        const processor = new TaxProcessor(createMockSimulationState(65), 'single');
        const incomes = createEmptyIncomesData();
        incomes.totalIncome = 10000; // Only 10k ordinary income
        const portfolioData = createEmptyPortfolioData();
        portfolioData.realizedGainsForPeriod = 20000; // 20k capital gains

        const result = processor.process(portfolioData, incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

        // Standard deduction of 15k: 10k applied to ordinary, 5k to cap gains
        expect(result.incomeTaxes.taxableIncomeTaxedAsOrdinary).toBe(0);
        expect(result.capitalGainsTaxes.taxableIncomeTaxedAsCapGains).toBe(15000);
      });
    });
  });

  // ============================================================================
  // Capital Gains Tax Tests
  // ============================================================================

  describe('capital gains tax', () => {
    it('should apply 0% rate for gains within 0% bracket', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const incomes = createEmptyIncomesData();
      const portfolioData = createEmptyPortfolioData();
      // No ordinary income, 32,025 gains - 15,000 std deduction = 17,025 taxable
      portfolioData.realizedGainsForPeriod = 32025;

      const result = processor.process(portfolioData, incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      expect(result.capitalGainsTaxes.taxableIncomeTaxedAsCapGains).toBe(17025);
      expect(result.capitalGainsTaxes.capitalGainsTaxAmount).toBe(0);
    });

    it('should apply 15% rate for gains in 15% bracket', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const incomes = createEmptyIncomesData();
      const portfolioData = createEmptyPortfolioData();
      // No ordinary income, 100,000 gains - 15,000 std deduction = 85,000 taxable
      portfolioData.realizedGainsForPeriod = 100000;

      const result = processor.process(portfolioData, incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      // 47,025 at 0% + (85,000 - 47,025) at 15% = 0 + 5,696.25 = 5,696.25
      expect(result.capitalGainsTaxes.capitalGainsTaxAmount).toBeCloseTo(5696.25, 2);
      expect(result.capitalGainsTaxes.topMarginalCapitalGainsTaxRate).toBe(0.15);
    });

    it('should fill brackets with ordinary income first', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const incomes = createEmptyIncomesData();
      // 62,025 ordinary - 15,000 std deduction = 47,025 taxable (fills 0% cap gains bracket)
      incomes.totalIncome = 62025;
      const portfolioData = createEmptyPortfolioData();
      portfolioData.realizedGainsForPeriod = 10000; // All taxed at 15%

      const result = processor.process(portfolioData, incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      // Capital gains start at 47,025 threshold, so 10k at 15%
      expect(result.capitalGainsTaxes.capitalGainsTaxAmount).toBeCloseTo(1500, 2);
    });

    it('should include dividend income in capital gains', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const incomes = createEmptyIncomesData();
      const portfolioData = createEmptyPortfolioData();
      const returnsData = createEmptyReturnsData();
      returnsData.yieldAmountsForPeriod.taxable.stocks = 5000; // Dividends

      const result = processor.process(portfolioData, incomes, returnsData, createEmptyPhysicalAssetsData());

      // Dividends are taxed as capital gains
      expect(result.incomeSources.taxableDividendIncome).toBe(5000);
    });
  });

  // ============================================================================
  // NIIT (Net Investment Income Tax) Tests
  // ============================================================================

  describe('NIIT (Net Investment Income Tax)', () => {
    it('should not apply NIIT when AGI is below threshold', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const incomes = createEmptyIncomesData();
      incomes.totalIncome = 100000;
      const portfolioData = createEmptyPortfolioData();
      portfolioData.realizedGainsForPeriod = 50000;

      const result = processor.process(portfolioData, incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      // AGI of 150k is below single threshold of 200k
      expect(result.niit.niitAmount).toBe(0);
    });

    it('should apply 3.8% NIIT on income above threshold', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const incomes = createEmptyIncomesData();
      incomes.totalIncome = 150000;
      const portfolioData = createEmptyPortfolioData();
      portfolioData.realizedGainsForPeriod = 100000;

      const result = processor.process(portfolioData, incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      // AGI of 250k, threshold 200k, excess of 50k
      // Net investment income = 100k gains
      // NIIT applies to lesser of (NII, excess AGI) = 50k
      expect(result.niit.incomeSubjectToNiit).toBe(50000);
      expect(result.niit.niitAmount).toBeCloseTo(50000 * NIIT_RATE, 2);
    });

    it('should use correct NIIT threshold for married filing jointly', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'marriedFilingJointly');
      const incomes = createEmptyIncomesData();
      incomes.totalIncome = 200000;
      const portfolioData = createEmptyPortfolioData();
      portfolioData.realizedGainsForPeriod = 100000;

      const result = processor.process(portfolioData, incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      // AGI of 300k, threshold 250k for MFJ, excess of 50k
      expect(result.niit.threshold).toBe(NIIT_THRESHOLDS.marriedFilingJointly);
      expect(result.niit.incomeSubjectToNiit).toBe(50000);
    });

    it('should include dividends and interest in net investment income', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const incomes = createEmptyIncomesData();
      incomes.totalIncome = 250000;
      const portfolioData = createEmptyPortfolioData();
      portfolioData.realizedGainsForPeriod = 20000;
      const returnsData = createEmptyReturnsData();
      returnsData.yieldAmountsForPeriod.taxable.stocks = 10000; // Dividends
      returnsData.yieldAmountsForPeriod.taxable.bonds = 5000; // Interest
      returnsData.yieldAmountsForPeriod.cashSavings.cash = 3000; // Cash interest

      const result = processor.process(portfolioData, incomes, returnsData, createEmptyPhysicalAssetsData());

      // NII = 20k gains + 10k dividends + 5k bond interest + 3k cash = 38k
      expect(result.niit.netInvestmentIncome).toBe(38000);
    });
  });

  // ============================================================================
  // Social Security Taxation Tests
  // ============================================================================

  describe('Social Security taxation', () => {
    it('should not tax Social Security when provisional income is below first threshold', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const incomes = createEmptyIncomesData();
      incomes.totalSocialSecurityIncome = 20000;
      // Provisional income = 0 + (20,000 * 0.5) = 10,000, below 25k threshold

      const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      expect(result.socialSecurityTaxes.taxableSocialSecurityIncome).toBe(0);
      expect(result.socialSecurityTaxes.maxTaxablePercentage).toBe(0);
    });

    it('should tax up to 50% when provisional income is in middle tier', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const incomes = createEmptyIncomesData();
      incomes.totalSocialSecurityIncome = 30000;
      incomes.totalIncome = 30000; // Includes SS income
      // With no other income, we need to add some earned income
      // Earned income: 30k - 30k SS = 0
      // Provisional = 0 + 15k (half of SS) = 15k, still below threshold

      // Let's add some other income
      const incomes2 = createEmptyIncomesData();
      incomes2.totalSocialSecurityIncome = 20000;
      incomes2.totalIncome = 40000; // 20k SS + 20k earned
      // Provisional = 20k earned + 10k (half SS) = 30k, in 50% tier (25k-34k)

      const result = processor.process(createEmptyPortfolioData(), incomes2, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      expect(result.socialSecurityTaxes.maxTaxablePercentage).toBe(0.5);
      // Taxable = min((30k - 25k) * 0.5, 20k * 0.5) = min(2.5k, 10k) = 2.5k
      expect(result.socialSecurityTaxes.taxableSocialSecurityIncome).toBeCloseTo(2500, 2);
    });

    it('should tax up to 85% when provisional income is above upper threshold', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const incomes = createEmptyIncomesData();
      incomes.totalSocialSecurityIncome = 30000;
      incomes.totalIncome = 80000; // 30k SS + 50k earned
      // Provisional = 50k earned + 15k (half SS) = 65k, well above 34k threshold

      const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      expect(result.socialSecurityTaxes.maxTaxablePercentage).toBe(0.85);
      // Max taxable = 30k * 0.85 = 25.5k
      expect(result.socialSecurityTaxes.taxableSocialSecurityIncome).toBeCloseTo(25500, 2);
    });

    it('should use married filing jointly thresholds', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'marriedFilingJointly');
      const incomes = createEmptyIncomesData();
      incomes.totalSocialSecurityIncome = 30000;
      incomes.totalIncome = 50000; // 30k SS + 20k earned
      // Provisional = 20k + 15k = 35k, in 50% tier for MFJ (32k-44k)

      const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      expect(result.socialSecurityTaxes.maxTaxablePercentage).toBe(0.5);
    });

    describe('threshold boundary conditions', () => {
      it('single filer: should not tax SS at exactly $25,000 provisional income (Tier 1 boundary)', () => {
        const processor = new TaxProcessor(createMockSimulationState(65), 'single');
        const incomes = createEmptyIncomesData();
        // To get provisional income of exactly $25,000:
        // Provisional = other income + (SS * 0.5)
        // If SS = 20000, other income = 25000 - 10000 = 15000
        incomes.totalSocialSecurityIncome = 20000;
        incomes.totalIncome = 35000; // 20k SS + 15k earned
        // Provisional = 15k + 10k = 25k (exactly at threshold)

        const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

        // At exactly 25k, we're at the boundary - no SS should be taxable yet
        expect(result.socialSecurityTaxes.maxTaxablePercentage).toBe(0);
        expect(result.socialSecurityTaxes.taxableSocialSecurityIncome).toBe(0);
      });

      it('single filer: should tax at 50% just above $25,000 provisional income', () => {
        const processor = new TaxProcessor(createMockSimulationState(65), 'single');
        const incomes = createEmptyIncomesData();
        incomes.totalSocialSecurityIncome = 20000;
        incomes.totalIncome = 35001; // 20k SS + 15001 earned
        // Provisional = 15001 + 10000 = 25001 (just above threshold)

        const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

        expect(result.socialSecurityTaxes.maxTaxablePercentage).toBe(0.5);
        // Taxable = (25001 - 25000) * 0.5 = 0.5
        expect(result.socialSecurityTaxes.taxableSocialSecurityIncome).toBeCloseTo(0.5, 2);
      });

      it('single filer: should tax at 50% at exactly $34,000 provisional income (Tier 2 boundary)', () => {
        const processor = new TaxProcessor(createMockSimulationState(65), 'single');
        const incomes = createEmptyIncomesData();
        // To get provisional income of exactly $34,000:
        // If SS = 20000, other income = 34000 - 10000 = 24000
        incomes.totalSocialSecurityIncome = 20000;
        incomes.totalIncome = 44000; // 20k SS + 24k earned
        // Provisional = 24k + 10k = 34k (exactly at upper threshold)

        const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

        // At exactly 34k, still in 50% tier
        expect(result.socialSecurityTaxes.maxTaxablePercentage).toBe(0.5);
        // Taxable = (34000 - 25000) * 0.5 = 4500
        expect(result.socialSecurityTaxes.taxableSocialSecurityIncome).toBeCloseTo(4500, 2);
      });

      it('single filer: should tax at 85% just above $34,000 provisional income', () => {
        const processor = new TaxProcessor(createMockSimulationState(65), 'single');
        const incomes = createEmptyIncomesData();
        incomes.totalSocialSecurityIncome = 20000;
        incomes.totalIncome = 44001; // 20k SS + 24001 earned
        // Provisional = 24001 + 10000 = 34001 (just above upper threshold)

        const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

        expect(result.socialSecurityTaxes.maxTaxablePercentage).toBe(0.85);
      });

      it('MFJ: should not tax SS at exactly $32,000 provisional income (Tier 1 boundary)', () => {
        const processor = new TaxProcessor(createMockSimulationState(65), 'marriedFilingJointly');
        const incomes = createEmptyIncomesData();
        // To get provisional income of exactly $32,000:
        // If SS = 24000, other income = 32000 - 12000 = 20000
        incomes.totalSocialSecurityIncome = 24000;
        incomes.totalIncome = 44000; // 24k SS + 20k earned
        // Provisional = 20k + 12k = 32k (exactly at threshold)

        const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

        expect(result.socialSecurityTaxes.maxTaxablePercentage).toBe(0);
        expect(result.socialSecurityTaxes.taxableSocialSecurityIncome).toBe(0);
      });

      it('MFJ: should tax at 50% just above $32,000 provisional income', () => {
        const processor = new TaxProcessor(createMockSimulationState(65), 'marriedFilingJointly');
        const incomes = createEmptyIncomesData();
        incomes.totalSocialSecurityIncome = 24000;
        incomes.totalIncome = 44001; // 24k SS + 20001 earned
        // Provisional = 20001 + 12000 = 32001 (just above threshold)

        const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

        expect(result.socialSecurityTaxes.maxTaxablePercentage).toBe(0.5);
      });

      it('MFJ: should tax at 50% at exactly $44,000 provisional income (Tier 2 boundary)', () => {
        const processor = new TaxProcessor(createMockSimulationState(65), 'marriedFilingJointly');
        const incomes = createEmptyIncomesData();
        // To get provisional income of exactly $44,000:
        // If SS = 24000, other income = 44000 - 12000 = 32000
        incomes.totalSocialSecurityIncome = 24000;
        incomes.totalIncome = 56000; // 24k SS + 32k earned
        // Provisional = 32k + 12k = 44k (exactly at upper threshold)

        const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

        // At exactly 44k, still in 50% tier
        expect(result.socialSecurityTaxes.maxTaxablePercentage).toBe(0.5);
      });

      it('MFJ: should tax at 85% just above $44,000 provisional income', () => {
        const processor = new TaxProcessor(createMockSimulationState(65), 'marriedFilingJointly');
        const incomes = createEmptyIncomesData();
        incomes.totalSocialSecurityIncome = 24000;
        incomes.totalIncome = 56001; // 24k SS + 32001 earned
        // Provisional = 32001 + 12000 = 44001 (just above upper threshold)

        const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

        expect(result.socialSecurityTaxes.maxTaxablePercentage).toBe(0.85);
      });
    });
  });

  // ============================================================================
  // Early Withdrawal Penalty Tests
  // ============================================================================

  describe('early withdrawal penalties', () => {
    it('should apply 10% penalty on 401k/IRA withdrawals before age 59.5', () => {
      const processor = new TaxProcessor(createMockSimulationState(50), 'single');
      const portfolioData = createEmptyPortfolioData();
      portfolioData.perAccountData = {
        '401k-1': {
          id: '401k-1',
          name: '401k',
          type: '401k',
          balance: 100000,
          cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
          cumulativeEmployerMatch: 0,
          cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
          cumulativeRealizedGains: 0,
          cumulativeEarningsWithdrawn: 0,
          cumulativeRmds: 0,
          assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
          contributionsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
          employerMatchForPeriod: 0,
          withdrawalsForPeriod: { stocks: 8000, bonds: 2000, cash: 0 },
          realizedGainsForPeriod: 0,
          earningsWithdrawnForPeriod: 0,
          rmdsForPeriod: 0,
        },
      };

      const result = processor.process(portfolioData, createEmptyIncomesData(), createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      // 10k withdrawal * 10% = 1k penalty
      expect(result.earlyWithdrawalPenalties.taxDeferredPenaltyAmount).toBe(1000);
    });

    it('should not apply penalty on 401k/IRA withdrawals at age 59.5+', () => {
      const processor = new TaxProcessor(createMockSimulationState(60), 'single');
      const portfolioData = createEmptyPortfolioData();
      portfolioData.perAccountData = {
        '401k-1': {
          id: '401k-1',
          name: '401k',
          type: '401k',
          balance: 100000,
          cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
          cumulativeEmployerMatch: 0,
          cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
          cumulativeRealizedGains: 0,
          cumulativeEarningsWithdrawn: 0,
          cumulativeRmds: 0,
          assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
          contributionsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
          employerMatchForPeriod: 0,
          withdrawalsForPeriod: { stocks: 8000, bonds: 2000, cash: 0 },
          realizedGainsForPeriod: 0,
          earningsWithdrawnForPeriod: 0,
          rmdsForPeriod: 0,
        },
      };

      const result = processor.process(portfolioData, createEmptyIncomesData(), createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      expect(result.earlyWithdrawalPenalties.taxDeferredPenaltyAmount).toBe(0);
    });

    it('should apply 20% penalty on HSA withdrawals before age 65', () => {
      const processor = new TaxProcessor(createMockSimulationState(60), 'single');
      const portfolioData = createEmptyPortfolioData();
      portfolioData.perAccountData = {
        'hsa-1': {
          id: 'hsa-1',
          name: 'HSA',
          type: 'hsa',
          balance: 50000,
          cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
          cumulativeEmployerMatch: 0,
          cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
          cumulativeRealizedGains: 0,
          cumulativeEarningsWithdrawn: 0,
          cumulativeRmds: 0,
          assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
          contributionsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
          employerMatchForPeriod: 0,
          withdrawalsForPeriod: { stocks: 4000, bonds: 1000, cash: 0 },
          realizedGainsForPeriod: 0,
          earningsWithdrawnForPeriod: 0,
          rmdsForPeriod: 0,
        },
      };

      const result = processor.process(portfolioData, createEmptyIncomesData(), createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      // 5k withdrawal * 20% = 1k penalty
      expect(result.earlyWithdrawalPenalties.taxDeferredPenaltyAmount).toBe(1000);
    });

    it('should apply 10% penalty on Roth earnings (not contributions) before 59.5', () => {
      const processor = new TaxProcessor(createMockSimulationState(50), 'single');
      const portfolioData = createEmptyPortfolioData();
      portfolioData.perAccountData = {
        'roth-1': {
          id: 'roth-1',
          name: 'Roth IRA',
          type: 'rothIra',
          balance: 50000,
          cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
          cumulativeEmployerMatch: 0,
          cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
          cumulativeRealizedGains: 0,
          cumulativeEarningsWithdrawn: 0,
          cumulativeRmds: 0,
          assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
          contributionsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
          employerMatchForPeriod: 0,
          withdrawalsForPeriod: { stocks: 8000, bonds: 2000, cash: 0 },
          realizedGainsForPeriod: 0,
          earningsWithdrawnForPeriod: 3000, // Only earnings get penalized
          rmdsForPeriod: 0,
        },
      };

      const result = processor.process(portfolioData, createEmptyIncomesData(), createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      // Only 3k earnings * 10% = 300 penalty (contributions are not penalized)
      expect(result.earlyWithdrawalPenalties.taxFreePenaltyAmount).toBe(300);
    });
  });

  // ============================================================================
  // Capital Loss Carryover Tests
  // ============================================================================

  describe('capital loss carryover', () => {
    it('should limit capital loss deduction to $3,000 per year', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const portfolioData = createEmptyPortfolioData();
      portfolioData.realizedGainsForPeriod = -10000; // 10k loss

      const result = processor.process(portfolioData, createEmptyIncomesData(), createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      expect(result.incomeTaxes.capitalLossDeduction).toBe(3000);
    });

    it('should carry over losses to subsequent years', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const portfolioData = createEmptyPortfolioData();
      const incomes = createEmptyIncomesData();
      incomes.totalIncome = 50000;

      // Year 1: 10k loss, deduct 3k, carry over 7k
      portfolioData.realizedGainsForPeriod = -10000;
      const result1 = processor.process(portfolioData, incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());
      expect(result1.incomeTaxes.capitalLossDeduction).toBe(3000);

      // Year 2: No new gains/losses, deduct 3k from carryover, 4k remaining
      portfolioData.realizedGainsForPeriod = 0;
      const result2 = processor.process(portfolioData, incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());
      expect(result2.incomeTaxes.capitalLossDeduction).toBe(3000);

      // Year 3: No new gains/losses, deduct 3k from carryover, 1k remaining
      const result3 = processor.process(portfolioData, incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());
      expect(result3.incomeTaxes.capitalLossDeduction).toBe(3000);

      // Year 4: No new gains/losses, deduct remaining 1k
      const result4 = processor.process(portfolioData, incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());
      expect(result4.incomeTaxes.capitalLossDeduction).toBe(1000);
    });

    it('should offset gains with losses before applying carryover', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const portfolioData = createEmptyPortfolioData();
      const incomes = createEmptyIncomesData();
      incomes.totalIncome = 50000;

      // Year 1: 10k loss
      portfolioData.realizedGainsForPeriod = -10000;
      processor.process(portfolioData, incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      // Year 2: 5k gain, should offset with 5k carryover, leaving 2k carryover
      // Then deduct remaining from ordinary income (but there's only 2k left)
      portfolioData.realizedGainsForPeriod = 5000;
      const result2 = processor.process(portfolioData, incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());
      // Carryover was 7k after year 1
      // 5k gain offsets 5k of carryover, leaving 2k
      // 2k loss deduction from carryover
      expect(result2.incomeSources.realizedGains).toBe(0);
      expect(result2.incomeTaxes.capitalLossDeduction).toBe(2000);
    });
  });

  // ============================================================================
  // Tax-Deductible Contributions Tests
  // ============================================================================

  describe('tax-deductible contributions', () => {
    it('should reduce taxable income by 401k contributions', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const incomes = createEmptyIncomesData();
      incomes.totalIncome = 100000;
      const portfolioData = createEmptyPortfolioData();
      portfolioData.perAccountData = {
        '401k-1': {
          id: '401k-1',
          name: '401k',
          type: '401k',
          balance: 100000,
          cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
          cumulativeEmployerMatch: 0,
          cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
          cumulativeRealizedGains: 0,
          cumulativeEarningsWithdrawn: 0,
          cumulativeRmds: 0,
          assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
          contributionsForPeriod: { stocks: 16000, bonds: 4000, cash: 0 }, // 20k total
          employerMatchForPeriod: 5000, // Employer match not deductible
          withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
          realizedGainsForPeriod: 0,
          earningsWithdrawnForPeriod: 0,
          rmdsForPeriod: 0,
        },
      };

      const result = processor.process(portfolioData, incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      // 20k contributions - 5k employer match = 15k deductible
      expect(result.adjustments.taxDeductibleContributions).toBe(15000);
      // 100k - 15k deduction - 15k std deduction = 70k taxable
      expect(result.incomeTaxes.taxableIncomeTaxedAsOrdinary).toBe(70000);
    });

    it('should include IRA and HSA contributions as deductible', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const incomes = createEmptyIncomesData();
      incomes.totalIncome = 100000;
      const portfolioData = createEmptyPortfolioData();
      portfolioData.perAccountData = {
        'ira-1': {
          id: 'ira-1',
          name: 'IRA',
          type: 'ira',
          balance: 50000,
          cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
          cumulativeEmployerMatch: 0,
          cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
          cumulativeRealizedGains: 0,
          cumulativeEarningsWithdrawn: 0,
          cumulativeRmds: 0,
          assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
          contributionsForPeriod: { stocks: 5600, bonds: 1400, cash: 0 }, // 7k IRA
          employerMatchForPeriod: 0,
          withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
          realizedGainsForPeriod: 0,
          earningsWithdrawnForPeriod: 0,
          rmdsForPeriod: 0,
        },
        'hsa-1': {
          id: 'hsa-1',
          name: 'HSA',
          type: 'hsa',
          balance: 20000,
          cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
          cumulativeEmployerMatch: 0,
          cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
          cumulativeRealizedGains: 0,
          cumulativeEarningsWithdrawn: 0,
          cumulativeRmds: 0,
          assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
          contributionsForPeriod: { stocks: 3200, bonds: 800, cash: 0 }, // 4k HSA
          employerMatchForPeriod: 0,
          withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
          realizedGainsForPeriod: 0,
          earningsWithdrawnForPeriod: 0,
          rmdsForPeriod: 0,
        },
      };

      const result = processor.process(portfolioData, incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      // 7k IRA + 4k HSA = 11k deductible
      expect(result.adjustments.taxDeductibleContributions).toBe(11000);
    });

    it('should NOT include Roth contributions as deductible', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const incomes = createEmptyIncomesData();
      incomes.totalIncome = 100000;
      const portfolioData = createEmptyPortfolioData();
      portfolioData.perAccountData = {
        'roth-1': {
          id: 'roth-1',
          name: 'Roth IRA',
          type: 'rothIra',
          balance: 50000,
          cumulativeContributions: { stocks: 0, bonds: 0, cash: 0 },
          cumulativeEmployerMatch: 0,
          cumulativeWithdrawals: { stocks: 0, bonds: 0, cash: 0 },
          cumulativeRealizedGains: 0,
          cumulativeEarningsWithdrawn: 0,
          cumulativeRmds: 0,
          assetAllocation: { stocks: 0.8, bonds: 0.2, cash: 0 },
          contributionsForPeriod: { stocks: 5600, bonds: 1400, cash: 0 }, // 7k
          employerMatchForPeriod: 0,
          withdrawalsForPeriod: { stocks: 0, bonds: 0, cash: 0 },
          realizedGainsForPeriod: 0,
          earningsWithdrawnForPeriod: 0,
          rmdsForPeriod: 0,
        },
      };

      const result = processor.process(portfolioData, incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      // Roth contributions are not deductible
      expect(result.adjustments.taxDeductibleContributions).toBe(0);
    });
  });

  // ============================================================================
  // Tax Refund / Due Calculations
  // ============================================================================

  describe('tax refund and due calculations', () => {
    it('should calculate refund when withholding exceeds tax liability', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const incomes = createEmptyIncomesData();
      incomes.totalIncome = 50000;
      incomes.totalAmountWithheld = 10000; // Over-withheld

      const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      // Tax on 35k taxable: 11,925 * 10% + 23,075 * 12% = 1,192.5 + 2,769 = 3,961.5
      expect(result.totalTaxesRefund).toBeGreaterThan(0);
      expect(result.totalTaxesDue).toBe(0);
    });

    it('should calculate amount due when tax liability exceeds withholding', () => {
      const processor = new TaxProcessor(createMockSimulationState(65), 'single');
      const incomes = createEmptyIncomesData();
      incomes.totalIncome = 100000;
      incomes.totalAmountWithheld = 5000; // Under-withheld

      const result = processor.process(createEmptyPortfolioData(), incomes, createEmptyReturnsData(), createEmptyPhysicalAssetsData());

      expect(result.totalTaxesDue).toBeGreaterThan(0);
      expect(result.totalTaxesRefund).toBe(0);
    });
  });
});
