/**
 * Debt processing for the simulation engine
 *
 * Handles unsecured debts (credit cards, personal loans) with simple or compound
 * interest. Tracks principal, interest, and payoff status. Payments deflate over
 * time with inflation (real dollar terms).
 */

import type { DebtInputs, CompoundingFrequency } from '@/lib/schemas/inputs/debt-form-schema';
import type { TimePoint } from '@/lib/schemas/inputs/income-expenses-shared-schemas';

import type { SimulationState } from './simulation-engine';

/** Processes all active debts each month and aggregates annual totals */
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
    let totalDebtPaydown = 0;
    let totalUnsecuredDebtIncurred = 0;
    const perDebtData: Record<string, DebtData> = {};

    const activeDebts = this.debts.getActiveDebts(this.simulationState);
    for (const debt of activeDebts) {
      totalUnsecuredDebtIncurred += debt.incurUnsecuredDebt();

      const { monthlyPaymentDue, interest } = debt.getMonthlyPaymentInfo(monthlyInflationRate);
      debt.applyPayment(monthlyPaymentDue, interest);

      const principalPaid = Math.max(0, monthlyPaymentDue - interest);
      const unpaidInterest = Math.max(0, interest - monthlyPaymentDue);

      const debtPaydown = monthlyPaymentDue - interest;

      const debtData: DebtData = {
        id: debt.getId(),
        name: debt.getName(),
        balance: debt.getBalance(),
        payment: monthlyPaymentDue,
        interest,
        principalPaid,
        unpaidInterest,
        debtPaydown,
        isPaidOff: debt.isPaidOff(),
      };

      perDebtData[debt.getId()] = debtData;
      totalPayment += monthlyPaymentDue;
      totalInterest += interest;
      totalPrincipalPaid += principalPaid;
      totalUnpaidInterest += unpaidInterest;
      totalDebtPaydown += debtPaydown;
    }

    const result: DebtsData = {
      totalDebtBalance: this.debts.getTotalBalance(),
      totalPayment,
      totalInterest,
      totalPrincipalPaid,
      totalUnpaidInterest,
      totalDebtPaydown,
      totalUnsecuredDebtIncurred,
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
        acc.totalPayment += curr.totalPayment;
        acc.totalInterest += curr.totalInterest;
        acc.totalPrincipalPaid += curr.totalPrincipalPaid;
        acc.totalUnpaidInterest += curr.totalUnpaidInterest;
        acc.totalDebtPaydown += curr.totalDebtPaydown;
        acc.totalUnsecuredDebtIncurred += curr.totalUnsecuredDebtIncurred;

        Object.entries(curr.perDebtData).forEach(([debtID, debtData]) => {
          acc.perDebtData[debtID] = {
            ...debtData,
            payment: (acc.perDebtData[debtID]?.payment ?? 0) + debtData.payment,
            interest: (acc.perDebtData[debtID]?.interest ?? 0) + debtData.interest,
            principalPaid: (acc.perDebtData[debtID]?.principalPaid ?? 0) + debtData.principalPaid,
            unpaidInterest: (acc.perDebtData[debtID]?.unpaidInterest ?? 0) + debtData.unpaidInterest,
            debtPaydown: (acc.perDebtData[debtID]?.debtPaydown ?? 0) + debtData.debtPaydown,
          };
        });

        return acc;
      },
      {
        totalDebtBalance: this.monthlyData[this.monthlyData.length - 1]?.totalDebtBalance ?? 0,
        totalPayment: 0,
        totalInterest: 0,
        totalPrincipalPaid: 0,
        totalUnpaidInterest: 0,
        totalDebtPaydown: 0,
        totalUnsecuredDebtIncurred: 0,
        perDebtData: {},
      }
    );
  }
}

export interface DebtsData {
  totalDebtBalance: number;
  totalPayment: number;
  totalInterest: number;
  totalPrincipalPaid: number;
  totalUnpaidInterest: number;
  totalDebtPaydown: number;
  totalUnsecuredDebtIncurred: number;
  perDebtData: Record<string, DebtData>;
}

export interface DebtData {
  id: string;
  name: string;
  balance: number;
  payment: number;
  interest: number;
  principalPaid: number;
  unpaidInterest: number;
  debtPaydown: number;
  isPaidOff: boolean;
}

/** Collection of debt obligations that filters by active status */
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

/** A single debt with simple or compound interest and monthly payment tracking */
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
  private hasBeenIncurred: boolean;

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
    this.hasBeenIncurred = data.startDate.type === 'now';
  }

  incurUnsecuredDebt(): number {
    if (this.hasBeenIncurred) return 0;
    this.hasBeenIncurred = true;
    return this.balance;
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
    return this.hasBeenIncurred ? this.balance : 0;
  }

  isPaidOff(): boolean {
    return this.balance <= 0;
  }

  /**
   * Calculates monthly payment and interest, capped at remaining balance
   * @param monthlyInflationRate - Monthly inflation for real interest calculation
   * @returns Payment due and interest component
   */
  getMonthlyPaymentInfo(monthlyInflationRate: number): { monthlyPaymentDue: number; interest: number } {
    if (this.isPaidOff()) return { monthlyPaymentDue: 0, interest: 0 };

    // Interest can be negative when inflation > APR (real rate is negative)
    const interest = this.calculateMonthlyInterest(monthlyInflationRate);
    const monthlyPaymentDue = Math.min(this.monthlyPayment, this.balance + interest);

    return { monthlyPaymentDue, interest };
  }

  /**
   * Applies a payment to the debt, handling simple vs compound interest differently
   *
   * Simple interest: payment covers current interest, then unpaid prior interest, then principal.
   * Compound interest: unpaid interest capitalizes into the balance.
   * @param payment - Payment amount applied
   * @param interest - Interest accrued this period
   */
  applyPayment(payment: number, interest: number): void {
    switch (this.interestType) {
      case 'simple':
        const unpaidPrevInterest = Math.max(0, this.balance - this.principal);
        let remainingPayment = payment;

        const paidCurrInterest = Math.min(remainingPayment, interest);
        remainingPayment -= paidCurrInterest;
        const unpaidCurrInterest = interest - paidCurrInterest;

        const paidPrevInterest = Math.min(remainingPayment, unpaidPrevInterest);
        remainingPayment -= paidPrevInterest;

        this.principal = Math.max(0, this.principal - remainingPayment);
        this.balance = this.principal + (unpaidPrevInterest - paidPrevInterest) + unpaidCurrInterest;
        break;
      case 'compound':
        if (payment >= interest) {
          const principalPayment = payment - interest;
          this.balance = Math.max(0, this.balance - principalPayment);
        } else {
          const unpaidInterest = interest - payment;
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
