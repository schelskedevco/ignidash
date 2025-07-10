import { ChevronRightIcon } from "@heroicons/react/24/outline";

interface RightChevronButtonProps {
  title: string;
  onClick?: () => void;
  className?: string;
  leftIcon?: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
      title?: string;
      titleId?: string;
    } & React.RefAttributes<SVGSVGElement>
  >;
}

export function RightChevronButton({
  title,
  onClick,
  className = "",
  leftIcon,
}: RightChevronButtonProps) {
  const LeftIcon = leftIcon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-emphasized-background text-foreground hover:bg-background hover:ring-foreground/10 focus-visible:outline-foreground flex w-full items-center justify-between rounded-lg p-2.5 text-sm shadow-sm hover:ring-1 hover:ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 ${className}`}
    >
      <div className="flex items-center gap-2">
        {LeftIcon && <LeftIcon className="h-5 w-5" aria-hidden="true" />}
        <span>{title}</span>
      </div>
      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
