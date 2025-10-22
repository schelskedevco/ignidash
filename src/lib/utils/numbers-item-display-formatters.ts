import { formatNumber } from '@/lib/utils';
import type { TimePoint, Growth, Frequency } from '@/lib/schemas/income-expenses-shared-schemas';

export const timeFrameForDisplay = (startTimePoint: TimePoint, endTimePoint?: TimePoint) => {
  function labelFromType(type: TimePoint['type']) {
    switch (type) {
      case 'now':
        return 'Now';
      case 'atRetirement':
        return 'Retirement';
      case 'atLifeExpectancy':
        return 'Life Expectancy';
      case 'customDate':
        return 'Custom Date';
      case 'customAge':
        return 'Custom Age';
    }
  }

  const startLabel = labelFromType(startTimePoint.type);
  const endLabel = endTimePoint ? labelFromType(endTimePoint.type) : undefined;

  if (!endLabel) return startLabel;
  return `${startLabel} to ${endLabel}`;
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
