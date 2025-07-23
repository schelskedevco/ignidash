import Badge, { BadgeColor } from '@/components/ui/badge';

export type SectionStatus = 'complete' | 'in-progress' | 'not-started' | 'error' | 'optional';

interface SectionHeaderProps {
  title: string | React.ReactNode;
  desc: string | React.ReactNode;
  status?: SectionStatus;
}

export default function SectionHeader({ title, desc, status }: SectionHeaderProps) {
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

  return (
    <div className="ml-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        {status && <Badge color={badgeColor} text={badgeText} />}
      </div>
      <p className="text-muted-foreground mt-2 text-base">{desc}</p>
    </div>
  );
}
