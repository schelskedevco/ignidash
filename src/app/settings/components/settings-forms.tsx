'use client';

import { useMemo } from 'react';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

import SuccessNotification from '@/components/ui/success-notification';
import { useSuccessNotification } from '@/hooks/use-success-notification';
import { useAccountsList } from '@/hooks/use-accounts-data';
import { useConvexAuth } from 'convex/react';

import ProfileInfoForm from './profile-info-form';

interface SettingsFormsProps {
  preloadedUser: Preloaded<typeof api.auth.getCurrentUserSafe>;
}

export default function SettingsForms({ preloadedUser }: SettingsFormsProps) {
  const auth = useConvexAuth();
  const isAuthenticated = auth.isAuthenticated;

  const authData = usePreloadedQuery(preloadedUser);
  const isEmailVerified = authData?.emailVerified ?? false;
  const fetchedName = authData?.name ?? '';
  const fetchedEmail = authData?.email ?? '';

  const { accounts: accountsData, isLoading: isAccountsDataLoading } = useAccountsList();

  const settingsCapabilities = useMemo(() => {
    const isSignedInWithSocialProvider = accountsData?.some((account) => account.providerId !== 'credential') ?? false;

    return {
      canChangeEmail: !isSignedInWithSocialProvider,
      canChangePassword: !isSignedInWithSocialProvider,
      canChangeName: true,
    };
  }, [accountsData]);

  const { notificationState, showSuccessNotification, setShow } = useSuccessNotification();

  if (isAccountsDataLoading) {
    return (
      <main className="mx-auto h-full max-w-prose flex-1 overflow-y-auto px-4 pt-[4.25rem]">
        <div
          role="status"
          aria-label="Loading settings"
          className="text-muted-foreground flex h-full items-center justify-center text-2xl sm:text-xl"
        >
          Loading settings<span className="loading-ellipsis" aria-hidden="true"></span>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto h-full max-w-prose flex-1 overflow-y-auto px-4 pt-[4.25rem]">
        {isAuthenticated && (
          <ProfileInfoForm
            userData={{ fetchedName, fetchedEmail, isEmailVerified, ...settingsCapabilities }}
            showSuccessNotification={showSuccessNotification}
          />
        )}
      </main>
      <SuccessNotification {...notificationState} setShow={setShow} />
    </>
  );
}
