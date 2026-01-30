import type { DebtInputs, CompoundingFrequency } from '@/lib/schemas/inputs/debt-form-schema';
import type { TimePoint } from '@/lib/schemas/inputs/income-expenses-shared-schemas';

import type { SimulationState } from './simulation-engine';

export class DebtsProcessor {
  private monthlyData: DebtsData[] = [];

  constructor(
    private simulationState: SimulationState,
    private debts: Debts
  ) {}

  process(monthlyInflationRate: number): DebtsData {
    this.debts.applyMonthlyInflation(monthlyInflationRate);

    let totalPayment = 0;
    let totalInterest = 0;
    let totalPrincipalPaid = 0;
    let totalUnpaidInterest = 0;
    const perDebtData: Record<string, DebtData> = {};

    const activeDebts = this.debts.getActiveDebts(this.simulationState);
    for (const debt of activeDebts) {
      const { monthlyPaymentDue, interestForPeriod } = debt.getMonthlyPaymentInfo(monthlyInflationRate);
      debt.applyPayment(monthlyPaymentDue, interestForPeriod);

      const principalPaidForPeriod = monthlyPaymentDue - interestForPeriod;
      const unpaidInterestForPeriod = interestForPeriod - monthlyPaymentDue;

      const debtData: DebtData = {
        id: debt.getId(),
        name: debt.getName(),
        balance: debt.getBalance(),
        paymentForPeriod: monthlyPaymentDue,
        interestForPeriod,
        principalPaidForPeriod,
        unpaidInterestForPeriod,
        isPaidOff: debt.isPaidOff(),
      };

      perDebtData[debt.getId()] = debtData;
      totalPayment += monthlyPaymentDue;
      totalInterest += interestForPeriod;
      totalPrincipalPaid += principalPaidForPeriod;
      totalUnpaidInterest += unpaidInterestForPeriod;
    }

    const result: DebtsData = {
      totalDebtBalance: this.debts.getTotalBalance(),
      totalPaymentForPeriod: totalPayment,
      totalInterestForPeriod: totalInterest,
      totalPrincipalPaidForPeriod: totalPrincipalPaid,
      totalUnpaidInterestForPeriod: totalUnpaidInterest,
      perDebtData,
    };

    this.monthlyData.push(result);
    return result;
  }

  resetMonthlyData(): void {
    this.monthlyData = [];
  }

  getAnnualData(): DebtsData {
    return this.monthlyData.reduce(
      (acc, curr) => {
        acc.totalPaymentForPeriod += curr.totalPaymentForPeriod;
        acc.totalInterestForPeriod += curr.totalInterestForPeriod;
        acc.totalPrincipalPaidForPeriod += curr.totalPrincipalPaidForPeriod;
        acc.totalUnpaidInterestForPeriod += curr.totalUnpaidInterestForPeriod;

        Object.entries(curr.perDebtData).forEach(([debtID, debtData]) => {
          acc.perDebtData[debtID] = {
            ...debtData,
            paymentForPeriod: (acc.perDebtData[debtID]?.paymentForPeriod ?? 0) + debtData.paymentForPeriod,
            interestForPeriod: (acc.perDebtData[debtID]?.interestForPeriod ?? 0) + debtData.interestForPeriod,
            principalPaidForPeriod: (acc.perDebtData[debtID]?.principalPaidForPeriod ?? 0) + debtData.principalPaidForPeriod,
            unpaidInterestForPeriod: (acc.perDebtData[debtID]?.unpaidInterestForPeriod ?? 0) + debtData.unpaidInterestForPeriod,
          };
        });

        return acc;
      },
      {
        totalDebtBalance: this.monthlyData[this.monthlyData.length - 1]?.totalDebtBalance ?? 0,
        totalPaymentForPeriod: 0,
        totalInterestForPeriod: 0,
        totalPrincipalPaidForPeriod: 0,
        totalUnpaidInterestForPeriod: 0,
        perDebtData: {},
      }
    );
  }
}

export interface DebtsData {
  totalDebtBalance: number;
  totalPaymentForPeriod: number;
  totalInterestForPeriod: number;
  totalPrincipalPaidForPeriod: number;
  totalUnpaidInterestForPeriod: number;
  perDebtData: Record<string, DebtData>;
}

export interface DebtData {
  id: string;
  name: string;
  balance: number;
  paymentForPeriod: number;
  interestForPeriod: number;
  principalPaidForPeriod: number;
  unpaidInterestForPeriod: number;
  isPaidOff: boolean;
}

export class Debts {
  private readonly debts: Debt[];

  constructor(data: DebtInputs[]) {
    this.debts = data.filter((debt) => !debt.disabled).map((debt) => new Debt(debt));
  }

  applyMonthlyInflation(monthlyInflationRate: number): void {
    this.debts.forEach((debt) => debt.applyMonthlyInflation(monthlyInflationRate));
  }

