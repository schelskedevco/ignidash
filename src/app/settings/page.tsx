import { preloadQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

import Footer from '@/components/layout/footer';

import SettingsNavbar from './components/settings-navbar';
import SettingsForms from './components/settings-forms';

export default async function SettingsPage() {
  const preloadedUser = await preloadQuery(api.auth.getCurrentUserSafe);

  return (
    <>
      <SettingsNavbar />
      <SettingsForms preloadedUser={preloadedUser} />
      <Footer />
    </>
  );
}
