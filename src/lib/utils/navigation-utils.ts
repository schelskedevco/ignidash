const ALLOWED_REDIRECTS = ['/', '/settings', '/dashboard', '/dashboard/simulator', '/dashboard/compare', '/dashboard/insights'];
const DEFAULT_REDIRECT = '/dashboard';

export function getSafeRedirect(redirectParam: string | null): string {
  if (redirectParam && ALLOWED_REDIRECTS.includes(redirectParam)) {
    return redirectParam;
  }

  return DEFAULT_REDIRECT;
}
