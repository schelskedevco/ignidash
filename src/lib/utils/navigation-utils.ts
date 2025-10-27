const ALLOWED_REDIRECTS = ['/', '/dashboard', '/dashboard/quick-plan', '/settings'];
const DEFAULT_REDIRECT = '/dashboard/quick-plan';

export function getSafeRedirect(redirectParam: string | null): string {
  if (redirectParam && ALLOWED_REDIRECTS.includes(redirectParam)) {
    return redirectParam;
  }

  return DEFAULT_REDIRECT;
}
