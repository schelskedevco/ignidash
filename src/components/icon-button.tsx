type SurfaceColor = "default" | "emphasized";

interface IconButtonProps {
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
      title?: string;
      titleId?: string;
    } & React.RefAttributes<SVGSVGElement>
  >;
  label: string;
  onClick?: () => void;
  surfaceColor?: SurfaceColor;
}

export function IconButton({
  icon: Icon,
  label,
  onClick,
  surfaceColor = "default",
}: IconButtonProps) {
  const hoverClasses =
    surfaceColor === "emphasized"
      ? "hover:bg-background"
      : "hover:bg-emphasized-background";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`focus-visible:outline-foreground rounded-full p-2 ${hoverClasses} focus-visible:outline-2 focus-visible:outline-offset-2`}
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}
