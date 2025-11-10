import { LayoutDashboardIcon, PlusIcon } from 'lucide-react';

import ColumnHeader from '@/components/ui/column-header';
import IconButton from '@/components/ui/icon-button';

export default function DashboardColumnHeader() {
  return (
    <ColumnHeader
      title="Dashboard"
      icon={LayoutDashboardIcon}
      className="w-[calc(100%-18rem)] group-data-[state=collapsed]/sidebar:w-[calc(100%-4rem)]"
      iconButton={
        <div className="flex items-center gap-x-1">
          <IconButton icon={PlusIcon} label="Create New Plan" onClick={() => {}} surfaceColor="emphasized" />
        </div>
      }
    />
  );
}
