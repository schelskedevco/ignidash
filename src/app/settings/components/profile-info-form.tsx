/* eslint-disable react-hooks/set-state-in-effect */
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
import { useAccountSettingsFieldState } from '@/hooks/use-account-settings-field-state';

import ChangePasswordForm from './change-password-form';

function useNameFieldHook(fetchedName: string, showSuccessNotification: (title: string, desc?: string) => void) {
  const { fieldState: nameFieldState, createCallbacks: nameCallbacks } = useAccountSettingsFieldState();

  const [name, setName] = useState(fetchedName);
  const handleNameSave = async () =>
    await authClient.updateUser(
      { name },
      nameCallbacks(() => {
        showSuccessNotification('Name changed successfully!');
      })
    );

  useEffect(() => {
    if (fetchedName) setName(fetchedName);
  }, [fetchedName]);

  return { name, setName, nameFieldState, handleNameSave };
}

function useEmailFieldHook(fetchedEmail: string, showSuccessNotification: (title: string, desc?: string) => void) {
  const { fieldState: emailFieldState, createCallbacks: emailCallbacks } = useAccountSettingsFieldState();

  const [email, setEmail] = useState(fetchedEmail);
  const handleEmailSave = async () =>
    await authClient.changeEmail(
      { newEmail: email },
      emailCallbacks(() => showSuccessNotification('Confirmation email sent to your current address!'))
    );

  useEffect(() => {
    if (fetchedEmail) setEmail(fetchedEmail);
  }, [fetchedEmail]);

  return { email, setEmail, emailFieldState, handleEmailSave };
}

function useSendVerificationEmailFieldHook(fetchedEmail: string, showSuccessNotification: (title: string, desc?: string) => void) {
  const { fieldState: sendVerificationEmailState, createCallbacks: sendVerificationEmailCallbacks } = useAccountSettingsFieldState();

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
                <p className="-mt-2 text-base/6 text-zinc-500 data-disabled:opacity-50 sm:text-sm/6 dark:text-zinc-400">
                  Your email is linked to your
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="mx-2 inline-block h-5 w-5 align-middle">
                    <path
                      d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                      fill="#EA4335"
                    />
                    <path
                      d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                      fill="#4285F4"
                    />
                    <path
                      d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.2654 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                      fill="#34A853"
                    />
                  </svg>
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
