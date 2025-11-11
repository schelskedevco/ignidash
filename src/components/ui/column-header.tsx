import { cn } from '@/lib/utils';

interface ColumnHeaderProps {
  title: string | React.ReactNode;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
  >;
  iconButton: React.ReactNode;
  className?: string;
}

export default function ColumnHeader({ title, icon: Icon, iconButton, className }: ColumnHeaderProps) {
  return (
    <div
      className={cn(
        'border-border/50 from-emphasized-background to-background fixed top-0 z-10 -mx-2 border-b bg-gradient-to-r py-4 sm:-mx-3 lg:-mx-4',
        className
      )}
    >
      <div className="mx-4 flex items-center justify-between sm:mx-6 lg:mx-8">
        <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight lowercase">
          <Icon className="text-primary h-8 w-8" aria-hidden="true" />
          {title}
        </h2>
        {iconButton}
      </div>
    </div>
  );
}
