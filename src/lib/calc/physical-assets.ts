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

    let totalPurchaseOutlay = 0;
    let totalPurchaseMarketValue = 0;
    const purchaseDataByAsset: Record<string, { purchaseOutlay: number; purchaseMarketValue: number }> = {};

    const assetsToPurchase = this.physicalAssets.getAssetsToPurchaseThisPeriod(this.simulationState);
    for (const asset of assetsToPurchase) {
      const { purchaseOutlay, purchaseMarketValue } = asset.purchase();

      purchaseDataByAsset[asset.getId()] = { purchaseOutlay, purchaseMarketValue };
      totalPurchaseOutlay += purchaseOutlay;
      totalPurchaseMarketValue += purchaseMarketValue;
    }

    let totalAppreciation = 0;
    let totalLoanPayment = 0;
    let totalInterest = 0;
    let totalPrincipalPaid = 0;
    let totalUnpaidInterest = 0;
    let totalDebtPaydown = 0;
    let totalSaleProceeds = 0;
    let totalSaleMarketValue = 0;
    let totalCapitalGain = 0;
    let totalSecuredDebtIncurred = 0;
    let totalDebtPayoff = 0;
    const perAssetData: Record<string, PhysicalAssetData> = {};

    const ownedAssets = this.physicalAssets.getOwnedAssets();
    for (const asset of ownedAssets) {
      const securedDebtIncurred = asset.incurSecuredDebt();
      totalSecuredDebtIncurred += securedDebtIncurred;

      const { monthlyAppreciation: appreciation } = asset.applyMonthlyAppreciation();

      const { monthlyPaymentDue, interest } = asset.getMonthlyPaymentInfo(monthlyInflationRate);
      asset.applyLoanPayment(monthlyPaymentDue, interest);

      const principalPaid = Math.max(0, monthlyPaymentDue - interest);
      const unpaidInterest = Math.max(0, interest - monthlyPaymentDue);

      const debtPaydown = monthlyPaymentDue - interest;

      const assetData: PhysicalAssetData = {
        id: asset.getId(),
        name: asset.getName(),
        marketValue: asset.getMarketValue(),
        loanBalance: asset.getLoanBalance(),
        equity: asset.getEquity(),
        paymentType: asset.getPaymentType(),
        appreciation,
        loanPayment: monthlyPaymentDue,
        interest,
        principalPaid,
        unpaidInterest,
        debtPaydown,
        purchaseOutlay: purchaseDataByAsset[asset.getId()]?.purchaseOutlay ?? 0,
        purchaseMarketValue: purchaseDataByAsset[asset.getId()]?.purchaseMarketValue ?? 0,
        saleProceeds: 0,
        saleMarketValue: 0,
        capitalGain: 0,
        securedDebtIncurred,
        debtPayoff: 0,
        isSold: asset.isSold(),
      };

      perAssetData[asset.getId()] = assetData;
      totalAppreciation += appreciation;
      totalLoanPayment += monthlyPaymentDue;
      totalInterest += interest;
      totalPrincipalPaid += principalPaid;
      totalUnpaidInterest += unpaidInterest;
      totalDebtPaydown += debtPaydown;
    }

    const assetsToSell = this.physicalAssets.getAssetsToSellThisPeriod(this.simulationState);
    for (const asset of assetsToSell) {
      const { saleProceeds, capitalGain, saleMarketValue, debtPayoff } = asset.sell();

      perAssetData[asset.getId()] = {
        ...perAssetData[asset.getId()],
        marketValue: 0,
        loanBalance: 0,
        equity: 0,
        saleProceeds,
        saleMarketValue,
        capitalGain,
        debtPayoff,
        isSold: true,
      };

      totalSaleProceeds += saleProceeds;
      totalSaleMarketValue += saleMarketValue;
      totalCapitalGain += capitalGain;
      totalDebtPayoff += debtPayoff;
    }

    const result: PhysicalAssetsData = {
      totalMarketValue: this.physicalAssets.getTotalMarketValue(),
      totalLoanBalance: this.physicalAssets.getTotalLoanBalance(),
      totalEquity: this.physicalAssets.getTotalEquity(),
      totalAppreciation,
      totalLoanPayment,
      totalInterest,
      totalPrincipalPaid,
      totalUnpaidInterest,
      totalDebtPaydown,
      totalPurchaseOutlay,
      totalPurchaseMarketValue,
      totalSaleProceeds,
      totalSaleMarketValue,
      totalCapitalGain,
      totalSecuredDebtIncurred,
      totalDebtPayoff,
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
        acc.totalAppreciation += curr.totalAppreciation;
        acc.totalLoanPayment += curr.totalLoanPayment;
        acc.totalInterest += curr.totalInterest;
        acc.totalPrincipalPaid += curr.totalPrincipalPaid;
        acc.totalUnpaidInterest += curr.totalUnpaidInterest;
        acc.totalDebtPaydown += curr.totalDebtPaydown;
        acc.totalPurchaseOutlay += curr.totalPurchaseOutlay;
        acc.totalPurchaseMarketValue += curr.totalPurchaseMarketValue;
        acc.totalSaleProceeds += curr.totalSaleProceeds;
        acc.totalSaleMarketValue += curr.totalSaleMarketValue;
        acc.totalCapitalGain += curr.totalCapitalGain;
        acc.totalSecuredDebtIncurred += curr.totalSecuredDebtIncurred;
        acc.totalDebtPayoff += curr.totalDebtPayoff;

        Object.entries(curr.perAssetData).forEach(([assetID, assetData]) => {
          acc.perAssetData[assetID] = {
            ...assetData,
            appreciation: (acc.perAssetData[assetID]?.appreciation ?? 0) + assetData.appreciation,
            loanPayment: (acc.perAssetData[assetID]?.loanPayment ?? 0) + assetData.loanPayment,
            interest: (acc.perAssetData[assetID]?.interest ?? 0) + assetData.interest,
            principalPaid: (acc.perAssetData[assetID]?.principalPaid ?? 0) + assetData.principalPaid,
            unpaidInterest: (acc.perAssetData[assetID]?.unpaidInterest ?? 0) + assetData.unpaidInterest,
            debtPaydown: (acc.perAssetData[assetID]?.debtPaydown ?? 0) + assetData.debtPaydown,
            purchaseOutlay: (acc.perAssetData[assetID]?.purchaseOutlay ?? 0) + assetData.purchaseOutlay,
            purchaseMarketValue: (acc.perAssetData[assetID]?.purchaseMarketValue ?? 0) + assetData.purchaseMarketValue,
            saleProceeds: (acc.perAssetData[assetID]?.saleProceeds ?? 0) + assetData.saleProceeds,
            saleMarketValue: (acc.perAssetData[assetID]?.saleMarketValue ?? 0) + assetData.saleMarketValue,
            capitalGain: (acc.perAssetData[assetID]?.capitalGain ?? 0) + assetData.capitalGain,
            securedDebtIncurred: (acc.perAssetData[assetID]?.securedDebtIncurred ?? 0) + assetData.securedDebtIncurred,
            debtPayoff: (acc.perAssetData[assetID]?.debtPayoff ?? 0) + assetData.debtPayoff,
          };
        });

        return acc;
      },
      {
        totalMarketValue: this.monthlyData[this.monthlyData.length - 1]?.totalMarketValue ?? 0,
        totalLoanBalance: this.monthlyData[this.monthlyData.length - 1]?.totalLoanBalance ?? 0,
        totalEquity: this.monthlyData[this.monthlyData.length - 1]?.totalEquity ?? 0,
        totalAppreciation: 0,
        totalLoanPayment: 0,
        totalInterest: 0,
        totalPrincipalPaid: 0,
        totalUnpaidInterest: 0,
        totalDebtPaydown: 0,
        totalPurchaseOutlay: 0,
        totalPurchaseMarketValue: 0,
        totalSaleProceeds: 0,
        totalSaleMarketValue: 0,
        totalCapitalGain: 0,
        totalSecuredDebtIncurred: 0,
        totalDebtPayoff: 0,
        perAssetData: {},
      }
    );
  }
}

