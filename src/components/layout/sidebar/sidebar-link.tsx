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
        'group focus-outline my-1 flex items-center text-base/6',
        { 'bg-background ring-primary text-primary ring': current },
        { 'hover:bg-background hover:ring-border hover:ring': !current }
      )}
    >
      {children}
    </Link>
  );
}
