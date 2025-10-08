import Card from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  name: string;
  stat: string | number;
  statContext?: string;
  className?: string;
}

export default function MetricsCard({ name, stat, statContext, className }: MetricsCardProps) {
  return (
    <Card className={cn('my-0 text-center sm:text-left', className)}>
      <dt className="text-muted-foreground truncate text-sm font-medium">{name}</dt>
      <dd className="text-foreground mt-1 text-3xl font-semibold tracking-tight">
        <span>{stat}</span>
        <span className="text-muted-foreground ml-1 text-sm">{statContext}</span>
        {/* <svg viewBox="0 0 18 18" aria-hidden="true" className="inline size-4.5 fill-green-500 dark:fill-green-400">
          <circle r={9} cx={9} cy={9} />
        </svg> */}
      </dd>
    </Card>
  );
}
