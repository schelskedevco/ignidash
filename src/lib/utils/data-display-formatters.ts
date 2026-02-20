import { formatNumber } from '@/lib/utils';
import { formatCompactCurrency } from '@/lib/utils/format-currency';
import type { TimePoint, Growth, Frequency } from '@/lib/schemas/inputs/income-expenses-shared-schemas';
import type { IncomeType } from '@/lib/schemas/inputs/income-form-schema';
import type { KeyMetrics } from '@/lib/types/key-metrics';

export const timeFrameForDisplay = (startTimePoint: TimePoint, endTimePoint?: TimePoint) => {
  function labelFromType(tp: TimePoint) {
    switch (tp.type) {
      case 'now':
        return 'Now';
      case 'atRetirement':
        return 'Retirement';
      case 'atLifeExpectancy':
        return 'Life Expectancy';
      case 'customDate': {
        const month = tp.month;
        const year = tp.year;
        if (month !== undefined && year !== undefined) {
          const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
          return formatter.format(new Date(year, month - 1));
        }
        return 'Custom Date';
      }
      case 'customAge': {
        if (tp.age !== undefined) return `Age ${tp.age}`;
        return 'Custom Age';
      }
    }
  }

  const startLabel = labelFromType(startTimePoint);
  const endLabel = endTimePoint ? labelFromType(endTimePoint) : undefined;

  return endLabel ? `${startLabel} → ${endLabel}` : startLabel;
};

export const physicalAssetTimeFrameForDisplay = (startTimePoint: TimePoint, endTimePoint?: TimePoint) => {
  function labelFromType(tp: TimePoint) {
    switch (tp.type) {
      case 'now':
        return 'Already Owned';
      case 'atRetirement':
        return 'Retirement';
      case 'atLifeExpectancy':
        return 'Never Sold';
      case 'customDate': {
        const month = tp.month;
        const year = tp.year;
        if (month !== undefined && year !== undefined) {
          const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });
          return formatter.format(new Date(year, month - 1));
        }
        return 'Custom Date';
      }
      case 'customAge': {
        if (tp.age !== undefined) return `Age ${tp.age}`;
        return 'Custom Age';
      }
    }
  }

  const startLabel = labelFromType(startTimePoint);
  const endLabel = endTimePoint ? labelFromType(endTimePoint) : undefined;

  return endLabel ? `${startLabel} → ${endLabel}` : startLabel;
};

/**
 * Compare two TimePoint values for sorting (present → future).
 * Order: now < customDate/customAge < atRetirement < atLifeExpectancy.
 * Within customDate, sort by year then month. Within customAge, sort by age.
 */
export function compareTimePoints(a: TimePoint, b: TimePoint): number {
  const rank: Record<TimePoint['type'], number> = {
    now: 0,
    customDate: 1,
    customAge: 1,
    atRetirement: 2,
    atLifeExpectancy: 3,
  };

  const diff = rank[a.type] - rank[b.type];
  if (diff !== 0) return diff;

  // Sub-sort within same rank
  if (a.type === 'customDate' && b.type === 'customDate') {
    const yearDiff = (a.year ?? 0) - (b.year ?? 0);
    if (yearDiff !== 0) return yearDiff;
    return (a.month ?? 0) - (b.month ?? 0);
  }

  if (a.type === 'customAge' && b.type === 'customAge') {
    return (a.age ?? 0) - (b.age ?? 0);
  }

  // customDate before customAge when at the same rank
  if (a.type === 'customDate' && b.type === 'customAge') return -1;
  if (a.type === 'customAge' && b.type === 'customDate') return 1;

  return 0;
}

export const growthForDisplay = (growthRate: Growth['growthRate'], growthLimit: Growth['growthLimit']) => {
  if (growthRate === undefined) return 'No Growth';

  const rate = formatNumber(growthRate, 1);
  if (growthLimit === undefined) return `Rate: ${rate}%, No Limit`;

  return `Rate: ${rate}%, Limit: ${formatCompactCurrency(growthLimit, 0)}`;
};

export const frequencyForDisplay = (frequency: Frequency) => {
  switch (frequency) {
    case 'yearly':
      return '/ yr';
    case 'oneTime':
      return 'one-time';
    case 'quarterly':
      return 'quarterly';
    case 'monthly':
      return '/ mo';
    case 'biweekly':
      return 'biweekly';
    case 'weekly':
      return '/ wk';
  }
};

export const maxBalanceForDisplay = (maxBalance: number | undefined) => {
  if (maxBalance === undefined) return 'Never';
  return `At Balance of ${formatCompactCurrency(maxBalance, 0)}`;
};

export const incomeTaxTreatmentForDisplay = (type: IncomeType, withholding: number | undefined) => {
  const typeLabels: Record<IncomeType, string> = {
    wage: 'Wage',
    exempt: 'Tax-Free',
    selfEmployment: 'Self-Employment',
    socialSecurity: 'Social Security',
    pension: 'Pension',
  };

  const typeLabel = typeLabels[type];

  if (withholding === undefined) {
    return typeLabel;
  }

  return `${typeLabel}, ${formatNumber(withholding, 0)}% Withheld`;
};

export const keyMetricsForDisplay = (keyMetrics: KeyMetrics) => {
  const {
    success,
    retirementAge,
    yearsToRetirement,
    bankruptcyAge,
    yearsToBankruptcy,
    portfolioAtRetirement,
    lifetimeTaxesAndPenalties,
    finalPortfolio,
    progressToRetirement,
    areValuesMeans,
  } = keyMetrics;

  const formatters = {
    success: (v: number) =>
      areValuesMeans ? `${formatNumber(v * 100, 1)}%` : v >= 0.99 ? 'Yes!' : v <= 0.01 ? 'No' : `${formatNumber(v * 100, 1)}%`,
    retirementAge: (v: number | null) => (v !== null ? `${formatNumber(v, 0)}` : '∞'),
    yearsToRetirement: (v: number | null) => (v !== null ? `${formatNumber(v, 0)}` : '∞'),
    bankruptcyAge: (v: number | null) => (v !== null ? `${formatNumber(v, 0)}` : '∞'),
    yearsToBankruptcy: (v: number | null) => (v !== null ? `${formatNumber(v, 0)}` : '∞'),
    portfolioAtRetirement: (v: number | null) => (v !== null ? `${formatCompactCurrency(v, 2)}` : 'N/A'),
    lifetimeTaxesAndPenalties: (v: number) => `${formatCompactCurrency(v, 2)}`,
    finalPortfolio: (v: number) => `${formatCompactCurrency(v, 2)}`,
    progressToRetirement: (v: number | null) => (v !== null ? `${formatNumber(v * 100, 1)}%` : 'N/A'),
  };

  return {
    successForDisplay: formatters.success(success),
    retirementAgeForDisplay: formatters.retirementAge(retirementAge),
    yearsToRetirementForDisplay: formatters.yearsToRetirement(yearsToRetirement),
    bankruptcyAgeForDisplay: formatters.bankruptcyAge(bankruptcyAge),
    yearsToBankruptcyForDisplay: formatters.yearsToBankruptcy(yearsToBankruptcy),
    portfolioAtRetirementForDisplay: formatters.portfolioAtRetirement(portfolioAtRetirement),
    lifetimeTaxesAndPenaltiesForDisplay: formatters.lifetimeTaxesAndPenalties(lifetimeTaxesAndPenalties),
    finalPortfolioForDisplay: formatters.finalPortfolio(finalPortfolio),
    progressToRetirementForDisplay: formatters.progressToRetirement(progressToRetirement),
  };
};
