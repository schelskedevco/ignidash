'use client';

import { useMemo } from 'react';

import SuccessNotification from '@/components/ui/success-notification';
import { useSuccessNotification } from '@/hooks/use-success-notification';
import { authClient } from '@/lib/auth-client';
import { useAccountsList } from '@/hooks/use-accounts-data';
import { useConvexAuth } from 'convex/react';

import ProfileInfoForm from './profile-info-form';

export default function SettingsForms() {
  const auth = useConvexAuth();
  const isAuthenticated = auth.isAuthenticated;

  const { data: authData, isPending: isAuthDataLoading } = authClient.useSession();
  const isEmailVerified = authData?.user.emailVerified ?? false;
  const fetchedName = authData?.user.name ?? '';
  const fetchedEmail = authData?.user.email ?? '';

  const { accounts: accountsData, isLoading: isAccountsDataLoading } = useAccountsList();

  const settingsCapabilities = useMemo(() => {
    const isSignedInWithSocialProvider = accountsData?.some((account) => account.providerId !== 'credential') ?? false;

    return {
      canChangeEmail: !isSignedInWithSocialProvider,
      canChangePassword: !isSignedInWithSocialProvider,
      canChangeName: true,
      isEmailVerified,
    };
  }, [accountsData, isEmailVerified]);

  const { notificationState, showSuccessNotification, setShow } = useSuccessNotification();

  if (isAuthDataLoading || isAccountsDataLoading) {
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
            userData={{ fetchedName, fetchedEmail, ...settingsCapabilities }}
            showSuccessNotification={showSuccessNotification}
          />
        )}
      </main>
      <SuccessNotification {...notificationState} setShow={setShow} />
    </>
  );
}
