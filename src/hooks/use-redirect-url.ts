import { useSearchParams } from 'next/navigation';

import { getSafeRedirect } from '@/lib/utils/navigation-utils';

export const useRedirectUrl = () => {
  const searchParams = useSearchParams();

  const unsafeRedirect = searchParams.get('redirect');
  const safeRedirect = getSafeRedirect(unsafeRedirect);

  const buildRedirectUrl = (url: string): string => {
    if (!unsafeRedirect) return url;

    const [pathname, search] = url.split('?');
    const params = new URLSearchParams(search);
    params.set('redirect', safeRedirect);

    return `${pathname}?${params.toString()}`;
  };

  return { buildRedirectUrl, unsafeRedirect, safeRedirect };
};
