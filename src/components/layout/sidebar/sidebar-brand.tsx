import { FireIcon } from '@heroicons/react/24/solid';

import ModeToggle from '@/components/mode-toggle';

// import SidebarToggle from './sidebar-toggle';

export default function SidebarBrand() {
  return (
    <div className="border-border -mx-6 flex items-center justify-between gap-2 border-b py-4 lg:pt-6 lg:pb-5">
      <div className="mx-6 flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <FireIcon className="text-primary h-8 w-8" aria-hidden="true" />
          <span className="text-2xl font-extrabold tracking-tight">Ignidash</span>
        </div>
        <div className="flex items-center">
          <ModeToggle />
          {/* <SidebarToggle /> */}
        </div>
      </div>
    </div>
  );
}
