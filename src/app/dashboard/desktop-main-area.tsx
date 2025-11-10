import { LayoutDashboardIcon, PlusIcon } from 'lucide-react';

import ColumnHeader from '@/components/ui/column-header';
import IconButton from '@/components/ui/icon-button';

export default function DesktopMainArea() {
  return (
    <div className="hidden lg:block">
      <ColumnHeader
        title="Dashboard"
        icon={LayoutDashboardIcon}
        className="w-[calc(100%-42rem)] group-data-[state=collapsed]/sidebar:w-[calc(100%-28rem)]"
        iconButton={
          <div className="flex items-center gap-x-1">
            <IconButton icon={PlusIcon} label="Create New Plan" onClick={() => {}} surfaceColor="emphasized" />
          </div>
        }
      />
      <div className="flex h-full flex-col pt-[4.3125rem]">
        <h1>Desktop Main Area</h1>
      </div>
    </div>
  );
}
