'use client';

import { FireIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { CircleUserRoundIcon, LogInIcon, LogOutIcon, LoaderIcon, LayoutDashboardIcon, SettingsIcon, GemIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Unauthenticated, Authenticated, AuthLoading } from 'convex/react';

import { authClient } from '@/lib/auth-client';
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownMenu,
  DropdownDivider,
  DropdownLabel,
  DropdownHeader,
} from '@/components/catalyst/dropdown';
import { Avatar } from '@/components/catalyst/avatar';
import { Navbar as CatalystNavbar, NavbarItem, NavbarSection, NavbarSpacer, NavbarDivider } from '@/components/catalyst/navbar';
import { useThemeSwitcher } from '@/hooks/use-theme-switcher';

function NavbarModeToggle() {
  const themeSwitcher = useThemeSwitcher();
  if (!themeSwitcher) return null;

  const { newTheme, label, icon: Icon, setTheme } = themeSwitcher;

  return (
    <NavbarItem aria-label={label} onClick={() => setTheme(newTheme)}>
      <Icon data-slot="icon" />
    </NavbarItem>
  );
}

export default function Navbar() {
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
    <CatalystNavbar className="border-border/50 from-emphasized-background to-background fixed top-0 z-40 w-full border-b bg-gradient-to-r shadow-sm">
      <Link href="/" aria-label="Home" className="pl-4">
        <FireIcon className="text-primary size-10 shrink-0 sm:size-8" aria-hidden="true" />
      </Link>
      <NavbarDivider className="max-lg:hidden" />
      <NavbarSection className="max-lg:hidden">
        <NavbarItem href="/privacy" current={pathname === '/privacy'}>
          Privacy
        </NavbarItem>
        <NavbarItem href="/terms" current={pathname === '/terms'}>
          Terms
        </NavbarItem>
        <NavbarItem href="/settings" current={pathname === '/settings'}>
          Settings
        </NavbarItem>
      </NavbarSection>
      <NavbarSpacer />
      <NavbarSection className="pr-4">
        <NavbarModeToggle />
        <Dropdown>
          <DropdownButton as={NavbarItem} aria-label="Account options">
            {image ? <Avatar src={image} square /> : <CircleUserRoundIcon data-slot="icon" />}
          </DropdownButton>
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
              <DropdownItem href="/dashboard/simulator">
                <LayoutDashboardIcon data-slot="icon" />
                <DropdownLabel>Dashboard</DropdownLabel>
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
              <DropdownItem href="/dashboard/simulator">
                <LayoutDashboardIcon data-slot="icon" />
                <DropdownLabel>Dashboard</DropdownLabel>
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
      </NavbarSection>
    </CatalystNavbar>
  );
}
