import { FireIcon } from '@heroicons/react/24/solid';

import ModeToggle from '@/components/mode-toggle';

export default function SidebarBrand() {
  return (
    <div className="border-border -mx-6 flex h-16 shrink-0 items-center justify-between gap-2 border-b">
      <div className="mx-6 flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          <FireIcon className="text-primary h-8 w-8" aria-hidden="true" />
          <span className="text-2xl font-extrabold tracking-tight">Ignidash</span>
        </div>
        <ModeToggle />
      </div>
    </div>
  );
}
