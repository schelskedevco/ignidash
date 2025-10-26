import { cn } from '@/lib/utils';

interface MainAreaProps {
  children?: React.ReactNode;
  hasSecondaryColumn?: boolean;
}

export default function MainArea({ children, hasSecondaryColumn = true }: MainAreaProps) {
  return (
    <main
      tabIndex={-1}
      className={cn(
        'h-full min-w-80 focus:outline-none lg:pl-72 group-data-[state=collapsed]/sidebar:lg:pl-16 xl:fixed xl:inset-0 xl:overflow-y-auto',
        { 'xl:left-96': hasSecondaryColumn }
      )}
    >
      <div className="@container h-full">
        <div className="h-full px-2 sm:px-3 lg:px-4">{children}</div>
      </div>
    </main>
  );
}
