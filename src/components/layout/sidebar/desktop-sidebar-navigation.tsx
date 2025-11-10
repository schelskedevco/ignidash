import { useNavigationItems, useSecondaryNavigationItems } from '@/hooks/use-sidebar-navigation';
import { cn } from '@/lib/utils';

import SidebarLink from './sidebar-link';

export default function DesktopSidebarNavigation() {
  const navigation = useNavigationItems();

  return (
    <ul role="list" className="space-y-1.5">
      {navigation.map((item) => (
        <li key={item.name}>
          <SidebarLink href={item.href} current={item.current} tooltipLabel={item.name}>
            <div className="p-2">
              <item.icon aria-hidden="true" className="size-6 shrink-0" />
            </div>
            <span className="ml-1 inline group-data-[state=collapsed]/sidebar:hidden">{item.name}</span>
          </SidebarLink>
        </li>
      ))}
    </ul>
  );
}

export function DesktopSidebarSecondaryNavigation() {
  const secondaryNavigation = useSecondaryNavigationItems();

  return (
    <>
      {secondaryNavigation.map((item) => (
        <li key={item.name}>
          <SidebarLink href={item.href} current={item.current} tooltipLabel={item.name}>
            <div className="p-2">
              <item.icon aria-hidden="true" className={cn('size-6 shrink-0', { 'text-primary': item.href === '/pricing' })} />
            </div>
            <span className="ml-1 inline group-data-[state=collapsed]/sidebar:hidden">{item.name}</span>
          </SidebarLink>
        </li>
      ))}
    </>
  );
}
