import type { PhysicalAssetInputs, FinancingInputs } from '@/lib/schemas/inputs/physical-asset-schema';
import type { TimePoint } from '@/lib/schemas/inputs/income-expenses-shared-schemas';

import type { SimulationState } from './simulation-engine';

export type OwnershipStatus = 'pending' | 'owned' | 'sold';

export class PhysicalAssetsProcessor {
  private monthlyData: PhysicalAssetsData[] = [];

  constructor(
    private simulationState: SimulationState,
    private physicalAssets: PhysicalAssets
  ) {}

  process(): PhysicalAssetsData {
    let totalPurchaseExpense = 0;
    const purchaseExpenseByAsset: Record<string, number> = {};

    const assetsToPurchase = this.physicalAssets.getAssetsToPurchaseThisPeriod(this.simulationState);
    for (const asset of assetsToPurchase) {
      const { purchaseExpense } = asset.purchase();

      purchaseExpenseByAsset[asset.getId()] = purchaseExpense;
      totalPurchaseExpense += purchaseExpense;
    }

    let totalAppreciation = 0;
    let totalLoanPayment = 0;
    let totalSaleProceeds = 0;
    let totalCapitalGain = 0;
    const perAssetData: Record<string, PhysicalAssetData> = {};

    const activeAssets = this.physicalAssets.getActiveAssets(this.simulationState);
    for (const asset of activeAssets) {
      const { monthlyAppreciation: appreciationForPeriod } = asset.applyMonthlyAppreciation();

      const { monthlyLoanPayment: loanPaymentForPeriod } = asset.getMonthlyLoanPayment();
      asset.applyLoanPayment(loanPaymentForPeriod);

      const assetData: PhysicalAssetData = {
        id: asset.getId(),
        name: asset.getName(),
        marketValue: asset.getMarketValue(),
        loanBalance: asset.getLoanBalance(),
        equity: asset.getEquity(),
        appreciationForPeriod,
        loanPaymentForPeriod,
        purchaseExpenseForPeriod: purchaseExpenseByAsset[asset.getId()] ?? 0,
        saleProceedsForPeriod: 0,
        capitalGainForPeriod: 0,
        isSold: asset.isSold(),
      };

      perAssetData[asset.getId()] = assetData;
      totalAppreciation += appreciationForPeriod;
      totalLoanPayment += loanPaymentForPeriod;
    }

    const assetsToSell = this.physicalAssets.getAssetsToSellThisPeriod(this.simulationState);
    for (const asset of assetsToSell) {
      const { saleProceeds, capitalGain } = asset.sell();

      perAssetData[asset.getId()] = {
        ...perAssetData[asset.getId()],
        marketValue: 0,
        loanBalance: 0,
        equity: 0,
        saleProceedsForPeriod: saleProceeds,
        capitalGainForPeriod: capitalGain,
        isSold: true,
      };

      totalSaleProceeds += saleProceeds;
      totalCapitalGain += capitalGain;
    }

    const result: PhysicalAssetsData = {
      totalMarketValue: this.physicalAssets.getTotalMarketValue(),
      totalLoanBalance: this.physicalAssets.getTotalLoanBalance(),
      totalEquity: this.physicalAssets.getTotalEquity(),
      totalAppreciationForPeriod: totalAppreciation,
      totalLoanPaymentForPeriod: totalLoanPayment,
      totalPurchaseExpenseForPeriod: totalPurchaseExpense,
      totalSaleProceedsForPeriod: totalSaleProceeds,
      totalCapitalGainForPeriod: totalCapitalGain,
      perAssetData,
    };

    this.monthlyData.push(result);
    return result;
  }

  resetMonthlyData(): void {
    this.monthlyData = [];
  }

