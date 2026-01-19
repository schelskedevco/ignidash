'use client';

import { useNavigationItems, useSecondaryNavigationItems } from '@/hooks/use-sidebar-navigation';
import { cn } from '@/lib/utils';

import SidebarLink from './sidebar-link';

export default function DesktopSidebarNavigation() {
  const navigation = useNavigationItems();

  return (
    <ul role="list" className="space-y-2">
      {navigation.map(({ name, href, icon: Icon, current, ...other }) => (
        <li key={name}>
          <SidebarLink href={href} current={current} tooltipLabel={name} {...other}>
            <div className="p-2">
              <Icon aria-hidden="true" className="size-6 shrink-0" />
            </div>
            <span className="ml-1 inline group-data-[state=collapsed]/sidebar:hidden">{name}</span>
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
      {secondaryNavigation.map(({ name, href, icon: Icon, current, hidden }) => (
        <li key={name}>
          <SidebarLink href={href} current={current} tooltipLabel={name} hidden={hidden}>
            <div className="p-2">
              <Icon aria-hidden="true" className={cn('size-6 shrink-0', { 'text-primary': href === '/pricing' })} />
            </div>
            <span className="ml-1 inline group-data-[state=collapsed]/sidebar:hidden">{name}</span>
          </SidebarLink>
        </li>
      ))}
    </>
  );
}
