'use client';

import { useMemo } from 'react';
import { Preloaded, useConvexAuth, Authenticated } from 'convex/react';
import { usePreloadedAuthQuery } from '@convex-dev/better-auth/nextjs/client';
import { api } from '@/convex/_generated/api';

import SuccessNotification from '@/components/ui/success-notification';
import { useSuccessNotification } from '@/hooks/use-success-notification';
import { useAccountsList } from '@/hooks/use-accounts-data';
import PageLoading from '@/components/ui/page-loading';

import ProfileInfoForm from './profile-info-form';
import DataSettingsForm from './data-settings-form';
import BillingForm from './billing-form';

interface SettingsFormsProps {
  preloadedUser: Preloaded<typeof api.auth.getCurrentUserSafe>;
}

export default function SettingsForms({ preloadedUser }: SettingsFormsProps) {
  const auth = useConvexAuth();
  const isAuthenticated = auth.isAuthenticated;
  const isAuthLoading = auth.isLoading;

  const authData = usePreloadedAuthQuery(preloadedUser);
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
      <main className="mx-auto flex min-h-dvh max-w-prose items-center justify-center px-2 pt-[4.25rem]">
        <PageLoading ariaLabel="Loading settings" message="Loading settings" />
      </main>
    );
  }

  const isEmailVerified = authData?.emailVerified ?? false;
  const fetchedName = authData?.name ?? '';
  const fetchedEmail = authData?.email ?? '';

  return (
    <>
      <main className="mx-auto min-h-dvh max-w-prose px-2 pt-[4.25rem] pb-[2.125rem] sm:px-3 lg:px-4">
        <Authenticated>
          <ProfileInfoForm
            userData={{ fetchedName, fetchedEmail, isEmailVerified, ...settingsCapabilities }}
            showSuccessNotification={showSuccessNotification}
          />
          {false && <BillingForm customerState={{ activeSubscriptions: [] }} />}
          <DataSettingsForm showSuccessNotification={showSuccessNotification} />
        </Authenticated>
      </main>
      <SuccessNotification {...notificationState} setShow={setShow} />
    </>
  );
}
