import { preloadQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { redirect } from 'next/navigation';

import { getToken } from '@/lib/auth-server';

import DashboardColumnHeader from './dashboard-column-header';
import DashboardContent from './dashboard-content';

export default async function DesktopMainArea() {
  const token = await getToken();
  if (!token) redirect('/signin');

  const preloadedUser = await preloadQuery(api.auth.getCurrentUserSafe, {}, { token });

  return (
    <div className="hidden lg:block">
      <DashboardColumnHeader preloadedUser={preloadedUser} />
      <div className="flex h-full flex-col pt-[4.3125rem]">
        <DashboardContent />
      </div>
    </div>
  );
}
