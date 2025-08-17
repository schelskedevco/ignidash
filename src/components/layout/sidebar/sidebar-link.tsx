import Link from 'next/link';

import { cn } from '@/lib/utils';

interface SidebarLinkProps {
  href: string;
  current: boolean;
  children: React.ReactNode;
}

export default function SidebarLink({ href, current, children }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group focus-outline flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
        { 'bg-background ring-border ring': current },
        { 'hover:bg-background hover:ring-border hover:ring': !current }
      )}
    >
      {children}
    </Link>
  );
}
