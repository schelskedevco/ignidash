import { api } from '@/convex/_generated/api';

import { preloadAuthQuery } from '@/lib/auth-server';

import SettingsForms from './components/settings-forms';

export default async function SettingsPage() {
  const [preloadedUser, preloadedSubscriptions] = await Promise.all([
    preloadAuthQuery(api.auth.getCurrentUserSafe, {}),
    preloadAuthQuery(api.auth.listSubscriptions, {}),
  ]);

  return <SettingsForms preloadedUser={preloadedUser} preloadedSubscriptions={preloadedSubscriptions} />;
}
