'use client';

import Image from 'next/image';
import { MenuIcon } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CircleUserRoundIcon, LogInIcon, LogOutIcon, SettingsIcon, LoaderIcon } from 'lucide-react';
import * as Headless from '@headlessui/react';
import { useRouter } from 'next/navigation';
import { Unauthenticated, Authenticated, AuthLoading } from 'convex/react';

import type { NavigationItem } from '@/lib/navigation';
import { authClient } from '@/lib/auth-client';
import { Dropdown, DropdownItem, DropdownMenu, DropdownDivider, DropdownLabel, DropdownHeader } from '@/components/catalyst/dropdown';

interface MobileHeaderProps {
  onMenuClick: () => void;
  currentPageTitle: string;
  currentPageIcon: NavigationItem['icon'];
}

export default function MobileHeader({ onMenuClick, currentPageTitle, currentPageIcon: Icon }: MobileHeaderProps) {
  const router = useRouter();
  const user = useQuery(api.auth.getCurrentUserSafe);

  const name = user?.name ?? 'Anonymous';
  const email = user?.email;
  const image = user?.image;

  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push('/signin');
        },
      },
    });
  };

  return (
    <div className="bg-emphasized-background border-border/50 fixed top-0 z-40 flex w-full items-center gap-x-6 border-b border-dashed px-4 py-4 sm:px-6 lg:hidden">
      <button type="button" onClick={onMenuClick} className="focus-outline -m-2.5 p-2.5 lg:hidden">
        <span className="sr-only">Open sidebar</span>
        <MenuIcon aria-hidden="true" className="size-6" />
      </button>
      <div className="flex flex-1 items-center gap-2 text-base/6 font-semibold">
        <Icon aria-hidden="true" className="text-primary size-5" />
        {currentPageTitle}
      </div>
      <Dropdown>
        <Headless.MenuButton aria-label="Account options" className="focus-outline shrink-0">
          {image ? (
            <Image alt="" src={image} className="size-8 shrink-0 rounded-full" width={32} height={32} />
          ) : (
            <CircleUserRoundIcon className="size-8 shrink-0 rounded-full" />
          )}
        </Headless.MenuButton>
        <DropdownMenu className="z-[60] min-w-(--button-width)">
          <AuthLoading>
            <DropdownItem onClick={() => {}} disabled>
              <LoaderIcon data-slot="icon" />
              <DropdownLabel>Loading...</DropdownLabel>
            </DropdownItem>
          </AuthLoading>
          <Unauthenticated>
            <DropdownItem href="/dashboard/settings">
              <SettingsIcon data-slot="icon" />
              <DropdownLabel>Settings</DropdownLabel>
            </DropdownItem>
            <DropdownItem href="/signin">
              <LogInIcon data-slot="icon" />
              <DropdownLabel>Sign in</DropdownLabel>
            </DropdownItem>
          </Unauthenticated>
          <Authenticated>
            <DropdownHeader>
              <div className="pr-6">
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Signed in as {name}</div>
                <div className="text-sm/7 font-semibold text-zinc-800 dark:text-white">{email}</div>
              </div>
            </DropdownHeader>
            <DropdownDivider />
            <DropdownItem href="/dashboard/settings">
              <SettingsIcon data-slot="icon" />
              <DropdownLabel>Settings</DropdownLabel>
            </DropdownItem>
            <DropdownItem onClick={() => signOut()}>
              <LogOutIcon data-slot="icon" />
              <DropdownLabel>Sign out</DropdownLabel>
            </DropdownItem>
          </Authenticated>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
