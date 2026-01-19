import { SidebarModeToggle } from '@/components/mode-toggle';

import SidebarBrand from './sidebar-brand';
import SidebarAuth from './auth/sidebar-auth';
import DesktopSidebarNavigation, { DesktopSidebarSecondaryNavigation } from './desktop-sidebar-navigation';

export function DesktopSidebar() {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col group-data-[state=collapsed]/sidebar:lg:w-16">
      <div className="bg-emphasized-background border-border/50 flex grow flex-col border-r">
        <div className="px-3">
          <SidebarBrand />
        </div>
        <nav className="flex flex-1 flex-col overflow-y-auto px-3">
          <ul role="list" className="flex flex-1 flex-col">
            <li className="mt-1">
              <DesktopSidebarNavigation />
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
              <ul role="list" className="space-y-2">
                <li key="dark-mode">
                  <SidebarModeToggle />
                </li>
                <DesktopSidebarSecondaryNavigation />
              </ul>
            </li>
            <li className="-mx-3">
              <SidebarAuth />
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
