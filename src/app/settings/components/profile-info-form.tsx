'use client';

import { useState, useEffect } from 'react';

import Card from '@/components/ui/card';
import { Input } from '@/components/catalyst/input';
import { Fieldset, FieldGroup, Field, Label, Legend, ErrorMessage } from '@/components/catalyst/fieldset';
import { Button } from '@/components/catalyst/button';
import { Divider } from '@/components/catalyst/divider';
import { DialogActions } from '@/components/catalyst/dialog';
import { authClient } from '@/lib/auth-client';

type FieldState = {
  dataMessage: string | null;
  isLoading: boolean;
  errorMessage: string | null;
};

type UserData = {
  fetchedName: string;
  fetchedEmail: string;
  isSignedInWithSocialProvider: boolean;
  canChangeEmail: boolean;
  canChangePassword: boolean;
  canChangeName: boolean;
};

interface ProfileInfoFormProps {
  userData: UserData;
  showSuccessNotification: (title: string, desc: string) => void;
}

export default function ProfileInfoForm({
  userData: { fetchedName, fetchedEmail, isSignedInWithSocialProvider },
  showSuccessNotification,
}: ProfileInfoFormProps) {
  const [name, setName] = useState(fetchedName);
  const [nameFieldState, setNameFieldState] = useState<FieldState>({
    dataMessage: null,
    isLoading: false,
    errorMessage: null,
  });

  useEffect(() => {
    if (fetchedName) setName(fetchedName);
  }, [fetchedName]);

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

  const [email, setEmail] = useState(fetchedEmail);
  const [emailFieldState, setEmailFieldState] = useState<FieldState>({
    dataMessage: null,
    isLoading: false,
    errorMessage: null,
  });

  useEffect(() => {
    if (fetchedEmail) setEmail(fetchedEmail);
  }, [fetchedEmail]);

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
      <Card>
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset>
            <Legend>Profile information</Legend>
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
                <Button color="rose" type="button" onClick={handleNameSave} disabled={name === fetchedName || nameFieldState.isLoading}>
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
                <Button color="rose" type="button" onClick={handleEmailSave} disabled={email === fetchedEmail || emailFieldState.isLoading}>
                  {emailFieldState.isLoading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </FieldGroup>
          </Fieldset>
        </form>
      </Card>
      <Card>
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset>
            <Legend>Change password</Legend>
            <FieldGroup>
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
                  {passwordFieldState.isLoading ? 'Saving...' : 'Save'}
                </Button>
              </DialogActions>
            </FieldGroup>
          </Fieldset>
        </form>
      </Card>
    </>
  );
}
