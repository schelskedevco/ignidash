import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "bg-emphasized-background my-4 overflow-hidden rounded-lg shadow-sm",
        className ?? ""
      )}
    >
      <div className="px-4 py-5 sm:p-6">{children}</div>
    </div>
  );
}
