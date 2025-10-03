import { cn } from '@/lib/utils';

interface SectionContainerProps {
  showBottomBorder: boolean;
  children: React.ReactNode;
  location?: 'default' | 'drawer';
  className?: string;
}

export default function SectionContainer({ children, showBottomBorder, location = 'default', className }: SectionContainerProps) {
  let outerXMarginClass = '';
  let innerXMarginClass = '';

  switch (location) {
    case 'drawer':
      outerXMarginClass = '-mx-2 sm:-mx-3';
      innerXMarginClass = 'mx-2 sm:mx-3';
      break;
    default:
      outerXMarginClass = '-mx-2 sm:-mx-3 lg:-mx-4';
      innerXMarginClass = 'mx-2 sm:mx-3 lg:mx-4';
      break;
  }

  const borderClass = showBottomBorder ? 'border-border/50 border-b' : '';
  return (
    <div className={cn('py-5', borderClass, outerXMarginClass, className)}>
      <div className={innerXMarginClass}>{children}</div>
    </div>
  );
}
