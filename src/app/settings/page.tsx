'use client';

import { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

import Card from '@/components/ui/card';
import SectionContainer from '@/components/ui/section-container';
import { Input } from '@/components/catalyst/input';
import { Fieldset, FieldGroup, Field, Label, Legend, ErrorMessage } from '@/components/catalyst/fieldset';
import { Button } from '@/components/catalyst/button';
import { Text } from '@/components/catalyst/text';
import { Divider } from '@/components/catalyst/divider';
import { DialogActions } from '@/components/catalyst/dialog';
import { authClient } from '@/lib/auth-client';
import SuccessNotification from '@/components/ui/success-notification';
import { useSuccessNotification } from '@/hooks/use-success-notification';

import SettingsNavbar from './settings-navbar';

type FieldState = {
  dataMessage: string | null;
  isLoading: boolean;
  errorMessage: string | null;
};

export default function SettingsPage() {
  const { notificationState, showSuccessNotification, setShow } = useSuccessNotification();

  const user = useQuery(api.auth.getCurrentUserSafe);

  const currentName = user?.name ?? '';
  const [name, setName] = useState(currentName);
  const [nameFieldState, setNameFieldState] = useState<FieldState>({
    dataMessage: null,
    isLoading: false,
    errorMessage: null,
  });

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const handleNameSave = async () => {
    await authClient.updateUser(
      { name },
      {
        onError: (ctx) => {
          setNameFieldState({ errorMessage: ctx.error.message, dataMessage: null, isLoading: false });
        },
        onRequest() {
          setNameFieldState({ errorMessage: null, dataMessage: null, isLoading: true });
        },
        onSuccess: (ctx) => {
          setNameFieldState({ errorMessage: null, dataMessage: ctx.data.message, isLoading: false });
          showSuccessNotification('Update successful!', ctx.data.message);
        },
      }
    );
  };

  const currentEmail = user?.email ?? '';
  const [email, setEmail] = useState(currentEmail);
  const [emailFieldState, setEmailFieldState] = useState<FieldState>({
    dataMessage: null,
    isLoading: false,
    errorMessage: null,
  });

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  const handleEmailSave = async () => {
    await authClient.changeEmail(
      { newEmail: email },
      {
        onError: (ctx) => {
          setEmailFieldState({ errorMessage: ctx.error.message, dataMessage: null, isLoading: false });
        },
        onRequest() {
          setEmailFieldState({ errorMessage: null, dataMessage: null, isLoading: true });
        },
        onSuccess: (ctx) => {
          setEmailFieldState({ errorMessage: null, dataMessage: ctx.data.message, isLoading: false });
          showSuccessNotification('Update successful!', ctx.data.message);
        },
      }
    );
  };

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordFieldState, setPasswordFieldState] = useState<FieldState>({
    dataMessage: null,
    isLoading: false,
    errorMessage: null,
  });

  const handlePasswordSave = async () => {
    await authClient.changePassword(
      { currentPassword, newPassword, revokeOtherSessions: true },
      {
        onError: (ctx) => {
          setPasswordFieldState({ errorMessage: ctx.error.message, dataMessage: null, isLoading: false });
        },
        onRequest() {
          setPasswordFieldState({ errorMessage: null, dataMessage: null, isLoading: true });
        },
        onSuccess: (ctx) => {
          setPasswordFieldState({ errorMessage: null, dataMessage: ctx.data.message, isLoading: false });
          setCurrentPassword('');
          setNewPassword('');
          showSuccessNotification('Update successful!', ctx.data.message);
        },
      }
    );
  };

  return (
    <>
      <SettingsNavbar />
      <main className="mx-auto max-w-prose flex-1 overflow-y-auto px-4 pt-[4.25rem]">
        <SectionContainer showBottomBorder>
          <Card>
            <form onSubmit={(e) => e.preventDefault()}>
              <Fieldset>
                <Legend>Profile information</Legend>
                <Text>Update your name, email, and password.</Text>
                <FieldGroup>
                  <div className="flex items-end gap-2">
                    <Field className="flex-1">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        autoComplete="given-name"
                        inputMode="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        invalid={!!nameFieldState.errorMessage}
                        aria-invalid={!!nameFieldState.errorMessage}
                      />
                      {nameFieldState.errorMessage && <ErrorMessage>{nameFieldState.errorMessage}</ErrorMessage>}
                    </Field>
                    <Button color="rose" type="button" onClick={handleNameSave} disabled={name === currentName || nameFieldState.isLoading}>
                      {nameFieldState.isLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                  <Divider />
                  <div className="flex items-end gap-2">
                    <Field className="flex-1">
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        name="email"
                        autoComplete="email"
                        inputMode="text"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        invalid={!!emailFieldState.errorMessage}
                        aria-invalid={!!emailFieldState.errorMessage}
                      />
                      {emailFieldState.errorMessage && <ErrorMessage>{emailFieldState.errorMessage}</ErrorMessage>}
                    </Field>
                    <Button
                      color="rose"
                      type="button"
                      onClick={handleEmailSave}
                      disabled={email === currentEmail || emailFieldState.isLoading}
                    >
                      {emailFieldState.isLoading ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                  <Divider />
                  <Field className="flex-1">
                    <Label htmlFor="current-password">Current password</Label>
                    <Input
                      id="current-password"
                      name="current-password"
                      type="password"
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      invalid={!!passwordFieldState.errorMessage}
                      aria-invalid={!!passwordFieldState.errorMessage}
                    />
                  </Field>
                  <Field className="flex-1">
                    <Label htmlFor="new-password">New password</Label>
                    <Input
                      id="new-password"
                      name="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      invalid={!!passwordFieldState.errorMessage}
                      aria-invalid={!!passwordFieldState.errorMessage}
                    />
                    {passwordFieldState.errorMessage && <ErrorMessage>{passwordFieldState.errorMessage}</ErrorMessage>}
                  </Field>
                  <DialogActions>
                    <Button
                      color="rose"
                      type="button"
                      onClick={handlePasswordSave}
                      disabled={!currentPassword || !newPassword || passwordFieldState.isLoading}
                    >
                      {passwordFieldState.isLoading ? 'Updating password...' : 'Update password'}
                    </Button>
                  </DialogActions>
                </FieldGroup>
              </Fieldset>
            </form>
          </Card>
        </SectionContainer>
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
