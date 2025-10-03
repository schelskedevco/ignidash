import Image from 'next/image';
import { MenuIcon } from 'lucide-react';

import type { NavigationItem } from '@/lib/navigation';

interface MobileHeaderProps {
  onMenuClick: () => void;
  currentPageTitle: string;
  currentPageIcon: NavigationItem['icon'];
}

export default function MobileHeader({ onMenuClick, currentPageTitle, currentPageIcon: Icon }: MobileHeaderProps) {
  const profileLink =
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';

  return (
    <div className="bg-emphasized-background border-border/50 fixed top-0 z-40 flex w-full items-center gap-x-6 border-b px-4 py-4 sm:px-6 lg:hidden">
      <button type="button" onClick={onMenuClick} className="focus-outline -m-2.5 p-2.5 lg:hidden">
        <span className="sr-only">Open sidebar</span>
        <MenuIcon aria-hidden="true" className="size-6" />
      </button>
      <div className="flex flex-1 items-center gap-2 text-base/6 font-semibold">
        <Icon aria-hidden="true" className="text-primary size-5" />
        {currentPageTitle}
      </div>
      <a className="focus-outline shrink-0" href="#">
        <span className="sr-only">Your profile</span>
        <Image alt="" src={profileLink} className="size-8 rounded-full" width={32} height={32} />
      </a>
    </div>
  );
}
