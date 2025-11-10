import { LayoutDashboardIcon, ChartNoAxesCombinedIcon, Layers2Icon, ZapIcon, CircleQuestionMarkIcon, GemIcon } from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
  >;
  current: boolean;
}

export const navigationItems: Omit<NavigationItem, 'current'>[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon },
  { name: 'Simulator', href: '/dashboard/simulator', icon: ChartNoAxesCombinedIcon },
  { name: 'Compare', href: '/dashboard/compare', icon: Layers2Icon },
  { name: 'Insights', href: '/dashboard/insights', icon: ZapIcon },
];

export const secondaryNavigationItems: Omit<NavigationItem, 'current'>[] = [
  { name: 'Help', href: '/help', icon: CircleQuestionMarkIcon },
  { name: 'Buy Pro', href: '/pricing', icon: GemIcon },
];

export function getNavigation(currentPath: string): NavigationItem[] {
  return navigationItems.map((item) => ({
    ...item,
    current: isCurrentPath(currentPath, item.href),
  }));
}

export function getSecondaryNavigation(): NavigationItem[] {
  return secondaryNavigationItems.map((item) => ({
    ...item,
    current: false,
  }));
}

export function getCurrentPageTitle(currentPath: string): string {
  const item = navigationItems.find((item) => isCurrentPath(item.href, currentPath));
  return item?.name || 'Dashboard';
}

export function getCurrentPageIcon(currentPath: string): NavigationItem['icon'] {
  const item = navigationItems.find((item) => isCurrentPath(item.href, currentPath));
  return item?.icon || LayoutDashboardIcon;
}

function isCurrentPath(currentPath: string, itemHref: string): boolean {
  if (itemHref === '/dashboard') return currentPath === '/dashboard';
  return currentPath === itemHref || currentPath.startsWith(`${itemHref}/`);
}
