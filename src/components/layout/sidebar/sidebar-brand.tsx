import { FireIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

import SidebarToggle from './sidebar-toggle';

interface SidebarBrandProps {
  onClose?: () => void;
}

export default function SidebarBrand({ onClose }: SidebarBrandProps) {
  return (
    <div className="border-border/50 from-emphasized-background -mx-3 flex items-center justify-between gap-2 border-b bg-gradient-to-br to-rose-500/35 py-4 group-data-[state=collapsed]/sidebar:py-[0.875rem]">
      <div className="hidden w-full items-center justify-center group-data-[state=collapsed]/sidebar:flex">
        <SidebarToggle />
      </div>
      <div className="mx-3 flex w-full items-center justify-between group-data-[state=collapsed]/sidebar:hidden">
        <Link href="/dashboard" className="focus-outline flex items-center" onClick={onClose}>
          <div className="px-1">
            <FireIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          </div>
          <span className="relative ml-1 text-2xl font-bold tracking-tight">
            Ignidash
            <span className="text-muted-foreground absolute top-6 left-0 text-xs/6 font-medium tracking-tighter lowercase">
              ▸ beta 0.1.0
            </span>
          </span>
        </Link>
        <SidebarToggle />
      </div>
    </div>
  );
}
