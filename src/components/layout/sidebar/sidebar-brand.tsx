import { FireIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

import ModeToggle from '@/components/mode-toggle';

import SidebarToggle from './sidebar-toggle';

interface SidebarBrandProps {
  onClose?: () => void;
}

export default function SidebarBrand({ onClose }: SidebarBrandProps) {
  return (
    <div className="border-border -mx-3 mb-4 flex items-center justify-between gap-2 border-b py-4 shadow-md group-data-[state=collapsed]:py-[14px] dark:shadow-black/30">
      <div className="hidden w-full items-center justify-center group-data-[state=collapsed]:flex">
        <SidebarToggle />
      </div>
      <div className="mx-3 flex w-full items-center justify-between group-data-[state=collapsed]:hidden">
        <Link href="/dashboard" className="focus-outline flex items-center" onClick={onClose}>
          <div className="px-1">
            <FireIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
          </div>
          <span className="ml-1 text-2xl font-extrabold tracking-tight uppercase">Ignidash</span>
        </Link>
        <div className="flex items-center">
          <ModeToggle />
          <SidebarToggle />
        </div>
      </div>
    </div>
  );
}
