import Badge, { BadgeColor } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type SectionStatus = 'complete' | 'in-progress' | 'not-started' | 'error' | 'optional';

interface SectionHeaderProps {
  className?: string;
  title: string | React.ReactNode;
  desc?: string | React.ReactNode;
  status?: SectionStatus;
}

export default function SectionHeader({ className, title, desc, status }: SectionHeaderProps) {
  let badgeColor: BadgeColor, badgeText;
  switch (status) {
    case 'complete':
      badgeColor = 'green';
      badgeText = 'Complete';
      break;
    case 'in-progress':
      badgeColor = 'yellow';
      badgeText = 'In Progress';
      break;
    case 'not-started':
      badgeColor = 'gray';
      badgeText = 'Not Started';
      break;
    case 'error':
      badgeColor = 'red';
      badgeText = 'Error';
      break;
    case 'optional':
      badgeColor = 'gray';
      badgeText = 'Optional';
      break;
    default:
      badgeColor = 'gray';
      badgeText = 'Undefined';
      break;
  }

  const headlineComponent = (
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
      {status && <Badge color={badgeColor} text={badgeText} />}
    </div>
  );
  const descComponent = desc && <p className="text-muted-foreground mt-1 text-base">{desc}</p>;

  return (
    <div className={cn('mx-2', className)}>
      {headlineComponent}
      {descComponent}
    </div>
  );
}