  getAnnualData(): PhysicalAssetsData {
    return this.monthlyData.reduce(
      (acc, curr) => {
        acc.totalAppreciationForPeriod += curr.totalAppreciationForPeriod;
        acc.totalLoanPaymentForPeriod += curr.totalLoanPaymentForPeriod;
        acc.totalPurchaseExpenseForPeriod += curr.totalPurchaseExpenseForPeriod;
        acc.totalSaleProceedsForPeriod += curr.totalSaleProceedsForPeriod;
        acc.totalCapitalGainForPeriod += curr.totalCapitalGainForPeriod;

        Object.entries(curr.perAssetData).forEach(([assetID, assetData]) => {
          acc.perAssetData[assetID] = {
            ...assetData,
            appreciationForPeriod: (acc.perAssetData[assetID]?.appreciationForPeriod ?? 0) + assetData.appreciationForPeriod,
            loanPaymentForPeriod: (acc.perAssetData[assetID]?.loanPaymentForPeriod ?? 0) + assetData.loanPaymentForPeriod,
            purchaseExpenseForPeriod: (acc.perAssetData[assetID]?.purchaseExpenseForPeriod ?? 0) + assetData.purchaseExpenseForPeriod,
            saleProceedsForPeriod: (acc.perAssetData[assetID]?.saleProceedsForPeriod ?? 0) + assetData.saleProceedsForPeriod,
            capitalGainForPeriod: (acc.perAssetData[assetID]?.capitalGainForPeriod ?? 0) + assetData.capitalGainForPeriod,
          };
        });

        return acc;
      },
      {
        totalMarketValue: this.monthlyData[this.monthlyData.length - 1]?.totalMarketValue ?? 0,
        totalLoanBalance: this.monthlyData[this.monthlyData.length - 1]?.totalLoanBalance ?? 0,
        totalEquity: this.monthlyData[this.monthlyData.length - 1]?.totalEquity ?? 0,
        totalAppreciationForPeriod: 0,
        totalLoanPaymentForPeriod: 0,
        totalPurchaseExpenseForPeriod: 0,
        totalSaleProceedsForPeriod: 0,
        totalCapitalGainForPeriod: 0,
        perAssetData: {},
      }
    );
  }
}

export interface PhysicalAssetsData {
  totalMarketValue: number;
  totalLoanBalance: number;
  totalEquity: number;
  totalAppreciationForPeriod: number;
  totalLoanPaymentForPeriod: number;
  totalPurchaseExpenseForPeriod: number;
  totalSaleProceedsForPeriod: number;
  totalCapitalGainForPeriod: number;
  perAssetData: Record<string, PhysicalAssetData>;
}

export interface PhysicalAssetData {
  id: string;
  name: string;
  marketValue: number;
  loanBalance: number;
  equity: number;
  appreciationForPeriod: number;
  loanPaymentForPeriod: number;
  purchaseExpenseForPeriod: number;
  saleProceedsForPeriod: number;
  capitalGainForPeriod: number;
  isSold: boolean;
}

export class PhysicalAssets {
  private readonly assets: PhysicalAsset[];

  constructor(data: PhysicalAssetInputs[]) {
    this.assets = data.filter((asset) => !asset.disabled).map((asset) => new PhysicalAsset(asset));
  }

  getActiveAssets(simulationState: SimulationState): PhysicalAsset[] {
    return this.assets.filter((asset) => asset.getIsActive(simulationState));
  }

  getAssetsToSellThisPeriod(simulationState: SimulationState): PhysicalAsset[] {
    return this.assets.filter((asset) => asset.shouldSellThisPeriod(simulationState));
  }

  getAssetsToPurchaseThisPeriod(simulationState: SimulationState): PhysicalAsset[] {
    return this.assets.filter((asset) => asset.shouldPurchaseThisPeriod(simulationState));
  }

  getTotalMarketValue(): number {
    return this.assets.reduce((sum, asset) => sum + asset.getMarketValue(), 0);
  }

  getTotalLoanBalance(): number {
    return this.assets.reduce((sum, asset) => sum + asset.getLoanBalance(), 0);
  }

  getTotalEquity(): number {
    return this.assets.reduce((sum, asset) => sum + asset.getEquity(), 0);
  }
}

export class PhysicalAsset {
  private id: string;
  private name: string;
  private purchaseDate: TimePoint;
  private marketValue: number;
  private purchasePrice: number;
  private annualAppreciationRate: number;
  private saleDate: TimePoint | undefined;
  private financing: FinancingInputs | undefined;
  private loanBalance: number = 0;
  private monthlyLoanPayment: number = 0;
  private ownershipStatus: OwnershipStatus;

  constructor(data: PhysicalAssetInputs) {
    this.id = data.id;
    this.name = data.name;
    this.purchaseDate = data.purchaseDate;
    this.marketValue = data.marketValueAtPurchase ?? data.purchasePrice;
    this.purchasePrice = data.purchasePrice;
    this.annualAppreciationRate = data.annualAppreciationRate / 100;
    this.saleDate = data.saleDate;
    this.financing = data.financing;

    if (data.financing) {
      this.loanBalance = data.financing.loanAmount;
      this.monthlyLoanPayment = this.calculateMonthlyLoanPayment(data.financing);
    }

    // Assets with purchaseDate.type === 'now' are already owned (no purchase expense)
    // All other purchase date types start as pending
    this.ownershipStatus = data.purchaseDate.type === 'now' ? 'owned' : 'pending';
  }

