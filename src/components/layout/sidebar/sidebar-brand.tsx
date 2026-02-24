import Link from 'next/link';

import AppLogo from '@/components/app-logo';
import { APP_VERSION } from '@/lib/version';

import SidebarToggle from './sidebar-toggle';

interface SidebarBrandProps {
  onClose?: () => void;
}

export default function SidebarBrand({ onClose }: SidebarBrandProps) {
  return (
    <div className="border-border/50 from-emphasized-background relative -mx-3 flex items-center justify-between gap-2 overflow-hidden border-b bg-gradient-to-r to-rose-500/35 py-4 group-data-[state=collapsed]/sidebar:py-[0.875rem]">
      {/* Collapsed view - centered toggle */}
      <div className="pointer-events-none absolute inset-0 flex w-full items-center justify-center opacity-0 transition-opacity duration-200 ease-in-out group-data-[state=collapsed]/sidebar:pointer-events-auto group-data-[state=collapsed]/sidebar:opacity-100 motion-reduce:transition-none">
        <SidebarToggle />
      </div>
      {/* Expanded view - logo + brand + toggle */}
      <div className="mx-3 flex w-full items-center justify-between opacity-100 transition-opacity duration-200 ease-in-out group-data-[state=collapsed]/sidebar:pointer-events-none group-data-[state=collapsed]/sidebar:opacity-0 motion-reduce:transition-none">
        <Link href="/dashboard" className="focus-outline flex items-center" onClick={onClose}>
          <div className="px-1">
            <AppLogo className="size-8 shrink-0" />
          </div>
          <span className="relative ml-1 text-2xl font-bold tracking-tight">
            Ignidash
            <span className="text-muted-foreground absolute top-6 left-0 text-xs/6 font-medium tracking-tighter lowercase">
              ▸ beta v{APP_VERSION}
            </span>
          </span>
        </Link>
        <SidebarToggle />
      </div>
    </div>
  );
}
