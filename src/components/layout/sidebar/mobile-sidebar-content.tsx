import type { NavigationItem } from '@/lib/navigation';

import SidebarLink from './sidebar-link';
import SidebarBrand from './sidebar-brand';

interface MobileSidebarContentProps {
  navigation: NavigationItem[];
  onClose: () => void;
}

export default function MobileSidebarContent({ navigation, onClose }: MobileSidebarContentProps) {
  return (
    <div className="bg-emphasized-background border-border flex grow flex-col overflow-y-auto border-r px-3">
      <SidebarBrand onClose={onClose} />
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col">
          <li>
            <ul role="list" className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name} onClick={onClose}>
                  <SidebarLink href={item.href} current={item.current}>
                    <div className="p-2">
                      <item.icon aria-hidden="true" className="text-primary size-6 shrink-0" />
                    </div>
                    <span className="ml-1">{item.name}</span>
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