  private calculateMonthlyLoanPayment(financing: FinancingInputs): number {
    const monthlyRate = financing.apr / 100 / 12;
    const numPayments = financing.termMonths;

    if (monthlyRate === 0) return financing.loanAmount / numPayments;

    return (financing.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getMarketValue(): number {
    return this.ownershipStatus !== 'owned' ? 0 : this.marketValue;
  }

  getLoanBalance(): number {
    return this.ownershipStatus !== 'owned' ? 0 : this.loanBalance;
  }

  getEquity(): number {
    return this.ownershipStatus !== 'owned' ? 0 : Math.max(0, this.marketValue - this.loanBalance);
  }

  isSold(): boolean {
    return this.ownershipStatus === 'sold';
  }

  isPaidOff(): boolean {
    return this.ownershipStatus === 'owned' && this.loanBalance <= 0;
  }

  getOwnershipStatus(): OwnershipStatus {
    return this.ownershipStatus;
  }

  applyMonthlyAppreciation(): { monthlyAppreciation: number } {
    if (this.ownershipStatus !== 'owned') throw new Error('Asset is not owned');

    const monthlyRate = Math.pow(1 + this.annualAppreciationRate, 1 / 12) - 1;
    const monthlyAppreciation = this.marketValue * monthlyRate;

    this.marketValue += monthlyAppreciation;
    return { monthlyAppreciation };
  }

  private calculateMonthlyInterest(): number {
    if (!this.financing) return 0;
    return this.loanBalance * (this.financing.apr / 100 / 12);
  }

  getMonthlyLoanPayment(): { monthlyLoanPayment: number } {
    if (this.ownershipStatus !== 'owned') throw new Error('Asset is not owned');
    if (this.isPaidOff()) return { monthlyLoanPayment: 0 };

    return { monthlyLoanPayment: Math.min(this.monthlyLoanPayment, this.loanBalance + this.calculateMonthlyInterest()) };
  }

  applyLoanPayment(payment: number): void {
    if (this.ownershipStatus !== 'owned') throw new Error('Asset is not owned');
    if (this.isPaidOff()) return;

    const interestForPeriod = this.calculateMonthlyInterest();

    if (payment >= interestForPeriod) {
      const principalPayment = payment - interestForPeriod;
      this.loanBalance = Math.max(0, this.loanBalance - principalPayment);
    } else {
      const unpaidInterest = interestForPeriod - payment;
      this.loanBalance += unpaidInterest;
    }
  }

  getIsActive(simulationState: SimulationState): boolean {
    if (this.ownershipStatus !== 'owned') return false;
    return !this.shouldSellThisPeriod(simulationState);
  }

  shouldSellThisPeriod(simulationState: SimulationState): boolean {
    if (this.ownershipStatus !== 'owned' || !this.saleDate) return false;
    return this.getIsSimTimeAtOrAfterTimePoint(simulationState, this.saleDate);
  }

  sell(): { saleProceeds: number; capitalGain: number } {
    if (this.ownershipStatus !== 'owned') throw new Error('Asset is not owned');

    const saleProceeds = Math.max(0, this.marketValue - this.loanBalance);
    const capitalGain = this.marketValue - this.purchasePrice;

    this.ownershipStatus = 'sold';

    return { saleProceeds, capitalGain };
  }

  shouldPurchaseThisPeriod(simulationState: SimulationState): boolean {
    if (this.ownershipStatus !== 'pending') return false;
    return this.getIsSimTimeAtOrAfterTimePoint(simulationState, this.purchaseDate);
  }

  purchase(): { purchaseExpense: number } {
    if (this.ownershipStatus !== 'pending') throw new Error('Asset is not pending');

    this.ownershipStatus = 'owned';

    return { purchaseExpense: this.financing ? this.financing.downPayment : this.purchasePrice };
  }

  private getIsSimTimeAtOrAfterTimePoint(simulationState: SimulationState, timePoint: TimePoint): boolean {
    const simDate = simulationState.time.date;
    const simAge = simulationState.time.age;

    switch (timePoint.type) {
      case 'customAge':
        return simAge >= timePoint.age!;
      case 'customDate':
        const customDateYear = timePoint.year!;
        const customDateMonth = timePoint.month! - 1;

        const customDate = new Date(customDateYear, customDateMonth);

        return simDate >= customDate;
      case 'now':
        return true;
      case 'atRetirement':
        return simulationState.phase?.name === 'retirement';
      case 'atLifeExpectancy':
        return false;
    }
  }
}
