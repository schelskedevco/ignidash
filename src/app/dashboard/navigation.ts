import {
  BoltIcon,
  ChartBarIcon,
  LightBulbIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & {
      title?: string;
      titleId?: string;
    } & React.RefAttributes<SVGSVGElement>
  >;
  current: boolean;
}

export const navigationItems: Omit<NavigationItem, "current">[] = [
  { name: "Quick Plan", href: "/dashboard/quick-plan", icon: BoltIcon },
  {
    name: "Deep Dive",
    href: "/dashboard/deep-dive",
    icon: MagnifyingGlassIcon,
  },
  { name: "Insights", href: "/dashboard/insights", icon: LightBulbIcon },
  { name: "Explore", href: "/dashboard/explore", icon: ChartBarIcon },
  { name: "Copilot", href: "/dashboard/copilot", icon: SparklesIcon },
];

export function getNavigation(currentPath: string): NavigationItem[] {
  return navigationItems.map((item) => ({
    ...item,
    current: currentPath === item.href,
  }));
}

export function getCurrentPageTitle(currentPath: string): string {
  const item = navigationItems.find((item) => item.href === currentPath);
  return item?.name || "Dashboard";
}

export function getCurrentPageIcon(
  currentPath: string
): NavigationItem["icon"] {
  const item = navigationItems.find((item) => item.href === currentPath);
  return item?.icon || BoltIcon;
}

// Deprecated: Use getNavigation instead
export const navigation: NavigationItem[] = [
  {
    name: "Quick Plan",
    href: "/dashboard/quick-plan",
    icon: BoltIcon,
    current: true,
  },
  {
    name: "Deep Dive",
    href: "/dashboard/deep-dive",
    icon: MagnifyingGlassIcon,
    current: false,
  },
  {
    name: "Insights",
    href: "/dashboard/insights",
    icon: LightBulbIcon,
    current: false,
  },
  {
    name: "Explore",
    href: "/dashboard/explore",
    icon: ChartBarIcon,
    current: false,
  },
  {
    name: "Copilot",
    href: "/dashboard/copilot",
    icon: SparklesIcon,
    current: false,
  },
];
