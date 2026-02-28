'use client';

import { useState, useEffect } from 'react';
import { CircleUserRoundIcon, MailQuestionMarkIcon } from 'lucide-react';
import { CheckCircleIcon } from '@heroicons/react/20/solid';

import Card from '@/components/ui/card';
import { Input } from '@/components/catalyst/input';
import { Fieldset, FieldGroup, Field, Label, Legend, Description, ErrorMessage } from '@/components/catalyst/fieldset';
import { Button } from '@/components/catalyst/button';
import { Divider } from '@/components/catalyst/divider';
import { authClient } from '@/lib/auth-client';
import { useBetterAuthField } from '@/hooks/use-better-auth-field';
import GoogleIcon from '@/components/ui/google-icon';

import ChangePasswordForm from './change-password-form';

function useNameFieldHook(fetchedName: string, showSuccessNotification: (title: string, desc?: string) => void) {
  const { fieldState: nameFieldState, createCallbacks: nameCallbacks } = useBetterAuthField();

  const [name, setName] = useState(fetchedName);
  const handleNameSave = async () =>
    await authClient.updateUser(
      { name },
      nameCallbacks(() => {
        showSuccessNotification('Name changed successfully!');
      })
    );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (fetchedName) setName(fetchedName);
  }, [fetchedName]);

  return { name, setName, nameFieldState, handleNameSave };
}

function useEmailFieldHook(fetchedEmail: string, showSuccessNotification: (title: string, desc?: string) => void) {
  const { fieldState: emailFieldState, createCallbacks: emailCallbacks } = useBetterAuthField();

  const [email, setEmail] = useState(fetchedEmail);
  const handleEmailSave = async () =>
    await authClient.changeEmail(
      { newEmail: email },
      emailCallbacks(() => showSuccessNotification('Confirmation email sent to your current address!'))
    );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (fetchedEmail) setEmail(fetchedEmail);
  }, [fetchedEmail]);

  return { email, setEmail, emailFieldState, handleEmailSave };
}

function useSendVerificationEmailFieldHook(fetchedEmail: string, showSuccessNotification: (title: string, desc?: string) => void) {
  const { fieldState: sendVerificationEmailState, createCallbacks: sendVerificationEmailCallbacks } = useBetterAuthField();

  const [isVerificationEmailSent, setIsVerificationEmailSent] = useState(false);
  const handleSendVerificationEmail = async () =>
    await authClient.sendVerificationEmail(
      { email: fetchedEmail, callbackURL: '/settings' },
      sendVerificationEmailCallbacks(() => {
        setIsVerificationEmailSent(true);
        showSuccessNotification('Verification email sent!');
      })
    );

  return { isVerificationEmailSent, sendVerificationEmailState, handleSendVerificationEmail };
}

type UserData = {
  fetchedName: string;
  fetchedEmail: string;
  canChangeEmail: boolean;
  canChangePassword: boolean;
  canChangeName: boolean;
  isEmailVerified: boolean;
};

interface ProfileInfoFormProps {
  userData: UserData;
  showSuccessNotification: (title: string, desc?: string) => void;
}

export default function ProfileInfoForm({
  userData: { fetchedName, fetchedEmail, ...otherUserData },
  showSuccessNotification,
}: ProfileInfoFormProps) {
  const { name, setName, nameFieldState, handleNameSave } = useNameFieldHook(fetchedName, showSuccessNotification);
  const { email, setEmail, emailFieldState, handleEmailSave } = useEmailFieldHook(fetchedEmail, showSuccessNotification);
  const { isVerificationEmailSent, sendVerificationEmailState, handleSendVerificationEmail } = useSendVerificationEmailFieldHook(
    fetchedEmail,
    showSuccessNotification
  );

  return (
    <>
      <Card className="my-6">
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset>
            <Legend className="flex items-center gap-2">
              <CircleUserRoundIcon className="text-primary h-6 w-6" aria-hidden="true" />
              Profile information
            </Legend>
            <FieldGroup>
              <div className="flex items-end gap-2">
                <Field className="flex-1" disabled={!otherUserData.canChangeName}>
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
                <Field className="flex-1" disabled={!otherUserData.canChangeEmail}>
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
              {!otherUserData.canChangeEmail && (
                <p className="-mt-2 text-base/6 text-stone-500 data-disabled:opacity-50 sm:text-sm/6 dark:text-stone-400">
                  Your email is linked to your
                  <GoogleIcon className="mx-2 inline-block h-5 w-5 align-middle" />
                  account, so it can&apos;t be changed.
                </p>
              )}
            </FieldGroup>
          </Fieldset>
        </form>
      </Card>
      <Card className="my-6">
        <form onSubmit={(e) => e.preventDefault()}>
          <Fieldset>
            <Legend className="flex items-center gap-2">
              <MailQuestionMarkIcon className="text-primary h-6 w-6" aria-hidden="true" />
              Verify email
            </Legend>
            {otherUserData.isEmailVerified ? (
              <div className="flex items-center justify-center p-8 sm:p-6">
                <div className="shrink-0">
                  <CheckCircleIcon aria-hidden="true" className="size-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-base/6 font-medium sm:text-sm/6">
                    <strong>{fetchedEmail}</strong> is already verified.
                  </p>
                </div>
              </div>
            ) : isVerificationEmailSent ? (
              <div className="flex items-center justify-center p-8 sm:p-6">
                <div className="shrink-0">
                  <CheckCircleIcon aria-hidden="true" className="size-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-base/6 font-medium sm:text-sm/6">
                    Verification email sent to <strong>{fetchedEmail}</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <FieldGroup>
                <Field>
                  <Button
                    color="rose"
                    type="button"
                    className="w-full"
                    data-slot="control"
                    onClick={handleSendVerificationEmail}
                    disabled={sendVerificationEmailState.isLoading}
                  >
                    {sendVerificationEmailState.isLoading ? 'Sending...' : 'Send verification email'}
                  </Button>
                  {sendVerificationEmailState.errorMessage && <ErrorMessage>{sendVerificationEmailState.errorMessage}</ErrorMessage>}
                  <Description>
                    <strong>Important:</strong> Click to receive a verification link in your email. You must verify your email to access all
                    features.
                  </Description>
                </Field>
              </FieldGroup>
            )}
          </Fieldset>
        </form>
      </Card>
      {otherUserData.canChangePassword && <ChangePasswordForm showSuccessNotification={showSuccessNotification} />}
    </>
  );
}
