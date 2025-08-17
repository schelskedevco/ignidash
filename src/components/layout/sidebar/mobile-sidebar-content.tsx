import type { NavigationItem } from '@/lib/navigation';

import SidebarLink from './sidebar-link';
import SidebarBrand from './sidebar-brand';

interface MobileSidebarContentProps {
  navigation: NavigationItem[];
  onClose: () => void;
}

export default function MobileSidebarContent({ navigation, onClose }: MobileSidebarContentProps) {
  return (
    <div className="bg-emphasized-background border-border flex grow flex-col gap-y-5 overflow-y-auto border-r px-6 pb-2">
      <SidebarBrand />
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-2">
              {navigation.map((item) => (
                <li key={item.name} onClick={onClose}>
                  <SidebarLink href={item.href} current={item.current}>
                    <item.icon aria-hidden="true" className="text-primary size-6 shrink-0" />
                    {item.name}
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
