'use client';

type SurfaceColor = 'default' | 'emphasized';

interface IconButtonProps {
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
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
      className={`focus-outline border-border rounded-full border p-2 shadow-md ${hoverClass}`}
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}
