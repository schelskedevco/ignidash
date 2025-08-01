import Card from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import { FixedReturnsAnalysis } from '@/lib/stores/quick-plan-store';

interface ResultsMetricsProps {
  fireAnalysis: FixedReturnsAnalysis;
}

export default function ResultsMetrics({ fireAnalysis }: ResultsMetricsProps) {
  const stats = [
    { name: 'FIRE Age', stat: fireAnalysis.fireAge, fractionDigits: 1 },
    { name: 'Years to FIRE', stat: fireAnalysis.yearsToFIRE, fractionDigits: 1 },
    { name: 'Required Portfolio Size', stat: fireAnalysis.requiredPortfolio, fractionDigits: 2 },
  ];

  return (
    <>
      <dl className="grid grid-cols-1 sm:grid-cols-3 sm:gap-5">
        {stats.map((item) => (
          <Card key={item.name} className="text-center sm:text-left">
            <dt className="text-muted-foreground truncate text-sm font-medium">{item.name}</dt>
            <dd className="text-foreground mt-1 text-3xl font-semibold tracking-tight">
              {item.stat ? formatNumber(item.stat, item.fractionDigits) : 'N/A'}
            </dd>
          </Card>
        ))}
      </dl>
    </>
  );
}
