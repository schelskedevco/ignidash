import Image from 'next/image';

import type { NavigationItem } from '@/lib/navigation';

import SidebarLink from './sidebar-link';
import SidebarBrand from './sidebar-brand';

interface DesktopSidebarProps {
  navigation: NavigationItem[];
}

export function DesktopSidebar({ navigation }: DesktopSidebarProps) {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      <div className="border-border bg-emphasized-background flex grow flex-col overflow-y-auto border-r px-6">
        <SidebarBrand />
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col">
            <li>
              <ul role="list" className="-mx-2 space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <SidebarLink href={item.href} current={item.current}>
                      <item.icon aria-hidden="true" className="text-primary size-6 shrink-0" />
                      {item.name}
                    </SidebarLink>
                  </li>
                ))}
              </ul>
            </li>
            <li className="-mx-6 mt-auto">
              <a
                href="#"
                className="hover:bg-background focus-outline border-border flex items-center gap-x-4 border-t px-6 py-3 text-sm/6 font-semibold"
              >
                <Image
                  alt=""
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  className="size-8 rounded-full"
                  width={32}
                  height={32}
                />
                <span className="sr-only">Your profile</span>
                <span aria-hidden="true">Tom Cook</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
