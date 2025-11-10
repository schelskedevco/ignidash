'use client';

import { LogInIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { DropdownItem, DropdownLabel } from '@/components/catalyst/dropdown';

export default function SignInDropdownItem() {
  const pathname = usePathname();
  const signInUrlWithRedirect = `/signin?redirect=${encodeURIComponent(pathname)}`;

  return (
    <DropdownItem href={signInUrlWithRedirect}>
      <LogInIcon data-slot="icon" />
      <DropdownLabel>Sign in</DropdownLabel>
    </DropdownItem>
  );
}
