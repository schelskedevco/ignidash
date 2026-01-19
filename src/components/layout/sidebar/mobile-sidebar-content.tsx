'use client';

import { SidebarModeToggle } from '@/components/mode-toggle';

import SidebarBrand from './sidebar-brand';
import MobileSidebarNavigation, { MobileSidebarSecondaryNavigation } from './mobile-sidebar-navigation';

interface MobileSidebarContentProps {
  onClose: () => void;
}

export default function MobileSidebarContent({ onClose }: MobileSidebarContentProps) {
  return (
    <div className="bg-emphasized-background border-border/50 flex grow flex-col border-r">
      <div className="px-3">
        <SidebarBrand onClose={onClose} />
      </div>
      <nav className="flex flex-1 flex-col overflow-y-auto px-3">
        <ul role="list" className="flex flex-1 flex-col">
          <li className="mt-1">
            <MobileSidebarNavigation onClose={onClose} />
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
              <MobileSidebarSecondaryNavigation />
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );
}
