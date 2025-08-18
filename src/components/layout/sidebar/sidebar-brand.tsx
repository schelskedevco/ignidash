import { FireIcon } from '@heroicons/react/24/solid';

import ModeToggle from '@/components/mode-toggle';

import SidebarToggle from './sidebar-toggle';

export default function SidebarBrand() {
  return (
    <div className="border-border -mx-3 mb-4 flex items-center justify-between gap-2 border-b py-4 shadow-xs dark:shadow-black/30">
      <div className="hidden w-full items-center justify-center group-data-[state=collapsed]:flex">
        <SidebarToggle />
      </div>
      <div className="mx-3 flex w-full items-center justify-between group-data-[state=collapsed]:hidden">
        <div className="flex items-center">
          <div className="px-1">
            <FireIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight">Ignidash</span>
        </div>
        <div className="flex items-center">
          <ModeToggle />
          <SidebarToggle />
        </div>
      </div>
    </div>
  );
}
