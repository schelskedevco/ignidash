import { api } from '@/convex/_generated/api';

import { preloadAuthQuery } from '@/lib/auth-server';

import DashboardColumnHeader from './dashboard-column-header';
import DashboardContent from './dashboard-content';

export default async function DesktopMainArea() {
  const preloadedUser = await preloadAuthQuery(api.auth.getCurrentUserSafe, {});

  return (
    <div className="hidden lg:block">
      <DashboardColumnHeader preloadedUser={preloadedUser} />
      <div className="flex h-full flex-col pt-[4.3125rem]">
        <DashboardContent />
      </div>
    </div>
  );
}
