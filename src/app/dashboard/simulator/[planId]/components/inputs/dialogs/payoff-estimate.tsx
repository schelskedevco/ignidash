import { formatPayoffEstimate } from '@/lib/utils/payoff-estimator';
import { cn } from '@/lib/utils';

interface PayoffEstimateProps {
  months: number | null;
  className?: string;
}

export function PayoffEstimate({ months, className }: PayoffEstimateProps) {
  if (months === null) return null;

  return (
    <div className={cn('text-center text-sm/6 font-medium', className)}>
      <span className="text-muted-foreground mr-1 text-xs tracking-wide uppercase">
        <span className="underline underline-offset-2">Payoff Estimate</span>:
      </span>{' '}
      {formatPayoffEstimate(months)}
    </div>
  );
}
