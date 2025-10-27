'use client';

import { useMemo } from 'react';

import SuccessNotification from '@/components/ui/success-notification';
import { useSuccessNotification } from '@/hooks/use-success-notification';
import { authClient } from '@/lib/auth-client';
import { useAccountsList } from '@/hooks/use-accounts-data';

import ProfileInfoForm from './profile-info-form';

export default function SettingsForms() {
  const { data } = authClient.useSession();

  const isEmailVerified = data?.user.emailVerified ?? false;
  const fetchedName = data?.user.name ?? '';
  const fetchedEmail = data?.user.email ?? '';

  const { accounts } = useAccountsList();

  const settingsCapabilities = useMemo(() => {
    const isSignedInWithSocialProvider = accounts?.some((account) => account.providerId !== 'credential') ?? false;

    return {
      canChangeEmail: !isSignedInWithSocialProvider,
      canChangePassword: !isSignedInWithSocialProvider,
      canChangeName: true,
      isEmailVerified,
    };
  }, [accounts, isEmailVerified]);

  const { notificationState, showSuccessNotification, setShow } = useSuccessNotification();

  return (
    <>
      <main className="mx-auto max-w-prose flex-1 overflow-y-auto px-4 pt-[4.25rem]">
        <ProfileInfoForm
          userData={{ fetchedName, fetchedEmail, ...settingsCapabilities }}
          showSuccessNotification={showSuccessNotification}
        />
      </main>
      <SuccessNotification {...notificationState} setShow={setShow} />
    </>
  );
}
