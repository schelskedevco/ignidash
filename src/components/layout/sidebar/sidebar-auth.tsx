'use client';

import Image from 'next/image';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  CircleUserRoundIcon,
  LogInIcon,
  LogOutIcon,
  SettingsIcon,
  LoaderIcon,
  SparklesIcon,
  GlobeLockIcon,
  HandshakeIcon,
} from 'lucide-react';
import * as Headless from '@headlessui/react';
import { useRouter, usePathname } from 'next/navigation';
import { Unauthenticated, Authenticated, AuthLoading } from 'convex/react';

import { authClient } from '@/lib/auth-client';
import { Dropdown, DropdownItem, DropdownMenu, DropdownDivider, DropdownLabel, DropdownHeader } from '@/components/catalyst/dropdown';

export default function SidebarAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useQuery(api.auth.getCurrentUserSafe);

  const signInUrlWithRedirect = `/signin?redirect=${encodeURIComponent(pathname)}`;

  const image = user?.image;
  const name = user?.name ?? 'Anonymous';
  const email = user?.email;

  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push(signInUrlWithRedirect);
        },
      },
    });
  };

  return (
    <Dropdown>
      <Headless.MenuButton
        aria-label="Account options"
        className="hover:bg-background border-border/50 focus-visible:ring-primary flex w-full items-center border-t border-dashed py-3 pl-4 text-base/6 font-semibold focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset"
      >
        {image ? (
          <Image alt="" src={image} className="size-8 shrink-0 rounded-full" width={32} height={32} />
        ) : (
          <CircleUserRoundIcon className="size-8 shrink-0 rounded-full" />
        )}
        <span className="ml-2 inline group-data-[state=collapsed]/sidebar:hidden" aria-hidden="true">
          {name}
        </span>
      </Headless.MenuButton>
      <DropdownMenu className="z-[60] min-w-(--button-width)">
        <AuthLoading>
          <DropdownItem onClick={() => {}} disabled>
            <LoaderIcon data-slot="icon" />
            <DropdownLabel>Loading...</DropdownLabel>
          </DropdownItem>
        </AuthLoading>
        <Unauthenticated>
          <DropdownItem href="/pricing">
            <SparklesIcon data-slot="icon" />
            <DropdownLabel>Upgrade</DropdownLabel>
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem href="/privacy">
            <GlobeLockIcon data-slot="icon" />
            <DropdownLabel>Privacy</DropdownLabel>
          </DropdownItem>
          <DropdownItem href="/terms">
            <HandshakeIcon data-slot="icon" />
            <DropdownLabel>Terms</DropdownLabel>
          </DropdownItem>
          <DropdownItem href="/settings">
            <SettingsIcon data-slot="icon" />
            <DropdownLabel>Settings</DropdownLabel>
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem href={signInUrlWithRedirect}>
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
          <DropdownItem href="/pricing">
            <SparklesIcon data-slot="icon" />
            <DropdownLabel>Upgrade</DropdownLabel>
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem href="/privacy">
            <GlobeLockIcon data-slot="icon" />
            <DropdownLabel>Privacy</DropdownLabel>
          </DropdownItem>
          <DropdownItem href="/terms">
            <HandshakeIcon data-slot="icon" />
            <DropdownLabel>Terms</DropdownLabel>
          </DropdownItem>
          <DropdownItem href="/settings">
            <SettingsIcon data-slot="icon" />
            <DropdownLabel>Settings</DropdownLabel>
          </DropdownItem>
          <DropdownDivider />
          <DropdownItem onClick={() => signOut()}>
            <LogOutIcon data-slot="icon" />
            <DropdownLabel>Sign out</DropdownLabel>
          </DropdownItem>
        </Authenticated>
      </DropdownMenu>
    </Dropdown>
  );
}
