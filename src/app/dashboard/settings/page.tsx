import { SettingsIcon } from 'lucide-react';

import MainArea from '@/components/layout/main-area';
import Card from '@/components/ui/card';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';

export default function SettingsPage() {
  return (
    <MainArea hasSecondaryColumn={false}>
      <div className="border-border/50 from-emphasized-background to-background fixed top-0 z-10 -mx-2 hidden h-[4.3125rem] w-full border-b border-dashed bg-gradient-to-r py-4 sm:-mx-3 lg:-mx-4 lg:block">
        <div className="mx-4 flex items-center gap-2 sm:mx-6 lg:mx-8">
          <SettingsIcon className="text-primary h-8 w-8" aria-hidden="true" />
          <h2 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">Settings</h2>
        </div>
      </div>
      <div className="mx-auto min-h-screen max-w-7xl pt-[4.3125rem]">
        <SectionContainer showBottomBorder>
          <SectionHeader title="Account Settings" desc="Manage your account settings and set e-mail preferences." />
          <Card>
            <p>This is card text.</p>
          </Card>
        </SectionContainer>
      </div>
    </MainArea>
  );
}
