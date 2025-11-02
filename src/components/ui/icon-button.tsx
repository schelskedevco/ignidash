'use client';

import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

type SurfaceColor = 'default' | 'emphasized';

interface IconButtonProps {
  className?: string;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
  >;
  iconClassName?: string;
  label: string;
  onClick?: () => void;
  surfaceColor?: SurfaceColor;
  isDisabled?: boolean;
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
}

export default function IconButton({
  className,
  icon: Icon,
  iconClassName,
  label,
  onClick,
  surfaceColor = 'default',
  isDisabled = false,
  tooltipSide,
}: IconButtonProps) {
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
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          disabled={isDisabled}
          className={cn('ring-border focus-outline rounded-full p-2 transition-transform hover:ring', className, hoverClass, {
            'cursor-not-allowed opacity-50': isDisabled,
          })}
        >
          <Icon aria-hidden="true" className={cn('size-5', iconClassName)} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  );
}
