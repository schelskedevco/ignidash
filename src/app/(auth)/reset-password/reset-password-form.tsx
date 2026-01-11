'use client';

import { FireIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { track } from '@vercel/analytics';
import posthog from 'posthog-js';

import ErrorMessageCard from '@/components/ui/error-message-card';
import { authClient } from '@/lib/auth-client';
import { useRedirectUrl } from '@/hooks/use-redirect-url';

import PasswordInput from '../components/password-input';

export default function ResetPasswordForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [attemptedResetWithoutToken, setAttemptedResetWithoutToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { buildRedirectUrl } = useRedirectUrl();

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    track('Reset password');
    posthog.capture('reset_password');

    const token = searchParams.get('token');
    if (!token) {
      setErrorMessage('Invalid or missing token. Please request a new password reset link.');
      setAttemptedResetWithoutToken(true);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const newPassword = formData.get('password') as string;

    await authClient.resetPassword(
      {
        newPassword,
        token,
      },
      {
        onRequest() {
          setErrorMessage(null);
          setIsLoading(true);
        },
        onSuccess() {
          setErrorMessage(null);
          setIsLoading(false);
          router.push(buildRedirectUrl('/signin?reset=success'));
        },
        onError(context) {
          setErrorMessage(context.error.message);
          setIsLoading(false);
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <FireIcon className="text-primary mx-auto h-10 w-auto" />
          <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-stone-900 dark:text-white">Reset Your Password</h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="border-border/25 from-emphasized-background to-background border-y bg-gradient-to-bl px-6 py-12 shadow-sm sm:rounded-lg sm:border sm:px-12 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
            <form onSubmit={handleResetPassword} method="POST" className="space-y-6">
              <ErrorMessageCard errorMessage={errorMessage} />
              <PasswordInput passwordType="new" isPasswordReset />
              <div>
                <button
                  type="submit"
                  disabled={isLoading || attemptedResetWithoutToken}
                  className="flex w-full justify-center rounded-md bg-rose-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-500 dark:shadow-none dark:hover:bg-rose-400 dark:focus-visible:outline-rose-500"
                >
                  {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <p className="pb-6 text-center text-xs/6 text-stone-500 dark:text-stone-400">
        <Link href="/terms" className="underline hover:text-stone-700 dark:hover:text-stone-300">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-stone-700 dark:hover:text-stone-300">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
