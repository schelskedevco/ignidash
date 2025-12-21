import { api } from '@/convex/_generated/api';

import { preloadAuthQuery } from '@/lib/auth-server';

import SettingsForms from './components/settings-forms';

export default async function SettingsPage() {
  const preloadedUser = await preloadAuthQuery(api.auth.getCurrentUserSafe, {});

  return <SettingsForms preloadedUser={preloadedUser} />;
}
