import { cn } from '@/lib/utils';

interface DataListEmptyStateButtonProps {
  onClick: () => void;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
  >;
  buttonText: string;
  className?: string;
  disabled?: boolean;
}

export default function DataListEmptyStateButton({
  onClick,
  icon: Icon,
  buttonText,
  className,
  disabled = false,
}: DataListEmptyStateButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'focus-outline relative block w-full grow rounded-lg border-2 border-dashed border-stone-300 p-4 text-center hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:hover:border-white/25',
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon aria-hidden="true" className="text-primary mx-auto size-12" />
      <span className="mt-2 block text-sm font-semibold text-stone-900 dark:text-white">{buttonText}</span>
    </button>
  );
}
