import { BoltIcon, RocketLaunchIcon, HomeIcon } from '@heroicons/react/24/outline';

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
  >;
  current: boolean;
}

export const navigationItems: Omit<NavigationItem, 'current'>[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Quick Plan', href: '/dashboard/quick-plan', icon: BoltIcon },
  { name: 'Pro', href: '/dashboard/pro', icon: RocketLaunchIcon },
];

export function getNavigation(currentPath: string): NavigationItem[] {
  return navigationItems.map((item) => ({
    ...item,
    current: currentPath === item.href,
  }));
}

export function getCurrentPageTitle(currentPath: string): string {
  const item = navigationItems.find((item) => item.href === currentPath);
  return item?.name || 'Dashboard';
}

export function getCurrentPageIcon(currentPath: string): NavigationItem['icon'] {
  const item = navigationItems.find((item) => item.href === currentPath);
  return item?.icon || BoltIcon;
}