export interface PhysicalAssetsData {
  totalMarketValue: number;
  totalLoanBalance: number;
  totalEquity: number;
  totalAppreciation: number;
  totalLoanPayment: number;
  totalPurchaseOutlay: number;
  totalPurchaseMarketValue: number;
  totalSaleProceeds: number;
  totalSaleMarketValue: number;
  totalCapitalGain: number;
  totalInterest: number;
  totalPrincipalPaid: number;
  totalUnpaidInterest: number;
  totalDebtPaydown: number;
  totalSecuredDebtIncurred: number;
  totalDebtPayoff: number;
  perAssetData: Record<string, PhysicalAssetData>;
}

export interface PhysicalAssetData {
  id: string;
  name: string;
  marketValue: number;
  loanBalance: number;
  equity: number;
  paymentType: 'loan' | 'cash';
  appreciation: number;
  loanPayment: number;
  purchaseOutlay: number;
  purchaseMarketValue: number;
  saleProceeds: number;
  saleMarketValue: number;
  capitalGain: number;
  interest: number;
  principalPaid: number;
  unpaidInterest: number;
  debtPaydown: number;
  securedDebtIncurred: number;
  debtPayoff: number;
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
  private hasSecuredDebtBeenIncurred: boolean;

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
    this.hasSecuredDebtBeenIncurred = data.purchaseDate.type === 'now' && data.paymentMethod.type === 'loan';
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

