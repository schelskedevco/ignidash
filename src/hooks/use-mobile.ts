import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;
const XSMALL_MOBILE_BREAKPOINT = 360;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}

export function useIsXSmallMobile() {
  const [isXSmallMobile, setIsXSmallMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${XSMALL_MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsXSmallMobile(window.innerWidth < XSMALL_MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsXSmallMobile(window.innerWidth < XSMALL_MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isXSmallMobile;
}
