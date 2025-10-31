import { preloadQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

import SettingsForms from './components/settings-forms';

export default async function SettingsPage() {
  const preloadedUser = await preloadQuery(api.auth.getCurrentUserSafe);

  return (
    <>
      <Navbar />
      <SettingsForms preloadedUser={preloadedUser} />
      <Footer />
    </>
  );
}
