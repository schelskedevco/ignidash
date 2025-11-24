import { LayoutDashboardIcon, ChartNoAxesCombinedIcon, Layers2Icon, ZapIcon, CircleQuestionMarkIcon, GemIcon } from 'lucide-react';
import { api } from '@/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
  >;
  current: boolean;
  disabled?: boolean;
}

export const useNavigationItems = () => {
  const m = useMutation(api.plans.getOrCreateDefaultPlan);

  useEffect(() => {
    async function createDefaultPlan() {
      await m({});
    }

    createDefaultPlan();
  }, [m]);
  const defaultPlanId = useQuery(api.plans.getDefaultPlanId);

  const pathname = usePathname();

  const simulatorItem = useMemo(() => {
    const href = defaultPlanId !== null ? `/dashboard/simulator/${defaultPlanId}` : '/dashboard/simulator';
    const disabled = defaultPlanId === null;
    return { name: 'Simulator', href, icon: ChartNoAxesCombinedIcon, current: isCurrentPath(pathname, `/dashboard/simulator`), disabled };
  }, [pathname, defaultPlanId]);

  return [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboardIcon, current: isCurrentPath(pathname, '/dashboard') },
    simulatorItem,
    { name: 'Compare', href: '/dashboard/compare', icon: Layers2Icon, current: isCurrentPath(pathname, '/dashboard/compare') },
    { name: 'Insights', href: '/dashboard/insights', icon: ZapIcon, current: isCurrentPath(pathname, '/dashboard/insights') },
  ];
};

export const useSecondaryNavigationItems = () => {
  return [
    { name: 'Help', href: '/help', icon: CircleQuestionMarkIcon, current: false },
    { name: 'Buy Pro', href: '/pricing', icon: GemIcon, current: false },
  ];
};

export const useCurrentPageTitle = (): string => {
  const currentPath = usePathname();
  const item = useNavigationItems().find((item) => isCurrentPath(item.href, currentPath));
  return item?.name || 'Dashboard';
};

export const useCurrentPageIcon = (): NavigationItem['icon'] => {
  const currentPath = usePathname();
  const item = useNavigationItems().find((item) => isCurrentPath(item.href, currentPath));
  return item?.icon || LayoutDashboardIcon;
};

const isCurrentPath = (currentPath: string, itemHref: string): boolean => {
  if (itemHref === '/dashboard') return currentPath === '/dashboard';
  return currentPath === itemHref || currentPath.startsWith(`${itemHref}/`);
};
