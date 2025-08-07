interface SectionContainerProps {
  showBottomBorder: boolean;
  children: React.ReactNode;
  location?: 'default' | 'drawer';
}

export default function SectionContainer({ children, showBottomBorder, location = 'default' }: SectionContainerProps) {
  let outerXMarginClass = '';
  let innerXMarginClass = '';

  switch (location) {
    case 'drawer':
      outerXMarginClass = '-mx-4 sm:-mx-6';
      innerXMarginClass = 'mx-4 sm:mx-6';
      break;
    default:
      outerXMarginClass = '-mx-4 sm:-mx-6 lg:-mx-8';
      innerXMarginClass = 'mx-4 sm:mx-6 lg:mx-8';
      break;
  }

  const borderClass = showBottomBorder ? 'border-border border-b' : '';
  return (
    <div className={`mb-5 pb-5 ${borderClass} ${outerXMarginClass}`}>
      <div className={innerXMarginClass}>{children}</div>
    </div>
  );
}
