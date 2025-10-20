import Card from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  name: string;
  stat: string | number;
  statContext?: string;
  className?: string;
  statClassName?: string;
}

export default function MetricsCard({ name, stat, statContext, className, statClassName }: MetricsCardProps) {
  return (
    <Card className={cn('my-0 text-center sm:text-left', className)}>
      <dt className="text-muted-foreground truncate text-sm font-medium">{name}</dt>
      <dd className="text-foreground mt-1 sm:flex sm:items-center sm:gap-2">
        <div className="text-3xl font-semibold tracking-tight">
          <span className={statClassName}>{stat}</span>
          <span className="text-muted-foreground ml-1 text-sm">{statContext}</span>
        </div>
        {/* <div className="hidden sm:block">{statWidget}</div> */}
      </dd>
    </Card>
  );
}
