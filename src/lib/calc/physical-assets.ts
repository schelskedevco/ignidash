import type { PhysicalAssetInputs, PaymentMethodInputs } from '@/lib/schemas/inputs/physical-asset-form-schema';
import type { TimePoint } from '@/lib/schemas/inputs/income-expenses-shared-schemas';

import type { SimulationState } from './simulation-engine';

export type OwnershipStatus = 'pending' | 'owned' | 'sold';

export class PhysicalAssetsProcessor {
  private monthlyData: PhysicalAssetsData[] = [];

  constructor(
    private simulationState: SimulationState,
    private physicalAssets: PhysicalAssets
  ) {}

  process(monthlyInflationRate: number): PhysicalAssetsData {
    this.physicalAssets.applyMonthlyInflation(monthlyInflationRate);

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
    let totalInterest = 0;
    let totalPrincipalPaid = 0;
    let totalUnpaidInterest = 0;
    let totalSaleProceeds = 0;
    let totalCapitalGain = 0;
    const perAssetData: Record<string, PhysicalAssetData> = {};

    const ownedAssets = this.physicalAssets.getOwnedAssets();
    for (const asset of ownedAssets) {
      const { monthlyAppreciation: appreciationForPeriod } = asset.applyMonthlyAppreciation();

      const { monthlyPaymentDue, interestForPeriod } = asset.getMonthlyPaymentInfo(monthlyInflationRate);
      asset.applyLoanPayment(monthlyPaymentDue, interestForPeriod);

      const principalPaidForPeriod = monthlyPaymentDue - interestForPeriod;
      const unpaidInterestForPeriod = interestForPeriod - monthlyPaymentDue;

      const assetData: PhysicalAssetData = {
        id: asset.getId(),
        name: asset.getName(),
        marketValue: asset.getMarketValue(),
        loanBalance: asset.getLoanBalance(),
        equity: asset.getEquity(),
        paymentType: asset.getPaymentType(),
        appreciationForPeriod,
        loanPaymentForPeriod: monthlyPaymentDue,
        interestForPeriod,
        principalPaidForPeriod,
        unpaidInterestForPeriod,
        purchaseExpenseForPeriod: purchaseExpenseByAsset[asset.getId()] ?? 0,
        saleProceedsForPeriod: 0,
        capitalGainForPeriod: 0,
        isSold: asset.isSold(),
      };

      perAssetData[asset.getId()] = assetData;
      totalAppreciation += appreciationForPeriod;
      totalLoanPayment += monthlyPaymentDue;
      totalInterest += interestForPeriod;
      totalPrincipalPaid += principalPaidForPeriod;
      totalUnpaidInterest += unpaidInterestForPeriod;
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
      totalInterestForPeriod: totalInterest,
      totalPrincipalPaidForPeriod: totalPrincipalPaid,
      totalUnpaidInterestForPeriod: totalUnpaidInterest,
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
        acc.totalInterestForPeriod += curr.totalInterestForPeriod;
        acc.totalPrincipalPaidForPeriod += curr.totalPrincipalPaidForPeriod;
        acc.totalUnpaidInterestForPeriod += curr.totalUnpaidInterestForPeriod;
        acc.totalPurchaseExpenseForPeriod += curr.totalPurchaseExpenseForPeriod;
        acc.totalSaleProceedsForPeriod += curr.totalSaleProceedsForPeriod;
        acc.totalCapitalGainForPeriod += curr.totalCapitalGainForPeriod;

        Object.entries(curr.perAssetData).forEach(([assetID, assetData]) => {
          acc.perAssetData[assetID] = {
            ...assetData,
            appreciationForPeriod: (acc.perAssetData[assetID]?.appreciationForPeriod ?? 0) + assetData.appreciationForPeriod,
            loanPaymentForPeriod: (acc.perAssetData[assetID]?.loanPaymentForPeriod ?? 0) + assetData.loanPaymentForPeriod,
            interestForPeriod: (acc.perAssetData[assetID]?.interestForPeriod ?? 0) + assetData.interestForPeriod,
            principalPaidForPeriod: (acc.perAssetData[assetID]?.principalPaidForPeriod ?? 0) + assetData.principalPaidForPeriod,
            unpaidInterestForPeriod: (acc.perAssetData[assetID]?.unpaidInterestForPeriod ?? 0) + assetData.unpaidInterestForPeriod,
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
        totalInterestForPeriod: 0,
        totalPrincipalPaidForPeriod: 0,
        totalUnpaidInterestForPeriod: 0,
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
  totalInterestForPeriod: number;
  totalPrincipalPaidForPeriod: number;
  totalUnpaidInterestForPeriod: number;
  perAssetData: Record<string, PhysicalAssetData>;
}

export interface PhysicalAssetData {
  id: string;
  name: string;
  marketValue: number;
  loanBalance: number;
  equity: number;
  paymentType: 'loan' | 'cash';
  appreciationForPeriod: number;
  loanPaymentForPeriod: number;
  purchaseExpenseForPeriod: number;
  saleProceedsForPeriod: number;
  capitalGainForPeriod: number;
  interestForPeriod: number;
  principalPaidForPeriod: number;
  unpaidInterestForPeriod: number;
  isSold: boolean;
}

export class PhysicalAssets {
  private readonly assets: PhysicalAsset[];

  constructor(data: PhysicalAssetInputs[]) {
    this.assets = data.map((asset) => new PhysicalAsset(asset));
  }

  applyMonthlyInflation(monthlyInflationRate: number): void {
    this.assets.forEach((asset) => asset.applyMonthlyInflation(monthlyInflationRate));
  }

  getOwnedAssets(): PhysicalAsset[] {
    return this.assets.filter((asset) => asset.getOwnershipStatus() === 'owned');
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
  private appreciationRate: number;
  private saleDate: TimePoint | undefined;
  private paymentMethod: PaymentMethodInputs;
  private loanBalance: number = 0;
  private loanPrincipal: number = 0;
  private nominalAPR: number = 0; // Store nominal APR (user input)
  private monthlyLoanPayment: number = 0; // Mutable, deflates over time
  private ownershipStatus: OwnershipStatus;

  constructor(data: PhysicalAssetInputs) {
    this.id = data.id;
    this.name = data.name;
    this.purchaseDate = data.purchaseDate;
    this.marketValue = data.marketValue ?? data.purchasePrice;
    this.purchasePrice = data.purchasePrice;
    this.appreciationRate = data.appreciationRate / 100;
    this.saleDate = data.saleDate;
    this.paymentMethod = data.paymentMethod;

    if (data.paymentMethod.type === 'loan') {
      this.loanBalance = data.paymentMethod.loanBalance;
      this.loanPrincipal = data.paymentMethod.loanBalance;
      this.nominalAPR = data.paymentMethod.apr / 100;
      this.monthlyLoanPayment = data.paymentMethod.monthlyPayment;
    }

    // Assets with purchaseDate.type === 'now' are already owned (no purchase expense)
    // All other purchase date types start as pending
    this.ownershipStatus = data.purchaseDate.type === 'now' ? 'owned' : 'pending';
  }

  applyMonthlyInflation(monthlyInflationRate: number): void {
    if (this.paymentMethod.type === 'loan') {
      this.monthlyLoanPayment /= 1 + monthlyInflationRate;
    }
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

  getPaymentType(): 'loan' | 'cash' {
    return this.paymentMethod.type;
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

    const monthlyRate = Math.pow(1 + this.appreciationRate, 1 / 12) - 1;
    const monthlyAppreciation = this.marketValue * monthlyRate;

    this.marketValue += monthlyAppreciation;
    return { monthlyAppreciation };
  }

  private calculateMonthlyInterest(monthlyInflationRate: number): number {
    if (this.paymentMethod.type !== 'loan') return 0;
    return this.loanPrincipal * ((1 + this.nominalAPR / 12) / (1 + monthlyInflationRate) - 1);
  }

  getMonthlyPaymentInfo(monthlyInflationRate: number): { monthlyPaymentDue: number; interestForPeriod: number } {
    if (this.ownershipStatus !== 'owned') throw new Error('Asset is not owned');
    if (this.isPaidOff()) return { monthlyPaymentDue: 0, interestForPeriod: 0 };

    const interestForPeriod = this.calculateMonthlyInterest(monthlyInflationRate);
    const monthlyPaymentDue = Math.min(this.monthlyLoanPayment, this.loanBalance + interestForPeriod);

    return { monthlyPaymentDue, interestForPeriod };
  }

  applyLoanPayment(payment: number, interestForPeriod: number): void {
    if (this.ownershipStatus !== 'owned') throw new Error('Asset is not owned');
    if (this.isPaidOff()) return;

    const unpaidPrevInterest = Math.max(0, this.loanBalance - this.loanPrincipal);
    let remainingPayment = payment;

    const paidCurrInterest = Math.min(remainingPayment, interestForPeriod);
    remainingPayment -= paidCurrInterest;
    const unpaidCurrInterest = interestForPeriod - paidCurrInterest;

    const paidPrevInterest = Math.min(remainingPayment, unpaidPrevInterest);
    remainingPayment -= paidPrevInterest;

    this.loanPrincipal = Math.max(0, this.loanPrincipal - remainingPayment);
    this.loanBalance = this.loanPrincipal + (unpaidPrevInterest - paidPrevInterest) + unpaidCurrInterest;
  }

  shouldSellThisPeriod(simulationState: SimulationState): boolean {
    if (this.ownershipStatus !== 'owned' || !this.saleDate) return false;
    return this.getIsSimTimeAtOrAfterTimePoint(simulationState, this.saleDate);
  }

  sell(): { saleProceeds: number; capitalGain: number } {
    if (this.ownershipStatus !== 'owned') throw new Error('Asset is not owned');

    const saleProceeds = this.marketValue - this.loanBalance;
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

    return { purchaseExpense: this.paymentMethod.type === 'loan' ? (this.paymentMethod.downPayment ?? 0) : this.purchasePrice };
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
