import { ChevronRightIcon } from "@heroicons/react/24/outline";

interface RightChevronButtonProps {
  title: string;
  onClick?: () => void;
  className?: string;
}

export function RightChevronButton({
  title,
  onClick,
  className = "",
}: RightChevronButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bg-emphasized-background text-foreground hover:bg-background hover:ring-foreground/10 focus-visible:outline-foreground flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm shadow-sm hover:ring-1 hover:ring-inset focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-6 ${className}`}
    >
      <span>{title}</span>
      <ChevronRightIcon className="h-5 w-5" />
    </button>
  );
}
