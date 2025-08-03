import Card from '@/components/ui/card';

interface MetricsCardProps {
  name: string;
  stat: string | number;
}

export default function MetricsCard({ name, stat }: MetricsCardProps) {
  return (
    <Card className="my-0 text-center sm:text-left">
      <dt className="text-muted-foreground truncate text-sm font-medium">{name}</dt>
      <dd className="text-foreground mt-1 text-3xl font-semibold tracking-tight">{stat}</dd>
    </Card>
  );
}
