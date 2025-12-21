import { api } from '@/convex/_generated/api';

import { preloadAuthQuery } from '@/lib/auth-server';

import InsightsColumnHeader from './insights-column-header';
import InsightsContent from './insights-content';

export default async function DesktopMainArea() {
  const preloadedUser = await preloadAuthQuery(api.auth.getCurrentUserSafe, {});

  return (
    <div className="hidden h-full lg:block">
      <InsightsColumnHeader preloadedUser={preloadedUser} />
      <div className="flex h-[calc(100vh-5.0625rem)] flex-col pt-[4.3125rem]">
        <InsightsContent />
      </div>
    </div>
  );
}
