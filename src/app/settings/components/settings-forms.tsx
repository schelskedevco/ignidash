'use client';

import { useMemo } from 'react';
import { Preloaded, usePreloadedQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

import SuccessNotification from '@/components/ui/success-notification';
import { useSuccessNotification } from '@/hooks/use-success-notification';
import { useAccountsList } from '@/hooks/use-accounts-data';
import { useConvexAuth } from 'convex/react';

import ProfileInfoForm from './profile-info-form';
import DataSettingsForm from './data-settings-form';

interface SettingsFormsProps {
  preloadedUser: Preloaded<typeof api.auth.getCurrentUserSafe>;
}

export default function SettingsForms({ preloadedUser }: SettingsFormsProps) {
  const auth = useConvexAuth();
  const isAuthenticated = auth.isAuthenticated;
  const isAuthLoading = auth.isLoading;

  const authData = usePreloadedQuery(preloadedUser);
  const { accounts: accountsData, isLoading: isAccountsDataLoading } = useAccountsList();

  const settingsCapabilities = useMemo(() => {
    const isSignedInWithSocialProvider = accountsData?.some((account) => account.providerId !== 'credential') ?? false;

    return {
      canChangeEmail: isAuthenticated && !isSignedInWithSocialProvider,
      canChangePassword: isAuthenticated && !isSignedInWithSocialProvider,
      canChangeName: isAuthenticated,
    };
  }, [accountsData, isAuthenticated]);

  const { notificationState, showSuccessNotification, setShow } = useSuccessNotification();

  if (isAccountsDataLoading || isAuthLoading || (isAuthenticated && !authData)) {
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

  const isEmailVerified = authData?.emailVerified ?? false;
  const fetchedName = authData?.name ?? '';
  const fetchedEmail = authData?.email ?? '';

  return (
    <>
      <main className="h-full overflow-y-auto">
        <div className="mx-auto h-full max-w-prose px-4 pt-[4.25rem] sm:px-6 lg:px-8">
          {isAuthenticated && (
            <ProfileInfoForm
              userData={{ fetchedName, fetchedEmail, isEmailVerified, ...settingsCapabilities }}
              showSuccessNotification={showSuccessNotification}
            />
          )}
          <DataSettingsForm showSuccessNotification={showSuccessNotification} isAuthenticated={isAuthenticated} />
        </div>
      </main>
      <SuccessNotification {...notificationState} setShow={setShow} />
    </>
  );
}
