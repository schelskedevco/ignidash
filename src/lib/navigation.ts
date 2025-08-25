import { HouseIcon, LandmarkIcon, ChartNoAxesCombinedIcon, Layers2Icon, ZapIcon, CircleQuestionMarkIcon } from 'lucide-react';

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
  >;
  current: boolean;
}

export const navigationItems: Omit<NavigationItem, 'current'>[] = [
  { name: 'Dashboard', href: '/dashboard', icon: HouseIcon },
  { name: 'Portfolio', href: '/dashboard/portfolio', icon: LandmarkIcon },
  { name: 'Simulator', href: '/dashboard/quick-plan', icon: ChartNoAxesCombinedIcon },
  { name: 'Compare', href: '/dashboard/compare', icon: Layers2Icon },
  { name: 'Insights', href: '/dashboard/insights', icon: ZapIcon },
];

export const secondaryNavigationItems: Omit<NavigationItem, 'current'>[] = [{ name: 'Help', href: '/help', icon: CircleQuestionMarkIcon }];

export function getNavigation(currentPath: string): NavigationItem[] {
  return navigationItems.map((item) => ({
    ...item,
    current: currentPath === item.href,
  }));
}

export function getSecondaryNavigation(): NavigationItem[] {
  return secondaryNavigationItems.map((item) => ({
    ...item,
    current: false,
  }));
}

export function getCurrentPageTitle(currentPath: string): string {
  const item = navigationItems.find((item) => item.href === currentPath);
  return item?.name || 'Dashboard';
}

export function getCurrentPageIcon(currentPath: string): NavigationItem['icon'] {
  const item = navigationItems.find((item) => item.href === currentPath);
  return item?.icon || HouseIcon;
}
