import { SettingsIcon, LoaderIcon, GemIcon, GlobeLockIcon, HandshakeIcon } from 'lucide-react';
import { Unauthenticated, Authenticated, AuthLoading } from 'convex/react';

import { DropdownItem, DropdownMenu, DropdownDivider, DropdownLabel, DropdownHeader } from '@/components/catalyst/dropdown';

import SignInDropdownItem from './sign-in-dropdown-item';
import SignOutDropdownItem from './sign-out-dropdown-item';

interface AccountDropdownMenuProps {
  fetchedName: string | undefined;
  fetchedEmail: string | undefined;
  hasActiveSubscription: boolean;
}

export default function AccountDropdownMenu({ fetchedName, fetchedEmail, hasActiveSubscription }: AccountDropdownMenuProps) {
  const name = fetchedName ?? 'Anonymous';
  const email = fetchedEmail;

  return (
    <DropdownMenu className="z-[60] min-w-(--button-width)">
      <AuthLoading>
        <DropdownItem onClick={() => {}} disabled>
          <LoaderIcon data-slot="icon" />
          <DropdownLabel>Loading...</DropdownLabel>
        </DropdownItem>
      </AuthLoading>
      <Unauthenticated>
        {!hasActiveSubscription && (
          <DropdownItem href="/pricing">
            <GemIcon data-slot="icon" />
            <DropdownLabel>Upgrade to Pro</DropdownLabel>
          </DropdownItem>
        )}
        <DropdownItem href="/settings">
          <SettingsIcon data-slot="icon" />
          <DropdownLabel>Settings</DropdownLabel>
        </DropdownItem>
        {!hasActiveSubscription && <DropdownDivider />}
        <DropdownItem href="/privacy">
          <GlobeLockIcon data-slot="icon" />
          <DropdownLabel>Privacy</DropdownLabel>
        </DropdownItem>
        <DropdownItem href="/terms">
          <HandshakeIcon data-slot="icon" />
          <DropdownLabel>Terms</DropdownLabel>
        </DropdownItem>
        <DropdownDivider />
        <SignInDropdownItem />
      </Unauthenticated>
      <Authenticated>
        <DropdownHeader>
          <div className="pr-6">
            <div className="text-xs text-stone-500 dark:text-stone-400">Signed in as {name}</div>
            <div className="text-sm/7 font-semibold text-stone-800 dark:text-white">{email}</div>
          </div>
        </DropdownHeader>
        <DropdownDivider />
        {!hasActiveSubscription && (
          <DropdownItem href="/pricing">
            <GemIcon data-slot="icon" />
            <DropdownLabel>Upgrade to Pro</DropdownLabel>
          </DropdownItem>
        )}
        <DropdownItem href="/settings">
          <SettingsIcon data-slot="icon" />
          <DropdownLabel>Settings</DropdownLabel>
        </DropdownItem>
        {!hasActiveSubscription && <DropdownDivider />}
        <DropdownItem href="/privacy">
          <GlobeLockIcon data-slot="icon" />
          <DropdownLabel>Privacy</DropdownLabel>
        </DropdownItem>
        <DropdownItem href="/terms">
          <HandshakeIcon data-slot="icon" />
          <DropdownLabel>Terms</DropdownLabel>
        </DropdownItem>
        <DropdownDivider />
        <SignOutDropdownItem />
      </Authenticated>
    </DropdownMenu>
  );
}
