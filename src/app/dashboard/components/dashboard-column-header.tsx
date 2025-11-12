'use client';

import { LayoutDashboardIcon } from 'lucide-react';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

import ColumnHeader from '@/components/ui/column-header';

interface DashboardColumnHeaderProps {
  preloadedUser: Preloaded<typeof api.auth.getCurrentUserSafe>;
}

export default function DashboardColumnHeader({ preloadedUser }: DashboardColumnHeaderProps) {
  const user = usePreloadedQuery(preloadedUser);

  const name = user?.name ?? 'Anonymous';

  return (
    <ColumnHeader
      title={`Welcome back, ${name.split(' ')[0]}!`}
      icon={LayoutDashboardIcon}
      className="h-[4.3125rem] w-[calc(100%-18rem)] group-data-[state=collapsed]/sidebar:w-[calc(100%-4rem)]"
    />
  );
}
