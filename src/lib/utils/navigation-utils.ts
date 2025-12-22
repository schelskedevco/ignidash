const ALLOWED_REDIRECTS = [
  '/',
  '/settings',
  '/dashboard',
  '/dashboard/simulator',
  '/dashboard/compare',
  '/dashboard/insights',
  '/pricing',
  '/success',
  '/help',
  '/terms',
  '/privacy',
  '/about',
];
const ALLOWED_REDIRECT_PREFIXES = ['/dashboard/simulator/'];
const DEFAULT_REDIRECT = '/dashboard';

export function getSafeRedirect(redirectParam: string | null): string {
  if (!redirectParam) return DEFAULT_REDIRECT;
  if (!redirectParam.startsWith('/')) return DEFAULT_REDIRECT;
  if (ALLOWED_REDIRECTS.includes(redirectParam)) return redirectParam;

  if (ALLOWED_REDIRECT_PREFIXES.some((prefix) => redirectParam.startsWith(prefix))) {
    const afterPrefix = redirectParam.substring('/dashboard/simulator/'.length);
    if (afterPrefix && !afterPrefix.includes('/')) return redirectParam;
  }

  return DEFAULT_REDIRECT;
}