  getActiveDebts(simulationState: SimulationState): Debt[] {
    return this.debts.filter((debt) => debt.getIsActive(simulationState));
  }

  getTotalBalance(): number {
    return this.debts.reduce((sum, debt) => sum + debt.getBalance(), 0);
  }
}

export class Debt {
  private id: string;
  private name: string;
  private balance: number;
  private principal: number;
  private nominalAPR: number; // Store nominal APR (user input)
  private interestType: 'simple' | 'compound';
  private compoundingFrequency: CompoundingFrequency | undefined;
  private startDate: TimePoint;
  private monthlyPayment: number; // Mutable, deflates over time

  constructor(data: DebtInputs) {
    this.id = data.id;
    this.name = data.name;
    this.balance = data.balance;
    this.principal = data.balance;
    this.nominalAPR = data.apr / 100;
    this.interestType = data.interestType;
    this.compoundingFrequency = data.compoundingFrequency;
    this.startDate = data.startDate;
    this.monthlyPayment = data.monthlyPayment;
  }

  applyMonthlyInflation(monthlyInflationRate: number): void {
    this.monthlyPayment /= 1 + monthlyInflationRate;
  }

  getId(): string {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getBalance(): number {
    return this.balance;
  }

  isPaidOff(): boolean {
    return this.balance <= 0;
  }

  getMonthlyPaymentInfo(monthlyInflationRate: number): { monthlyPaymentDue: number; interestForPeriod: number } {
    if (this.isPaidOff()) return { monthlyPaymentDue: 0, interestForPeriod: 0 };

    const interestForPeriod = this.calculateMonthlyInterest(monthlyInflationRate);
    const monthlyPaymentDue = Math.min(this.monthlyPayment, this.balance + interestForPeriod);

    return { monthlyPaymentDue, interestForPeriod };
  }

  applyPayment(payment: number, interestForPeriod: number): void {
    switch (this.interestType) {
      case 'simple':
        const unpaidPrevInterest = Math.max(0, this.balance - this.principal);
        let remainingPayment = payment;

        const paidCurrInterest = Math.min(remainingPayment, interestForPeriod);
        remainingPayment -= paidCurrInterest;
        const unpaidCurrInterest = interestForPeriod - paidCurrInterest;

        const paidPrevInterest = Math.min(remainingPayment, unpaidPrevInterest);
        remainingPayment -= paidPrevInterest;

        this.principal = Math.max(0, this.principal - remainingPayment);
        this.balance = this.principal + (unpaidPrevInterest - paidPrevInterest) + unpaidCurrInterest;
        break;
      case 'compound':
        if (payment >= interestForPeriod) {
          const principalPayment = payment - interestForPeriod;
          this.balance = Math.max(0, this.balance - principalPayment);
        } else {
          const unpaidInterest = interestForPeriod - payment;
          this.balance += unpaidInterest;
        }
        break;
    }
  }

  private calculateMonthlyInterest(monthlyInflationRate: number): number {
    if (this.isPaidOff()) return 0;
    if (this.interestType === 'simple') return this.principal * ((1 + this.nominalAPR / 12) / (1 + monthlyInflationRate) - 1);

    if (!this.compoundingFrequency) throw new Error(`Missing compoundingFrequency for debt: ${this.name}`);

    let periodsPerYear: number;
    switch (this.compoundingFrequency) {
      case 'daily':
        periodsPerYear = 365;
        break;
      case 'monthly':
        periodsPerYear = 12;
        break;
    }

    const periodsPerMonth = periodsPerYear / 12;
    const periodicInflationRate = Math.pow(1 + monthlyInflationRate, 1 / periodsPerMonth) - 1;
    const periodicRate = (1 + this.nominalAPR / periodsPerYear) / (1 + periodicInflationRate) - 1;

    const endBalance = this.balance * Math.pow(1 + periodicRate, periodsPerMonth);
    return endBalance - this.balance;
  }

  getIsActive(simulationState: SimulationState): boolean {
    if (this.isPaidOff()) return false;
    return this.getIsSimTimeAfterDebtStart(simulationState);
  }

  private getIsSimTimeAfterDebtStart(simulationState: SimulationState): boolean {
    const simDate = simulationState.time.date;
    const simAge = simulationState.time.age;

    const startDate = this.startDate;
    switch (startDate.type) {
      case 'customAge':
        return simAge >= startDate.age!;
      case 'customDate':
        const customDateYear = startDate.year!;
        const customDateMonth = startDate.month! - 1;

        const customStartDate = new Date(customDateYear, customDateMonth);

        return simDate >= customStartDate;
      case 'now':
        return true;
      case 'atRetirement':
        return simulationState.phase?.name === 'retirement';
      case 'atLifeExpectancy':
        return false;
    }
  }
}
