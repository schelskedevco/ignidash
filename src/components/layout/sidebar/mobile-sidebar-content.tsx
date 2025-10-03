import type { NavigationItem } from '@/lib/navigation';
import { SidebarModeToggle } from '@/components/mode-toggle';

import SidebarLink from './sidebar-link';
import SidebarBrand from './sidebar-brand';

interface MobileSidebarContentProps {
  navigation: NavigationItem[];
  secondaryNavigation: NavigationItem[];
  onClose: () => void;
}

export default function MobileSidebarContent({ navigation, secondaryNavigation, onClose }: MobileSidebarContentProps) {
  return (
    <div className="bg-emphasized-background border-border/50 flex grow flex-col border-r">
      <div className="px-3">
        <SidebarBrand onClose={onClose} />
      </div>
      <nav className="flex flex-1 flex-col overflow-y-auto px-3">
        <ul role="list" className="flex flex-1 flex-col">
          <li className="mt-1">
            <ul role="list" className="space-y-1.5">
              {navigation.map((item) => (
                <li key={item.name} onClick={onClose}>
                  <SidebarLink href={item.href} current={item.current}>
                    <div className="p-2">
                      <item.icon aria-hidden="true" className="size-6 shrink-0" />
                    </div>
                    <span className="ml-1">{item.name}</span>
                  </SidebarLink>
                </li>
              ))}
            </ul>
          </li>
          <li className="my-3 flex-1">
            <div
              className="bg-background border-border/50 h-full border"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 10px,
                  var(--color-emphasized-background) 10px,
                  var(--color-emphasized-background) 11px
                )`,
              }}
            />
          </li>
          <li className="mb-1">
            <ul role="list" className="space-y-1.5">
              <li key="dark-mode">
                <SidebarModeToggle />
              </li>
              {secondaryNavigation.map((item) => (
                <li key={item.name}>
                  <SidebarLink href={item.href} current={item.current}>
                    <div className="p-2">
                      <item.icon aria-hidden="true" className="size-6 shrink-0" />
                    </div>
                    <span className="ml-1 inline group-data-[state=collapsed]/sidebar:hidden">{item.name}</span>
                  </SidebarLink>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}
