type SurfaceColor = 'default' | 'emphasized';

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

export default function IconButton({ icon: Icon, label, onClick, surfaceColor = 'default' }: IconButtonProps) {
  let hoverClass;
  switch (surfaceColor) {
    case 'default':
      hoverClass = 'hover:bg-emphasized-background';
      break;
    case 'emphasized':
      hoverClass = 'hover:bg-background';
      break;
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`focus-outline rounded-full p-2 ${hoverClass} border-border border`}
    >
      <Icon aria-hidden="true" className="h-5 w-5" />
    </button>
  );
}
