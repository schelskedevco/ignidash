'use client';

import Card from '@/components/ui/card';
import { useFIREAnalysis } from '@/lib/stores/quick-plan-store';
import { formatNumber } from '@/lib/utils';

export default function ResultsMetrics() {
  const fireAnalysis = useFIREAnalysis();

  const stats = [
    { name: 'FIRE Age', stat: fireAnalysis.fireAge },
    { name: 'Years to FIRE', stat: fireAnalysis.yearsToFIRE },
    { name: 'Required Portfolio Size', stat: fireAnalysis.requiredPortfolio },
  ];

  return (
    <>
      <dl className="grid grid-cols-1 sm:grid-cols-3 sm:gap-5">
        {stats.map((item) => (
          <Card key={item.name} className="text-center sm:text-left">
            <dt className="text-muted-foreground truncate text-sm font-medium">{item.name}</dt>
            <dd className="text-foreground mt-1 text-3xl font-semibold tracking-tight">{item.stat ? formatNumber(item.stat) : 'N/A'}</dd>
          </Card>
        ))}
      </dl>
    </>
  );
}
