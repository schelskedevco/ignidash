'use client';

import { Preloaded, usePreloadedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

import Card from '@/components/ui/card';
import SectionContainer from '@/components/ui/section-container';
import SuccessNotification from '@/components/ui/success-notification';
import { useSuccessNotification } from '@/hooks/use-success-notification';

import ProfileInfoForm from './profile-info-form';

interface SettingsFormsProps {
  preloadedUser: Preloaded<typeof api.auth.getCurrentUserSafe>;
}

export default function SettingsForms({ preloadedUser }: SettingsFormsProps) {
  const user = usePreloadedQuery(preloadedUser);
  const { notificationState, showSuccessNotification, setShow } = useSuccessNotification();

  return (
    <>
      <main className="mx-auto max-w-prose flex-1 overflow-y-auto px-4 pt-[4.25rem]">
        <ProfileInfoForm
          fetchedName={user?.name ?? ''}
          fetchedEmail={user?.email ?? ''}
          showSuccessNotification={showSuccessNotification}
        />
        <SectionContainer showBottomBorder>
          <Card>This is card text.</Card>
        </SectionContainer>
        <SectionContainer showBottomBorder={false}>
          <Card>This is card text.</Card>
        </SectionContainer>
      </main>
      <SuccessNotification {...notificationState} setShow={setShow} />
    </>
  );
}
