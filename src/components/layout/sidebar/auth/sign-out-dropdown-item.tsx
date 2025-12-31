'use client';

import { LogOutIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import posthog from 'posthog-js';

import { authClient } from '@/lib/auth-client';
import { DropdownItem, DropdownLabel } from '@/components/catalyst/dropdown';

export default function SignOutDropdownItem() {
  const router = useRouter();
  const pathname = usePathname();

  const signInUrlWithRedirect = `/signin?redirect=${encodeURIComponent(pathname)}`;

  const signOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          posthog.reset();
          router.push(signInUrlWithRedirect);
        },
      },
    });
  };

  return (
    <DropdownItem onClick={() => signOut()}>
      <LogOutIcon data-slot="icon" />
      <DropdownLabel>Sign out</DropdownLabel>
    </DropdownItem>
  );
}
