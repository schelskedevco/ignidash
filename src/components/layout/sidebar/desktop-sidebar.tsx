import Image from 'next/image';

import type { NavigationItem } from '@/lib/navigation';
import { SidebarModeToggle } from '@/components/mode-toggle';

import SidebarLink from './sidebar-link';
import SidebarBrand from './sidebar-brand';

interface DesktopSidebarProps {
  navigation: NavigationItem[];
  secondaryNavigation: NavigationItem[];
}

export function DesktopSidebar({ navigation, secondaryNavigation }: DesktopSidebarProps) {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col group-data-[state=collapsed]/sidebar:lg:w-16">
      <div className="bg-emphasized-background border-border flex grow flex-col border-r">
        <div className="px-3">
          <SidebarBrand />
        </div>
        <nav className="flex flex-1 flex-col overflow-y-auto px-3">
          <ul role="list" className="flex flex-1 flex-col">
            <li className="mt-1">
              <ul role="list" className="space-y-1.5">
                {navigation.map((item) => (
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
            <li className="my-3 flex-1">
              <div
                className="bg-background border-border h-full border"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    45deg,
                    transparent,
                    transparent 10px,
                    var(--color-emphasized-background) 10px,
                    var(--color-emphasized-background) 11px
                  )`,
                }}
              ></div>
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
            <li className="-mx-3">
              <a
                href="#"
                className="hover:bg-background border-border focus-visible:ring-primary flex items-center border-t py-3 pl-4 text-base/6 font-semibold focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
              >
                <Image
                  alt=""
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  className="size-8 shrink-0 rounded-full"
                  width={32}
                  height={32}
                />
                <span className="sr-only">Your profile</span>
                <span className="ml-2 inline group-data-[state=collapsed]/sidebar:hidden" aria-hidden="true">
                  Tom Cook
                </span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