  getMonthlyPaymentInfo(monthlyInflationRate: number): { monthlyPaymentDue: number; interest: number } {
    if (this.ownershipStatus !== 'owned') throw new Error('Asset is not owned');
    if (this.isPaidOff()) return { monthlyPaymentDue: 0, interest: 0 };

    // Interest can be negative when inflation > APR (real rate is negative)
    const interest = this.calculateMonthlyInterest(monthlyInflationRate);
    const monthlyPaymentDue = Math.min(this.monthlyLoanPayment, this.loanBalance + interest);

    return { monthlyPaymentDue, interest };
  }

  applyLoanPayment(payment: number, interest: number): void {
    if (this.ownershipStatus !== 'owned') throw new Error('Asset is not owned');
    if (this.isPaidOff()) return;

    const unpaidPrevInterest = Math.max(0, this.loanBalance - this.loanPrincipal);
    let remainingPayment = payment;

    const paidCurrInterest = Math.min(remainingPayment, interest);
    remainingPayment -= paidCurrInterest;
    const unpaidCurrInterest = interest - paidCurrInterest;

    const paidPrevInterest = Math.min(remainingPayment, unpaidPrevInterest);
    remainingPayment -= paidPrevInterest;

    this.loanPrincipal = Math.max(0, this.loanPrincipal - remainingPayment);
    this.loanBalance = this.loanPrincipal + (unpaidPrevInterest - paidPrevInterest) + unpaidCurrInterest;
  }

  shouldSellThisPeriod(simulationState: SimulationState): boolean {
    if (this.ownershipStatus !== 'owned' || !this.saleDate) return false;
    return this.getIsSimTimeAtOrAfterTimePoint(simulationState, this.saleDate);
  }

  sell(): { saleProceeds: number; capitalGain: number; saleMarketValue: number; debtPayoff: number } {
    if (this.ownershipStatus !== 'owned') throw new Error('Asset is not owned');

    const saleMarketValue = this.marketValue;
    const debtPayoff = this.loanBalance;
    const saleProceeds = saleMarketValue - debtPayoff;
    const capitalGain = saleMarketValue - this.purchasePrice;

    this.ownershipStatus = 'sold';

    return { saleProceeds, capitalGain, saleMarketValue, debtPayoff };
  }

  shouldPurchaseThisPeriod(simulationState: SimulationState): boolean {
    if (this.ownershipStatus !== 'pending') return false;
    return this.getIsSimTimeAtOrAfterTimePoint(simulationState, this.purchaseDate);
  }

  purchase(): { purchaseOutlay: number; purchaseMarketValue: number } {
    if (this.ownershipStatus !== 'pending') throw new Error('Asset is not pending');

    this.ownershipStatus = 'owned';

    const purchaseMarketValue = this.marketValue;
    const purchaseOutlay = this.paymentMethod.type === 'loan' ? (this.paymentMethod.downPayment ?? 0) : this.purchasePrice;

    return { purchaseOutlay, purchaseMarketValue };
  }

  incurSecuredDebt(): number {
    if (this.ownershipStatus !== 'owned') throw new Error('Asset is not owned');
    if (this.hasSecuredDebtBeenIncurred) return 0;
    if (this.paymentMethod.type !== 'loan') return 0;

    this.hasSecuredDebtBeenIncurred = true;
    return this.loanBalance;
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
