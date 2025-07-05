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

export const navigation: NavigationItem[] = [
  { name: "Quick Plan", href: "#", icon: BoltIcon, current: true },
  { name: "Deep Dive", href: "#", icon: MagnifyingGlassIcon, current: false },
  { name: "Insights", href: "#", icon: LightBulbIcon, current: false },
  { name: "Explore", href: "#", icon: ChartBarIcon, current: false },
  { name: "Copilot", href: "#", icon: SparklesIcon, current: false },
];
