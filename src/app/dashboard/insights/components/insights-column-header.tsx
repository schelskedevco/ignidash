'use client';

import { ZapIcon } from 'lucide-react';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

import ColumnHeader from '@/components/ui/column-header';

interface InsightsColumnHeaderProps {
  preloadedUser: Preloaded<typeof api.auth.getCurrentUserSafe>;
}

export default function InsightsColumnHeader({ preloadedUser }: InsightsColumnHeaderProps) {
  const user = usePreloadedQuery(preloadedUser);

  const name = user?.name ?? 'Anonymous';

  return (
    <ColumnHeader
      title={`Time for insights, ${name.split(' ')[0]}!`}
      icon={ZapIcon}
      className="h-[4.3125rem] w-[calc(100%-18rem)] group-data-[state=collapsed]/sidebar:w-[calc(100%-4rem)]"
    />
  );
}
