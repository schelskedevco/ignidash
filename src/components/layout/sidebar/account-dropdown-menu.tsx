'use client';

import { LogInIcon, LogOutIcon, SettingsIcon, LoaderIcon, GemIcon, GlobeLockIcon, HandshakeIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Unauthenticated, Authenticated, AuthLoading } from 'convex/react';

import { authClient } from '@/lib/auth-client';
import { DropdownItem, DropdownMenu, DropdownDivider, DropdownLabel, DropdownHeader } from '@/components/catalyst/dropdown';

interface AccountDropdownMenuProps {
  fetchedName: string | undefined;
  fetchedEmail: string | undefined;
}

export default function AccountDropdownMenu({ fetchedName, fetchedEmail }: AccountDropdownMenuProps) {
  const router = useRouter();
  const pathname = usePathname();

  const signInUrlWithRedirect = `/signin?redirect=${encodeURIComponent(pathname)}`;

  const name = fetchedName ?? 'Anonymous';
  const email = fetchedEmail;

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
    <DropdownMenu className="z-[60] min-w-(--button-width)">
      <AuthLoading>
        <DropdownItem onClick={() => {}} disabled>
          <LoaderIcon data-slot="icon" />
          <DropdownLabel>Loading...</DropdownLabel>
        </DropdownItem>
      </AuthLoading>
      <Unauthenticated>
        <DropdownItem href="/pricing">
          <GemIcon data-slot="icon" />
          <DropdownLabel>Buy Pro</DropdownLabel>
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
          <GemIcon data-slot="icon" />
          <DropdownLabel>Buy Pro</DropdownLabel>
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
  );
}
