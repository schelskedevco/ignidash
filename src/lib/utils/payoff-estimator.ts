export type InterestType = 'simple' | 'compound';
export type CompoundingFrequency = 'daily' | 'monthly';

export interface PayoffEstimateParams {
  balance: number;
  monthlyPayment: number;
  apr: number;
  interestType: InterestType;
  compoundingFrequency?: CompoundingFrequency;
}

/**
 * Estimates months to pay off a debt using simulation.
 * Returns null for invalid inputs, Infinity if payment doesn't cover interest.
 */
export function estimatePayoffMonths(params: PayoffEstimateParams): number | null {
  const { balance, monthlyPayment, apr, interestType, compoundingFrequency } = params;

  if (balance <= 0 || monthlyPayment <= 0) return null;
  if (apr === 0) return Math.ceil(balance / monthlyPayment);

  const annualRate = apr / 100;
  let currentBalance = balance;
  let months = 0;
  const maxMonths = 1200;

  while (currentBalance > 0.01 && months < maxMonths) {
    const interest =
      interestType === 'simple'
        ? currentBalance * (annualRate / 12)
        : compoundingFrequency === 'daily'
          ? currentBalance * (Math.pow(1 + annualRate / 365, 365 / 12) - 1)
          : currentBalance * (annualRate / 12);

    if (months === 0 && monthlyPayment <= interest) return Infinity;

    const payment = Math.min(monthlyPayment, currentBalance + interest);
    currentBalance = Math.max(0, currentBalance - (payment - interest));
    months++;
  }

  return months >= maxMonths ? Infinity : months;
}

export function formatPayoffEstimate(months: number): string {
  if (!isFinite(months)) return 'Never (payment too low)';

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
  if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years} yr${years !== 1 ? 's' : ''}, ${remainingMonths} mo`;
}
