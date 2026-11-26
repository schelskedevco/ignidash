import { cn } from '@/lib/utils';

interface MainAreaProps {
  children?: React.ReactNode;
  hasSecondaryColumn?: boolean;
}

export default function MainArea({ children, hasSecondaryColumn = true }: MainAreaProps) {
  return (
    <main
      tabIndex={-1}
      // Read by withScrollPreservation (src/lib/utils/scroll-preservation.ts).
      data-scroll-container
      className={cn(
        'h-full min-w-80 group-data-[animating=true]/sidebar:transition-[padding-left] group-data-[animating=true]/sidebar:duration-200 group-data-[animating=true]/sidebar:ease-in-out focus:outline-none motion-reduce:transition-none lg:pl-72 group-data-[state=collapsed]/sidebar:lg:pl-16 xl:fixed xl:inset-0 xl:overflow-y-auto',
        { 'xl:left-96': hasSecondaryColumn }
      )}
    >
      <div className="@container h-full">
        <div className="h-full px-2 sm:px-3 lg:px-4">{children}</div>
      </div>
    </main>
  );
}
