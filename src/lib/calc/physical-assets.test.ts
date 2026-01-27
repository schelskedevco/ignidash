import { describe, it, expect } from 'vitest';

import type { PhysicalAssetInputs } from '@/lib/schemas/inputs/physical-asset-schema';

import { PhysicalAsset, PhysicalAssets, PhysicalAssetsProcessor } from './physical-assets';
import type { SimulationState } from './simulation-engine';

/**
 * Physical Assets Tests
 *
 * Tests for:
 * - Appreciation (compound growth, depreciation)
 * - Loan payments (amortized, zero APR, interest/principal split)
 * - Sale mechanics (proceeds, capital gains, underwater sales)
 * - Activation/scheduling (timeframe handling)
 * - Collection operations (filtering, aggregation)
 * - Processor operations (process, liquidate, annual data)
 */

// ============================================================================
// Helper Functions
// ============================================================================

const createSimulationState = (overrides: Partial<SimulationState> = {}): SimulationState => ({
  time: {
    age: 35,
    year: 2024,
    month: 1,
    date: new Date(2024, 0, 1),
    ...overrides.time,
  },
  phase: overrides.phase !== undefined ? overrides.phase : { name: 'accumulation' },
  portfolio: {} as SimulationState['portfolio'],
  annualData: { expenses: [] },
});

const createPhysicalAssetInput = (overrides: Partial<PhysicalAssetInputs> = {}): PhysicalAssetInputs => ({
  id: overrides.id ?? 'asset-1',
  name: overrides.name ?? 'Primary Residence',
  purchaseDate: overrides.purchaseDate ?? { type: 'now' },
  purchasePrice: overrides.purchasePrice ?? 400000,
  marketValue: overrides.marketValue,
  annualAppreciationRate: overrides.annualAppreciationRate ?? 3,
  saleDate: overrides.saleDate,
  financing: overrides.financing,
});

const createFinancedAssetInput = (overrides: Partial<PhysicalAssetInputs> = {}): PhysicalAssetInputs => {
  const purchasePrice = overrides.purchasePrice ?? 400000;
  const downPayment = overrides.financing?.downPayment ?? 80000;
  const loanAmount = overrides.financing?.loanAmount ?? purchasePrice - downPayment;

  return {
    id: overrides.id ?? 'asset-1',
    name: overrides.name ?? 'Primary Residence',
    purchaseDate: overrides.purchaseDate ?? { type: 'now' },
    purchasePrice,
    marketValue: overrides.marketValue,
    annualAppreciationRate: overrides.annualAppreciationRate ?? 3,
    saleDate: overrides.saleDate,
    financing: {
      downPayment,
      loanAmount,
      apr: overrides.financing?.apr ?? 6,
      termMonths: overrides.financing?.termMonths ?? 360,
    },
  };
};

// ============================================================================
// PhysicalAsset Class Tests
// ============================================================================

