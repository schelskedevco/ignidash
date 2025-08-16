'use client';

import { cn } from '@/lib/utils';

type SurfaceColor = 'default' | 'emphasized';

interface IconButtonProps {
  className?: string;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
  >;
  label: string;
  onClick?: () => void;
  surfaceColor?: SurfaceColor;
}

export default function IconButton({ className, icon: Icon, label, onClick, surfaceColor = 'default' }: IconButtonProps) {
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
      className={cn(`ring-border focus-outline rounded-full p-2 transition-transform hover:scale-105 hover:ring ${hoverClass}`, className)}
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}
