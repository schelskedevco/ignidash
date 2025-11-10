import Card from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  name: string;
  stat: string | number;
  statContext?: string;
  statWidget?: React.ReactNode;
  className?: string;
  statClassName?: string;
}

export default function MetricsCard({ name, stat, statContext, statWidget, className, statClassName }: MetricsCardProps) {
  return (
    <Card className={cn('my-0 text-center sm:text-left', className)}>
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="flex-1">
          <dt className="text-muted-foreground truncate text-sm font-medium">{name}</dt>
          <dd className="text-foreground mt-1">
            <div className="text-3xl font-semibold tracking-tight">
              <span className={statClassName}>{stat}</span>
              <span className="text-muted-foreground ml-1 text-sm">{statContext}</span>
            </div>
          </dd>
        </div>
        <div className="hidden sm:block">{statWidget}</div>
      </div>
    </Card>
  );
}
