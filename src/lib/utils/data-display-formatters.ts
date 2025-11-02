import { formatNumber } from '@/lib/utils';
import type { TimePoint, Growth, Frequency } from '@/lib/schemas/income-expenses-shared-schemas';

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

export const growthForDisplay = (growthRate: Growth['growthRate'], growthLimit: Growth['growthLimit']) => {
  if (growthRate === undefined) return 'No Growth';

  const rate = formatNumber(growthRate, 1);
  if (growthLimit === undefined) return `Rate: ${rate}%, No Limit`;

  return `Rate: ${rate}%, Limit: ${formatNumber(growthLimit, 0, '$')}`;
};

export const frequencyForDisplay = (frequency: Frequency) => {
  switch (frequency) {
    case 'yearly':
      return 'yearly';
    case 'oneTime':
      return 'one-time';
    case 'quarterly':
      return 'quarterly';
    case 'monthly':
      return 'monthly';
    case 'biweekly':
      return 'biweekly';
    case 'weekly':
      return 'weekly';
  }
};
