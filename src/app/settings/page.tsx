import Card from '@/components/ui/card';
import SectionContainer from '@/components/ui/section-container';
import SectionHeader from '@/components/ui/section-header';

import SettingsNavbar from './settings-navbar';

export default function SettingsPage() {
  return (
    <>
      <SettingsNavbar />
      <main className="mx-auto max-w-prose flex-1 overflow-y-auto">
        <SectionContainer showBottomBorder>
          <SectionHeader title="Settings" desc="Manage your account and application settings." />
          <Card>This is card text.</Card>
        </SectionContainer>
      </main>
    </>
  );
}
