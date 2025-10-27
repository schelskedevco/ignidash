'use client';

import { Preloaded, usePreloadedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

import Card from '@/components/ui/card';
import SuccessNotification from '@/components/ui/success-notification';
import { useSuccessNotification } from '@/hooks/use-success-notification';

import ProfileInfoForm from './profile-info-form';

interface SettingsFormsProps {
  preloadedUser: Preloaded<typeof api.auth.getCurrentUserSafe>;
  preloadedSettingsCapabilities: Preloaded<typeof api.auth.getUserSettingsCapabilities>;
}

export default function SettingsForms({ preloadedUser, preloadedSettingsCapabilities }: SettingsFormsProps) {
  const user = usePreloadedQuery(preloadedUser);
  const settingsCapabilities = usePreloadedQuery(preloadedSettingsCapabilities);

  const { notificationState, showSuccessNotification, setShow } = useSuccessNotification();

  return (
    <>
      <main className="mx-auto max-w-prose flex-1 overflow-y-auto px-4 pt-[4.25rem]">
        <ProfileInfoForm
          userData={{ fetchedName: user?.name ?? '', fetchedEmail: user?.email ?? '', ...settingsCapabilities }}
          showSuccessNotification={showSuccessNotification}
        />
        <Card>This is card text.</Card>
      </main>
      <SuccessNotification {...notificationState} setShow={setShow} />
    </>
  );
}
