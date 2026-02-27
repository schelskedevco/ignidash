import type { TimePoint } from '@/lib/schemas/inputs/income-expenses-shared-schemas';

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
