import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "my-4 overflow-hidden bg-gray-100 shadow-sm sm:rounded-lg dark:bg-zinc-900",
        className ?? ""
      )}
    >
      <div className="px-4 py-5 sm:p-6">{children}</div>
    </div>
  );
}
