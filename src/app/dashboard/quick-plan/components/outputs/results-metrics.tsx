import Card from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

interface ResultsMetricsProps {
  simulationMode: 'fixedReturns' | 'monteCarlo' | 'historicalBacktest';
  fireAge: number | null | undefined;
  yearsToFIRE: number | null | undefined;
  requiredPortfolio: number | null | undefined;
}

export default function ResultsMetrics({ simulationMode, fireAge, yearsToFIRE, requiredPortfolio }: ResultsMetricsProps) {
  let stochasticPrefix;
  switch (simulationMode) {
    case 'fixedReturns':
      stochasticPrefix = '';
      break;
    case 'monteCarlo':
    case 'historicalBacktest':
      stochasticPrefix = 'Median ';
      break;
  }

  const stats = [
    { name: `${stochasticPrefix}FIRE Age`, stat: fireAge, fractionDigits: 1 },
    { name: `${stochasticPrefix}Years to FIRE`, stat: yearsToFIRE, fractionDigits: 1 },
    { name: 'Required Portfolio Size', stat: requiredPortfolio, fractionDigits: 2 },
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
