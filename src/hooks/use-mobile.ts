import * as React from 'react';

const MOBILE_BREAKPOINT = 768;
const XSMALL_MOBILE_BREAKPOINT = 360;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}

export function useIsXSmallMobile() {
  const [isXSmallMobile, setIsXSmallMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${XSMALL_MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsXSmallMobile(window.innerWidth < XSMALL_MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsXSmallMobile(window.innerWidth < XSMALL_MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isXSmallMobile;
}
