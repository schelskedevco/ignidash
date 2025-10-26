'use client';

import { FireIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CircleUserRoundIcon, LogInIcon, LogOutIcon, SettingsIcon, LoaderIcon } from 'lucide-react';
import * as Headless from '@headlessui/react';
import { useRouter } from 'next/navigation';
import { Unauthenticated, Authenticated, AuthLoading } from 'convex/react';

import { authClient } from '@/lib/auth-client';
import { Dropdown, DropdownItem, DropdownMenu, DropdownDivider, DropdownLabel, DropdownHeader } from '@/components/catalyst/dropdown';
import { Navbar, NavbarSpacer } from '@/components/catalyst/navbar';

export default function SettingsNavbar() {
  const router = useRouter();
  const user = useQuery(api.auth.getCurrentUserSafe);

  const image = user?.image;
  const name = user?.name ?? 'Anonymous';
  const email = user?.email;

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
    <Navbar className="border-border/50 from-emphasized-background to-background border-b bg-gradient-to-r">
      <div className="flex items-center gap-2 px-4">
        <Link href="/" aria-label="Home">
          <FireIcon className="text-primary size-8 shrink-0" aria-hidden="true" />
        </Link>
        <span className="text-lg tracking-tight">Settings</span>
      </div>
      <NavbarSpacer />
      <Dropdown>
        <Headless.MenuButton aria-label="Account options" className="focus-outline shrink-0 px-4">
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
            <DropdownItem href="/settings">
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
            <DropdownItem href="/settings">
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
    </Navbar>
  );
}
