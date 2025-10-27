import { preloadQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

import SettingsNavbar from './components/settings-navbar';
import SettingsForms from './components/settings-forms';

export default async function SettingsPage() {
  const user = await preloadQuery(api.auth.getCurrentUserSafe);
  const settingsCapabilities = await preloadQuery(api.auth.getUserSettingsCapabilities);

  return (
    <>
      <SettingsNavbar />
      <SettingsForms preloadedUser={user} preloadedSettingsCapabilities={settingsCapabilities} />
    </>
  );
}
