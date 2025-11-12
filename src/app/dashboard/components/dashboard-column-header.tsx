import { LayoutDashboardIcon } from 'lucide-react';

import ColumnHeader from '@/components/ui/column-header';

export default function DashboardColumnHeader() {
  return (
    <ColumnHeader
      title="Dashboard"
      icon={LayoutDashboardIcon}
      className="h-[4.3125rem] w-[calc(100%-18rem)] group-data-[state=collapsed]/sidebar:w-[calc(100%-4rem)]"
    />
  );
}