describe('PhysicalAsset Class', () => {
  describe('Appreciation Tests', () => {
    it('applies monthly appreciation (compound growth)', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchasePrice: 400000,
          annualAppreciationRate: 3, // 3% annual
        })
      );

      // Formula: monthlyRate = (1 + annualRate)^(1/12) - 1
      const expectedMonthlyRate = Math.pow(1 + 0.03, 1 / 12) - 1;
      const expectedAppreciation = 400000 * expectedMonthlyRate;

      const { monthlyAppreciation } = asset.applyMonthlyAppreciation();

      expect(monthlyAppreciation).toBeCloseTo(expectedAppreciation);
      expect(asset.getMarketValue()).toBeCloseTo(400000 + expectedAppreciation);
    });

    it('compounds appreciation over multiple months', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchasePrice: 400000,
          annualAppreciationRate: 3,
        })
      );

      // Apply 12 months of appreciation
      for (let i = 0; i < 12; i++) {
        asset.applyMonthlyAppreciation();
      }

      // After 12 months at 3% annual, should be approximately 400000 * 1.03
      expect(asset.getMarketValue()).toBeCloseTo(400000 * 1.03, 0);
    });

    it('handles zero appreciation rate', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchasePrice: 300000,
          annualAppreciationRate: 0,
        })
      );

      const { monthlyAppreciation } = asset.applyMonthlyAppreciation();

      expect(monthlyAppreciation).toBe(0);
      expect(asset.getMarketValue()).toBe(300000);
    });

    it('handles negative appreciation (depreciation)', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchasePrice: 50000, // Car
          annualAppreciationRate: -15, // 15% depreciation
        })
      );

      const expectedMonthlyRate = Math.pow(1 - 0.15, 1 / 12) - 1;
      const expectedDepreciation = 50000 * expectedMonthlyRate;

      const { monthlyAppreciation } = asset.applyMonthlyAppreciation();

      expect(monthlyAppreciation).toBeCloseTo(expectedDepreciation);
      expect(monthlyAppreciation).toBeLessThan(0);
      expect(asset.getMarketValue()).toBeLessThan(50000);
    });

    it('sold asset throws on applyMonthlyAppreciation', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchasePrice: 400000,
          annualAppreciationRate: 3,
        })
      );

      asset.sell();

      expect(() => asset.applyMonthlyAppreciation()).toThrow('Asset is not owned');
      expect(asset.getMarketValue()).toBe(0);
    });
  });

  describe('Loan Payment Tests', () => {
    it('calculates amortized payment correctly', () => {
      const asset = new PhysicalAsset(
        createFinancedAssetInput({
          purchasePrice: 400000,
          financing: {
            downPayment: 80000,
            loanAmount: 320000,
            apr: 6,
            termMonths: 360,
          },
        })
      );

      // Formula: P * r * (1+r)^n / ((1+r)^n - 1)
      const monthlyRate = 0.06 / 12;
      const numPayments = 360;
      const expectedPayment =
        (320000 * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

      const { monthlyLoanPayment } = asset.getMonthlyLoanPayment();

      expect(monthlyLoanPayment).toBeCloseTo(expectedPayment, 2);
    });

    it('handles zero APR loan', () => {
      const asset = new PhysicalAsset(
        createFinancedAssetInput({
          purchasePrice: 30000,
          financing: {
            downPayment: 6000,
            loanAmount: 24000,
            apr: 0,
            termMonths: 48,
          },
        })
      );

      // Zero APR: payment = loanAmount / termMonths
      const expectedPayment = 24000 / 48;
      const { monthlyLoanPayment } = asset.getMonthlyLoanPayment();

      expect(monthlyLoanPayment).toBeCloseTo(expectedPayment);
    });

    it('applies payment (interest vs principal split)', () => {
      const asset = new PhysicalAsset(
        createFinancedAssetInput({
          purchasePrice: 400000,
          financing: {
            downPayment: 80000,
            loanAmount: 320000,
            apr: 6,
            termMonths: 360,
          },
        })
      );

      const initialBalance = asset.getLoanBalance();
      const { monthlyLoanPayment } = asset.getMonthlyLoanPayment();
      const interest = initialBalance * (0.06 / 12); // Monthly interest
      const principal = monthlyLoanPayment - interest;

      asset.applyLoanPayment(monthlyLoanPayment);

      expect(asset.getLoanBalance()).toBeCloseTo(initialBalance - principal);
    });

    it('final payment handles payoff', () => {
      const asset = new PhysicalAsset(
        createFinancedAssetInput({
          purchasePrice: 10000,
          financing: {
            downPayment: 0,
            loanAmount: 10000,
            apr: 0,
            termMonths: 10,
          },
        })
      );

      // Apply 10 payments to pay off the loan
      for (let i = 0; i < 10; i++) {
        const { monthlyLoanPayment } = asset.getMonthlyLoanPayment();
        asset.applyLoanPayment(monthlyLoanPayment);
      }

      expect(asset.getLoanBalance()).toBe(0);
      expect(asset.getMonthlyLoanPayment()).toEqual({ monthlyLoanPayment: 0 });
    });

    it('no payment for cash purchase', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchasePrice: 400000,
          financing: undefined, // Cash purchase
        })
      );

      expect(asset.getMonthlyLoanPayment()).toEqual({ monthlyLoanPayment: 0 });
      expect(asset.getLoanBalance()).toBe(0);
    });
  });

  describe('Sale Tests', () => {
    it('sale proceeds = market value - loan balance', () => {
      const asset = new PhysicalAsset(
        createFinancedAssetInput({
          purchasePrice: 400000,
          financing: {
            downPayment: 80000,
            loanAmount: 320000,
            apr: 6,
            termMonths: 360,
          },
        })
      );

      // Apply some appreciation
      for (let i = 0; i < 24; i++) {
        asset.applyMonthlyAppreciation();
        const { monthlyLoanPayment } = asset.getMonthlyLoanPayment();
        asset.applyLoanPayment(monthlyLoanPayment);
      }

      const marketValueBeforeSale = asset.getMarketValue();
      const loanBalanceBeforeSale = asset.getLoanBalance();

      const { saleProceeds } = asset.sell();

      expect(saleProceeds).toBeCloseTo(marketValueBeforeSale - loanBalanceBeforeSale);
    });

    it('capital gain = market value - cost basis', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchasePrice: 300000,
          annualAppreciationRate: 5,
        })
      );

      // Apply 60 months (5 years) of appreciation
      for (let i = 0; i < 60; i++) {
        asset.applyMonthlyAppreciation();
      }

      const marketValueBeforeSale = asset.getMarketValue();
      const { capitalGain } = asset.sell();

      // Cost basis is original purchase price
      expect(capitalGain).toBeCloseTo(marketValueBeforeSale - 300000);
    });

    it('handles underwater sale (loan > value)', () => {
      const asset = new PhysicalAsset(
        createFinancedAssetInput({
          purchasePrice: 400000,
          annualAppreciationRate: -20, // Major depreciation
          financing: {
            downPayment: 20000,
            loanAmount: 380000, // High LTV
            apr: 6,
            termMonths: 360,
          },
        })
      );

      // Apply depreciation
      for (let i = 0; i < 12; i++) {
        asset.applyMonthlyAppreciation();
      }

      const marketValueBeforeSale = asset.getMarketValue();
      const loanBalanceBeforeSale = asset.getLoanBalance();
      const { saleProceeds, capitalGain } = asset.sell();

      // Proceeds can be negative when underwater (seller owes money)
      expect(saleProceeds).toBe(marketValueBeforeSale - loanBalanceBeforeSale);
      expect(saleProceeds).toBeLessThan(0);
      // Capital gain will be negative (loss)
      expect(capitalGain).toBeLessThan(0);
    });

    it('already sold throws error', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchasePrice: 400000,
        })
      );

      // First sale
      asset.sell();

      // Second sale attempt throws
      expect(() => asset.sell()).toThrow('Asset is not owned');
    });
  });

  describe('Ownership Status Tests', () => {
    it('now - owned immediately', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchaseDate: { type: 'now' },
        })
      );

      expect(asset.getOwnershipStatus()).toBe('owned');
    });

    it('customAge - pending until purchased', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchaseDate: { type: 'customAge', age: 40 },
        })
      );

      // Before age 40 - pending
      let simState = createSimulationState({ time: { age: 39, year: 2028, month: 1, date: new Date(2028, 0, 1) } });
      expect(asset.getOwnershipStatus()).toBe('pending');

      // At age 40 - still pending until purchased
      simState = createSimulationState({ time: { age: 40, year: 2029, month: 1, date: new Date(2029, 0, 1) } });
      expect(asset.getOwnershipStatus()).toBe('pending');
      expect(asset.shouldPurchaseThisPeriod(simState)).toBe(true);

      // After purchasing, asset becomes owned
      asset.purchase();
      expect(asset.getOwnershipStatus()).toBe('owned');
    });

    it('customDate - pending until purchased', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchaseDate: { type: 'customDate', year: 2025, month: 6 },
        })
      );

      // Before June 2025 - pending
      let simState = createSimulationState({ time: { age: 36, year: 2025, month: 5, date: new Date(2025, 4, 1) } });
      expect(asset.getOwnershipStatus()).toBe('pending');
      expect(asset.shouldPurchaseThisPeriod(simState)).toBe(false);

      // At June 2025 - still pending until purchased
      simState = createSimulationState({ time: { age: 36, year: 2025, month: 6, date: new Date(2025, 5, 1) } });
      expect(asset.getOwnershipStatus()).toBe('pending');
      expect(asset.shouldPurchaseThisPeriod(simState)).toBe(true);

      // After purchasing, asset becomes owned
      asset.purchase();
      expect(asset.getOwnershipStatus()).toBe('owned');
    });

    it('atRetirement - pending until purchased', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchaseDate: { type: 'atRetirement' },
        })
      );

      // Pre-retirement - pending
      let simState = createSimulationState({ phase: { name: 'accumulation' } });
      expect(asset.getOwnershipStatus()).toBe('pending');
      expect(asset.shouldPurchaseThisPeriod(simState)).toBe(false);

      // In retirement - still pending until purchased
      simState = createSimulationState({ phase: { name: 'retirement' } });
      expect(asset.getOwnershipStatus()).toBe('pending');
      expect(asset.shouldPurchaseThisPeriod(simState)).toBe(true);

      // After purchasing, asset becomes owned
      asset.purchase();
      expect(asset.getOwnershipStatus()).toBe('owned');
    });

    it('sold asset has sold status', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchaseDate: { type: 'now' },
        })
      );

      asset.sell();

      expect(asset.getOwnershipStatus()).toBe('sold');
    });
  });

  describe('Scheduled Sale Tests (shouldSellThisPeriod)', () => {
    it('no saleDate - never scheduled', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          saleDate: undefined,
        })
      );

      const simState = createSimulationState({ time: { age: 90, year: 2079, month: 1, date: new Date(2079, 0, 1) } });
      expect(asset.shouldSellThisPeriod(simState)).toBe(false);
    });

    it('customAge - scheduled at age', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          saleDate: { type: 'customAge', age: 65 },
        })
      );

      // Before age 65
      let simState = createSimulationState({ time: { age: 64, year: 2053, month: 12, date: new Date(2053, 11, 1) } });
      expect(asset.shouldSellThisPeriod(simState)).toBe(false);

      // At age 65
      simState = createSimulationState({ time: { age: 65, year: 2054, month: 1, date: new Date(2054, 0, 1) } });
      expect(asset.shouldSellThisPeriod(simState)).toBe(true);
    });

    it('customDate - scheduled at date', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          saleDate: { type: 'customDate', year: 2030, month: 12 },
        })
      );

      // Before December 2030
      let simState = createSimulationState({ time: { age: 41, year: 2030, month: 11, date: new Date(2030, 10, 1) } });
      expect(asset.shouldSellThisPeriod(simState)).toBe(false);

      // At December 2030
      simState = createSimulationState({ time: { age: 41, year: 2030, month: 12, date: new Date(2030, 11, 1) } });
      expect(asset.shouldSellThisPeriod(simState)).toBe(true);
    });

    it('already sold - not scheduled', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          saleDate: { type: 'customAge', age: 65 },
        })
      );

      asset.sell();

      const simState = createSimulationState({ time: { age: 65, year: 2054, month: 1, date: new Date(2054, 0, 1) } });
      expect(asset.shouldSellThisPeriod(simState)).toBe(false);
    });
  });

  describe('Equity Calculation', () => {
    it('equity = market value - loan balance for financed asset', () => {
      const asset = new PhysicalAsset(
        createFinancedAssetInput({
          purchasePrice: 400000,
          financing: {
            downPayment: 80000,
            loanAmount: 320000,
            apr: 6,
            termMonths: 360,
          },
        })
      );

      // Initial equity should be the down payment
      expect(asset.getEquity()).toBeCloseTo(80000, 0);
    });

    it('equity = market value for cash purchase', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchasePrice: 400000,
          financing: undefined,
        })
      );

      expect(asset.getEquity()).toBe(400000);
    });

    it('equity cannot be negative', () => {
      const asset = new PhysicalAsset(
        createFinancedAssetInput({
          purchasePrice: 100000,
          annualAppreciationRate: -50, // Extreme depreciation
          financing: {
            downPayment: 5000,
            loanAmount: 95000,
            apr: 6,
            termMonths: 360,
          },
        })
      );

      // Apply heavy depreciation
      for (let i = 0; i < 12; i++) {
        asset.applyMonthlyAppreciation();
      }

      // Equity should be floored at 0
      expect(asset.getEquity()).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// PhysicalAssets Collection Tests
// ============================================================================

describe('PhysicalAssets Collection', () => {
  it('getOwnedAssets returns only currently owned assets', () => {
    const assets = new PhysicalAssets([
      createPhysicalAssetInput({
        id: 'current',
        name: 'Current Home',
        purchaseDate: { type: 'now' },
      }),
      createPhysicalAssetInput({
        id: 'future',
        name: 'Future Home',
        purchaseDate: { type: 'customAge', age: 50 },
      }),
    ]);

    const ownedAssets = assets.getOwnedAssets();

    expect(ownedAssets.length).toBe(1);
    expect(ownedAssets[0].getName()).toBe('Current Home');
  });

  it('getAssetsToSellThisPeriod returns only assets scheduled for sale', () => {
    const assets = new PhysicalAssets([
      createPhysicalAssetInput({
        id: 'sell-now',
        name: 'Sell Now',
        saleDate: { type: 'customAge', age: 35 },
      }),
      createPhysicalAssetInput({
        id: 'keep',
        name: 'Keep Forever',
        saleDate: undefined,
      }),
    ]);

    const simState = createSimulationState({ time: { age: 35, year: 2024, month: 1, date: new Date(2024, 0, 1) } });
    const assetsToSell = assets.getAssetsToSellThisPeriod(simState);

    expect(assetsToSell.length).toBe(1);
    expect(assetsToSell[0].getName()).toBe('Sell Now');
  });

  it('aggregates total value/loan/equity', () => {
    const assets = new PhysicalAssets([
      createFinancedAssetInput({
        id: 'house1',
        purchasePrice: 400000,
        financing: { downPayment: 80000, loanAmount: 320000, apr: 6, termMonths: 360 },
      }),
      createPhysicalAssetInput({
        id: 'car',
        purchasePrice: 50000,
      }),
    ]);

    expect(assets.getTotalMarketValue()).toBe(450000);
    expect(assets.getTotalLoanBalance()).toBe(320000);
    expect(assets.getTotalEquity()).toBeCloseTo(130000, 0);
  });
});

// ============================================================================
// PhysicalAssetsProcessor Tests
// ============================================================================

describe('PhysicalAssetsProcessor', () => {
  it('process() applies appreciation and loan payments', () => {
    const assets = new PhysicalAssets([
      createFinancedAssetInput({
        id: 'house',
        purchasePrice: 400000,
        annualAppreciationRate: 3,
        financing: { downPayment: 80000, loanAmount: 320000, apr: 6, termMonths: 360 },
      }),
    ]);

    const simState = createSimulationState();
    const processor = new PhysicalAssetsProcessor(simState, assets);

    const result = processor.process();

    expect(result.totalAppreciationForPeriod).toBeGreaterThan(0);
    expect(result.totalLoanPaymentForPeriod).toBeGreaterThan(0);
    expect(result.perAssetData['house']).toBeDefined();
  });

  it('process() handles scheduled sales', () => {
    const assets = new PhysicalAssets([
      createPhysicalAssetInput({
        id: 'selling',
        name: 'Selling House',
        purchasePrice: 500000,
        annualAppreciationRate: 0, // No appreciation for predictable test
        saleDate: { type: 'customAge', age: 35 },
      }),
    ]);

    const simState = createSimulationState({ time: { age: 35, year: 2024, month: 1, date: new Date(2024, 0, 1) } });
    const processor = new PhysicalAssetsProcessor(simState, assets);

    const result = processor.process();

    expect(result.totalSaleProceedsForPeriod).toBe(500000);
    expect(result.totalCapitalGainForPeriod).toBe(0); // No appreciation
    expect(result.perAssetData['selling'].isSold).toBe(true);
  });

  it('getAnnualData aggregates monthly data', () => {
    const assets = new PhysicalAssets([
      createFinancedAssetInput({
        id: 'house',
        purchasePrice: 400000,
        annualAppreciationRate: 3,
        financing: { downPayment: 80000, loanAmount: 320000, apr: 6, termMonths: 360 },
      }),
    ]);

    const simState = createSimulationState();
    const processor = new PhysicalAssetsProcessor(simState, assets);

    // Process 12 months
    for (let i = 0; i < 12; i++) {
      processor.process();
    }

    const annualData = processor.getAnnualData();

    // Annual appreciation should be approximately 3% of starting value
    expect(annualData.totalAppreciationForPeriod).toBeCloseTo(400000 * 0.03, -2);
    // Should have 12 months of loan payments
    expect(annualData.totalLoanPaymentForPeriod).toBeGreaterThan(0);
  });

  it('resetMonthlyData clears accumulated data', () => {
    const assets = new PhysicalAssets([
      createPhysicalAssetInput({
        id: 'house',
        purchasePrice: 400000,
        annualAppreciationRate: 3,
      }),
    ]);

    const simState = createSimulationState();
    const processor = new PhysicalAssetsProcessor(simState, assets);

    // Process some months
    processor.process();
    processor.process();
    processor.process();

    let annualData = processor.getAnnualData();
    expect(annualData.totalAppreciationForPeriod).toBeGreaterThan(0);

    // Reset
    processor.resetMonthlyData();

    annualData = processor.getAnnualData();
    expect(annualData.totalAppreciationForPeriod).toBe(0);
  });
});

// ============================================================================
// Purchase Expense Tracking Tests
// ============================================================================

describe('Purchase Expense Tracking', () => {
  describe('Ownership Status', () => {
    it('constructor sets owned status for purchaseDate.type === now', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchaseDate: { type: 'now' },
        })
      );

      expect(asset.getOwnershipStatus()).toBe('owned');
    });

    it('constructor sets pending status for future purchase dates', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchaseDate: { type: 'customAge', age: 40 },
        })
      );

      expect(asset.getOwnershipStatus()).toBe('pending');
    });

    it('constructor sets pending status for atRetirement purchase', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchaseDate: { type: 'atRetirement' },
        })
      );

      expect(asset.getOwnershipStatus()).toBe('pending');
    });

    it('sell() transitions owned to sold', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchaseDate: { type: 'now' },
        })
      );

      expect(asset.getOwnershipStatus()).toBe('owned');
      asset.sell();
      expect(asset.getOwnershipStatus()).toBe('sold');
    });
  });

  describe('PhysicalAsset purchase methods', () => {
    it('purchase() returns full purchase price for cash purchase', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchaseDate: { type: 'customAge', age: 40 },
          purchasePrice: 400000,
          financing: undefined,
        })
      );

      expect(asset.getOwnershipStatus()).toBe('pending');
      const { purchaseExpense } = asset.purchase();

      expect(purchaseExpense).toBe(400000);
      expect(asset.getOwnershipStatus()).toBe('owned');
    });

    it('purchase() returns down payment for financed purchase', () => {
      const asset = new PhysicalAsset(
        createFinancedAssetInput({
          purchaseDate: { type: 'customAge', age: 40 },
          purchasePrice: 400000,
          financing: {
            downPayment: 80000,
            loanAmount: 320000,
            apr: 6,
            termMonths: 360,
          },
        })
      );

      const { purchaseExpense } = asset.purchase();

      expect(purchaseExpense).toBe(80000);
      expect(asset.getOwnershipStatus()).toBe('owned');
    });

    it('purchase() returns 0 for zero down payment (100% financed)', () => {
      const asset = new PhysicalAsset(
        createFinancedAssetInput({
          purchaseDate: { type: 'customAge', age: 40 },
          purchasePrice: 400000,
          financing: {
            downPayment: 0,
            loanAmount: 400000,
            apr: 6,
            termMonths: 360,
          },
        })
      );

      const { purchaseExpense } = asset.purchase();

      expect(purchaseExpense).toBe(0);
      expect(asset.getOwnershipStatus()).toBe('owned');
    });

    it('purchase() throws for already owned asset', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchaseDate: { type: 'now' },
          purchasePrice: 400000,
        })
      );

      // Already owned from constructor
      expect(asset.getOwnershipStatus()).toBe('owned');
      expect(() => asset.purchase()).toThrow('Asset is not pending');
    });

    it('purchase() throws on second call', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchaseDate: { type: 'customAge', age: 40 },
          purchasePrice: 400000,
        })
      );

      const { purchaseExpense } = asset.purchase();
      expect(purchaseExpense).toBe(400000);

      // Second purchase throws
      expect(() => asset.purchase()).toThrow('Asset is not pending');
    });

    it('shouldPurchaseThisPeriod returns true for pending asset at purchase date', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchaseDate: { type: 'customAge', age: 40 },
        })
      );

      const simStateBefore = createSimulationState({ time: { age: 39, year: 2028, month: 1, date: new Date(2028, 0, 1) } });
      expect(asset.shouldPurchaseThisPeriod(simStateBefore)).toBe(false);

      const simStateAt = createSimulationState({ time: { age: 40, year: 2029, month: 1, date: new Date(2029, 0, 1) } });
      expect(asset.shouldPurchaseThisPeriod(simStateAt)).toBe(true);

      // After purchase, should return false
      asset.purchase();
      expect(asset.shouldPurchaseThisPeriod(simStateAt)).toBe(false);
    });

    it('shouldPurchaseThisPeriod returns false for already owned asset', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchaseDate: { type: 'now' },
        })
      );

      const simState = createSimulationState();
      expect(asset.shouldPurchaseThisPeriod(simState)).toBe(false);
    });

    it('shouldPurchaseThisPeriod returns false for sold asset', () => {
      const asset = new PhysicalAsset(
        createPhysicalAssetInput({
          purchaseDate: { type: 'customAge', age: 40 },
        })
      );

      // Purchase then sell
      asset.purchase();
      asset.sell();

      const simState = createSimulationState({ time: { age: 40, year: 2029, month: 1, date: new Date(2029, 0, 1) } });
      expect(asset.shouldPurchaseThisPeriod(simState)).toBe(false);
    });
  });

  describe('PhysicalAssetsProcessor purchase expense tracking', () => {
    it('assets already active at sim start have no purchase expense', () => {
      const assets = new PhysicalAssets([
        createPhysicalAssetInput({
          id: 'existing-house',
          name: 'Existing House',
          purchaseDate: { type: 'now' }, // Already owned
          purchasePrice: 400000,
        }),
      ]);

      const simState = createSimulationState();
      const processor = new PhysicalAssetsProcessor(simState, assets);

      const result = processor.process();

      expect(result.totalPurchaseExpenseForPeriod).toBe(0);
      expect(result.perAssetData['existing-house'].purchaseExpenseForPeriod).toBe(0);
    });

    it('future cash purchase charges full purchase price when date arrives', () => {
      const assets = new PhysicalAssets([
        createPhysicalAssetInput({
          id: 'future-house',
          name: 'Future House',
          purchaseDate: { type: 'customAge', age: 40 },
          purchasePrice: 500000,
          financing: undefined, // Cash purchase
        }),
      ]);

      // Before purchase age
      const simStateBefore = createSimulationState({ time: { age: 39, year: 2028, month: 1, date: new Date(2028, 0, 1) } });
      const processorBefore = new PhysicalAssetsProcessor(simStateBefore, assets);
      const resultBefore = processorBefore.process();
      expect(resultBefore.totalPurchaseExpenseForPeriod).toBe(0);

      // At purchase age - need new processor since assets state changed
      const assets2 = new PhysicalAssets([
        createPhysicalAssetInput({
          id: 'future-house',
          name: 'Future House',
          purchaseDate: { type: 'customAge', age: 40 },
          purchasePrice: 500000,
          financing: undefined,
        }),
      ]);
      const simStateAt = createSimulationState({ time: { age: 40, year: 2029, month: 1, date: new Date(2029, 0, 1) } });
      const processorAt = new PhysicalAssetsProcessor(simStateAt, assets2);
      const resultAt = processorAt.process();

      expect(resultAt.totalPurchaseExpenseForPeriod).toBe(500000);
      expect(resultAt.perAssetData['future-house'].purchaseExpenseForPeriod).toBe(500000);
    });

    it('future financed purchase charges only down payment when date arrives', () => {
      const assets = new PhysicalAssets([
        createFinancedAssetInput({
          id: 'future-house',
          name: 'Future House',
          purchaseDate: { type: 'customAge', age: 40 },
          purchasePrice: 400000,
          financing: {
            downPayment: 80000,
            loanAmount: 320000,
            apr: 6,
            termMonths: 360,
          },
        }),
      ]);

      const simState = createSimulationState({ time: { age: 40, year: 2029, month: 1, date: new Date(2029, 0, 1) } });
      const processor = new PhysicalAssetsProcessor(simState, assets);
      const result = processor.process();

      expect(result.totalPurchaseExpenseForPeriod).toBe(80000);
      expect(result.perAssetData['future-house'].purchaseExpenseForPeriod).toBe(80000);
    });

    it('purchase expense is charged only once, not every month', () => {
      const assets = new PhysicalAssets([
        createPhysicalAssetInput({
          id: 'future-house',
          name: 'Future House',
          purchaseDate: { type: 'customAge', age: 40 },
          purchasePrice: 500000,
        }),
      ]);

      const simState = createSimulationState({ time: { age: 40, year: 2029, month: 1, date: new Date(2029, 0, 1) } });
      const processor = new PhysicalAssetsProcessor(simState, assets);

      // First month - should have purchase expense
      const result1 = processor.process();
      expect(result1.totalPurchaseExpenseForPeriod).toBe(500000);

      // Advance to next month
      simState.time.month = 2;
      simState.time.date = new Date(2029, 1, 1);

      // Second month - no purchase expense
      const result2 = processor.process();
      expect(result2.totalPurchaseExpenseForPeriod).toBe(0);

      // Annual data should show total purchase expense
      const annualData = processor.getAnnualData();
      expect(annualData.totalPurchaseExpenseForPeriod).toBe(500000);
    });

    it('atRetirement purchase charges expense when retirement starts', () => {
      const assets = new PhysicalAssets([
        createPhysicalAssetInput({
          id: 'retirement-home',
          name: 'Retirement Home',
          purchaseDate: { type: 'atRetirement' },
          purchasePrice: 300000,
        }),
      ]);

      // Pre-retirement
      const simStateAccum = createSimulationState({ phase: { name: 'accumulation' } });
      const processorAccum = new PhysicalAssetsProcessor(simStateAccum, assets);
      const resultAccum = processorAccum.process();
      expect(resultAccum.totalPurchaseExpenseForPeriod).toBe(0);

      // At retirement - new assets instance
      const assets2 = new PhysicalAssets([
        createPhysicalAssetInput({
          id: 'retirement-home',
          name: 'Retirement Home',
          purchaseDate: { type: 'atRetirement' },
          purchasePrice: 300000,
        }),
      ]);
      const simStateRetire = createSimulationState({ phase: { name: 'retirement' } });
      const processorRetire = new PhysicalAssetsProcessor(simStateRetire, assets2);
      const resultRetire = processorRetire.process();

      expect(resultRetire.totalPurchaseExpenseForPeriod).toBe(300000);
    });
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

// ============================================================================
// Full Amortization Tests
// ============================================================================

describe('Full Amortization Tests', () => {
  it('should pay off loan exactly at term end with correct total interest', () => {
    const loanAmount = 320000;
    const apr = 6;
    const termMonths = 360;
    const monthlyRate = apr / 100 / 12;

    const asset = new PhysicalAsset(
      createFinancedAssetInput({
        purchasePrice: 400000,
        financing: {
          downPayment: 80000,
          loanAmount,
          apr,
          termMonths,
        },
      })
    );

    // Calculate expected monthly payment using standard amortization formula
    const expectedMonthlyPayment =
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);

    // Apply all payments
    let totalPayments = 0;
    for (let i = 0; i < termMonths; i++) {
      const { monthlyLoanPayment } = asset.getMonthlyLoanPayment();
      if (monthlyLoanPayment === 0) break;

      asset.applyLoanPayment(monthlyLoanPayment);
      totalPayments += monthlyLoanPayment;
    }

    // Loan should be paid off exactly
    expect(asset.getLoanBalance()).toBeCloseTo(0, 2);
    expect(asset.getMonthlyLoanPayment()).toEqual({ monthlyLoanPayment: 0 });

    // Total payments should match expected (principal + total interest)
    // Total interest for 30-year mortgage at 6% on $320k is roughly $370k
    const expectedTotalPayments = expectedMonthlyPayment * termMonths;
    expect(totalPayments).toBeCloseTo(expectedTotalPayments, 0);

    // Verify total interest paid
    const totalInterest = totalPayments - loanAmount;
    expect(totalInterest).toBeGreaterThan(0);
    expect(totalInterest).toBeCloseTo(expectedTotalPayments - loanAmount, 0);
  });

  it('should pay off zero APR loan with exact payments', () => {
    const loanAmount = 24000;
    const termMonths = 48;

    const asset = new PhysicalAsset(
      createFinancedAssetInput({
        purchasePrice: 30000,
        financing: {
          downPayment: 6000,
          loanAmount,
          apr: 0,
          termMonths,
        },
      })
    );

    const expectedPayment = loanAmount / termMonths;

    // Apply all payments
    let totalPayments = 0;
    for (let i = 0; i < termMonths; i++) {
      const { monthlyLoanPayment } = asset.getMonthlyLoanPayment();
      expect(monthlyLoanPayment).toBeCloseTo(expectedPayment, 2);

      asset.applyLoanPayment(monthlyLoanPayment);
      totalPayments += monthlyLoanPayment;
    }

    // Loan should be paid off exactly with zero interest
    expect(asset.getLoanBalance()).toBe(0);
    expect(totalPayments).toBeCloseTo(loanAmount, 2);
  });

  it('should correctly track principal vs interest split over loan life', () => {
    const loanAmount = 100000;
    const apr = 5;
    const termMonths = 120; // 10 year loan
    const monthlyRate = apr / 100 / 12;

    const asset = new PhysicalAsset(
      createFinancedAssetInput({
        purchasePrice: 125000,
        financing: {
          downPayment: 25000,
          loanAmount,
          apr,
          termMonths,
        },
      })
    );

    let totalPrincipal = 0;
    let totalInterest = 0;

    for (let i = 0; i < termMonths; i++) {
      const balanceBefore = asset.getLoanBalance();
      const { monthlyLoanPayment } = asset.getMonthlyLoanPayment();
      if (monthlyLoanPayment === 0) break;

      const interestThisMonth = balanceBefore * monthlyRate;
      const principalThisMonth = monthlyLoanPayment - interestThisMonth;

      totalInterest += interestThisMonth;
      totalPrincipal += principalThisMonth;

      asset.applyLoanPayment(monthlyLoanPayment);
    }

    // Total principal should equal original loan amount
    expect(totalPrincipal).toBeCloseTo(loanAmount, 0);

    // Total interest should be positive for a loan with APR > 0
    expect(totalInterest).toBeGreaterThan(0);

    // Loan should be paid off
    expect(asset.getLoanBalance()).toBeCloseTo(0, 2);
  });
});

// ============================================================================
// Capital Loss Scenario Tests
// ============================================================================

describe('Capital Loss Scenarios', () => {
  it('should calculate negative capital gain on depreciated asset sale', () => {
    const purchasePrice = 50000;
    const depreciationRate = -20; // 20% annual depreciation

    const asset = new PhysicalAsset(
      createPhysicalAssetInput({
        purchasePrice,
        annualAppreciationRate: depreciationRate,
      })
    );

    // Apply 24 months of depreciation
    for (let i = 0; i < 24; i++) {
      asset.applyMonthlyAppreciation();
    }

    const marketValueBeforeSale = asset.getMarketValue();
    const { capitalGain, saleProceeds } = asset.sell();

    // Asset should have depreciated: 50000 * (0.8)^2 = 32000
    expect(marketValueBeforeSale).toBeCloseTo(purchasePrice * Math.pow(1 - 0.2, 2), -1);

    // Capital gain should be negative (a loss)
    expect(capitalGain).toBeLessThan(0);
    expect(capitalGain).toBeCloseTo(marketValueBeforeSale - purchasePrice, 0);

    // Sale proceeds should equal market value (no loan)
    expect(saleProceeds).toBeCloseTo(marketValueBeforeSale, 0);
  });

  it('should calculate capital loss on financed depreciated asset', () => {
    const purchasePrice = 40000;
    const downPayment = 8000;
    const loanAmount = 32000;

    const asset = new PhysicalAsset(
      createFinancedAssetInput({
        purchasePrice,
        annualAppreciationRate: -15, // 15% annual depreciation (like a car)
        financing: {
          downPayment,
          loanAmount,
          apr: 4,
          termMonths: 60,
        },
      })
    );

    // Apply 12 months of depreciation and payments
    for (let i = 0; i < 12; i++) {
      asset.applyMonthlyAppreciation();
      const { monthlyLoanPayment } = asset.getMonthlyLoanPayment();
      asset.applyLoanPayment(monthlyLoanPayment);
    }

    const marketValueBeforeSale = asset.getMarketValue();
    const loanBalanceBeforeSale = asset.getLoanBalance();
    const { capitalGain, saleProceeds } = asset.sell();

    // Market value after 1 year: 40000 * 0.85 = 34000
    expect(marketValueBeforeSale).toBeCloseTo(purchasePrice * Math.pow(1 - 0.15, 1), -2);

    // Capital gain should be negative (loss)
    expect(capitalGain).toBeLessThan(0);
    expect(capitalGain).toBeCloseTo(marketValueBeforeSale - purchasePrice, 0);

    // Sale proceeds = market value - remaining loan
    expect(saleProceeds).toBeCloseTo(marketValueBeforeSale - loanBalanceBeforeSale, 0);
  });

  it('should handle zero capital gain when sold at purchase price', () => {
    const asset = new PhysicalAsset(
      createPhysicalAssetInput({
        purchasePrice: 300000,
        annualAppreciationRate: 0, // No change in value
      })
    );

    const { capitalGain, saleProceeds } = asset.sell();

    expect(capitalGain).toBe(0);
    expect(saleProceeds).toBe(300000);
  });

  it('should track capital loss correctly with marketValueAtPurchase', () => {
    // Asset was purchased for $200k, now worth $180k (already depreciated)
    const asset = new PhysicalAsset(
      createPhysicalAssetInput({
        purchasePrice: 200000, // Original cost basis
        marketValue: 180000, // Current value (already lost value)
        annualAppreciationRate: 0,
      })
    );

    const { capitalGain, saleProceeds } = asset.sell();

    // Capital gain uses cost basis, not current market value
    expect(capitalGain).toBe(180000 - 200000); // -$20,000 loss
    expect(saleProceeds).toBe(180000);
  });
});

describe('Edge Cases', () => {
  it('asset purchased in future is pending and has no market value', () => {
    const asset = new PhysicalAsset(
      createPhysicalAssetInput({
        purchaseDate: { type: 'customDate', year: 2030, month: 1 },
      })
    );

    expect(asset.getOwnershipStatus()).toBe('pending');
    expect(asset.getMarketValue()).toBe(0); // Pending assets don't contribute to net worth
  });

  it('marketValueAtPurchase != purchasePrice (pre-existing asset)', () => {
    const asset = new PhysicalAsset(
      createPhysicalAssetInput({
        purchasePrice: 300000, // Original cost basis
        marketValue: 450000, // Current value (appreciated)
        annualAppreciationRate: 3,
      })
    );

    // Market value should be the current value, not purchase price
    expect(asset.getMarketValue()).toBe(450000);

    // But capital gain on sale uses original cost basis
    const { capitalGain } = asset.sell();
    expect(capitalGain).toBe(150000); // 450000 - 300000
  });

  it('deprecating asset becomes underwater', () => {
    const asset = new PhysicalAsset(
      createFinancedAssetInput({
        purchasePrice: 30000, // Car
        annualAppreciationRate: -25, // 25% annual depreciation
        financing: {
          downPayment: 3000,
          loanAmount: 27000,
          apr: 5,
          termMonths: 60,
        },
      })
    );

    // Apply 24 months of depreciation
    for (let i = 0; i < 24; i++) {
      asset.applyMonthlyAppreciation();
      const { monthlyLoanPayment } = asset.getMonthlyLoanPayment();
      asset.applyLoanPayment(monthlyLoanPayment);
    }

    // Asset should be underwater (loan > value)
    const marketValue = asset.getMarketValue();
    const loanBalance = asset.getLoanBalance();

    // Market value after 2 years: 30000 * (0.75)^2 = 16875
    expect(marketValue).toBeLessThan(loanBalance);

    // Equity should be 0 (floored)
    expect(asset.getEquity()).toBe(0);
  });

  it('atLifeExpectancy purchase date stays pending', () => {
    const asset = new PhysicalAsset(
      createPhysicalAssetInput({
        purchaseDate: { type: 'atLifeExpectancy' },
      })
    );

    // Should stay pending (atLifeExpectancy returns false for shouldPurchaseThisPeriod)
    const simState = createSimulationState({ time: { age: 100, year: 2089, month: 1, date: new Date(2089, 0, 1) } });
    expect(asset.getOwnershipStatus()).toBe('pending');
    expect(asset.shouldPurchaseThisPeriod(simState)).toBe(false);
  });

  it('very small loan balance is paid off cleanly', () => {
    const asset = new PhysicalAsset(
      createFinancedAssetInput({
        purchasePrice: 10000,
        financing: {
          downPayment: 0,
          loanAmount: 10000,
          apr: 0,
          termMonths: 10,
        },
      })
    );

    // Pay off the loan
    for (let i = 0; i < 15; i++) {
      const { monthlyLoanPayment } = asset.getMonthlyLoanPayment();
      asset.applyLoanPayment(monthlyLoanPayment);
    }

    // Balance should be exactly 0, not negative
    expect(asset.getLoanBalance()).toBe(0);
    expect(asset.getMonthlyLoanPayment()).toEqual({ monthlyLoanPayment: 0 });
  });
});
