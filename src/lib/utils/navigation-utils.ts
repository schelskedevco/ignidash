import { navigationItems } from '../navigation';

const ALLOWED_REDIRECTS = ['/', '/settings', ...navigationItems.map((item) => item.href)];
const DEFAULT_REDIRECT = '/dashboard/quick-plan';

export function getSafeRedirect(redirectParam: string | null): string {
  if (redirectParam && ALLOWED_REDIRECTS.includes(redirectParam)) {
    return redirectParam;
  }

  return DEFAULT_REDIRECT;
}
