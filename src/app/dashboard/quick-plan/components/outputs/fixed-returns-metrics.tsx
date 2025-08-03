import Card from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';
import { FixedReturnsAnalysis } from '@/lib/stores/quick-plan-store';

interface ResultsMetricsProps {
  fireAnalysis: FixedReturnsAnalysis;
}

export default function ResultsMetrics({ fireAnalysis }: ResultsMetricsProps) {
  const fireAgeCard = (
    <Card className="text-center sm:text-left">
      <dt className="text-muted-foreground truncate text-sm font-medium">FIRE Age</dt>
      <dd className="text-foreground mt-1 text-3xl font-semibold tracking-tight">
        {fireAnalysis.fireAge !== null ? `${formatNumber(fireAnalysis.fireAge, 0)}` : '∞'}
      </dd>
    </Card>
  );
  const requiredPortfolioCard = (
    <Card className="text-center sm:text-left">
      <dt className="text-muted-foreground truncate text-sm font-medium">Required Portfolio Size</dt>
      <dd className="text-foreground mt-1 text-3xl font-semibold tracking-tight">
        {`$${formatNumber(fireAnalysis.requiredPortfolio, 2)}`}
      </dd>
    </Card>
  );
  const finalPortfolioCard = (
    <Card className="text-center sm:text-left">
      <dt className="text-muted-foreground truncate text-sm font-medium">Final Portfolio Size</dt>
      <dd className="text-foreground mt-1 text-3xl font-semibold tracking-tight">{`$${formatNumber(fireAnalysis.finalPortfolio, 2)}`}</dd>
    </Card>
  );

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-3 sm:gap-5">
      {fireAgeCard}
      {requiredPortfolioCard}
      {finalPortfolioCard}
    </dl>
  );
}
