'use client';

import { FireIcon } from '@heroicons/react/24/solid';
import { CheckCircleIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import posthog from 'posthog-js';

import { authClient } from '@/lib/auth-client';
import { useRedirectUrl } from '@/hooks/use-redirect-url';

import EmailInput from '../components/email-input';

export default function ForgotPasswordForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { buildRedirectUrl } = useRedirectUrl();

  const handleRequestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    track('Request password reset');

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;

    posthog.capture('request_password_reset', { email });

    await authClient.requestPasswordReset(
      {
        email,
        redirectTo: buildRedirectUrl('/reset-password'),
      },
      {
        onError: (ctx) => {
          setErrorMessage(ctx.error.message);
          setDataMessage(null);
          setIsLoading(false);
        },
        onRequest() {
          setErrorMessage(null);
          setDataMessage(null);
          setIsLoading(true);
        },
        onSuccess: (ctx) => {
          setErrorMessage(null);
          setDataMessage(ctx.data.message);
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
          <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-zinc-900 dark:text-white">Reset Your Password</h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="border-border/25 from-emphasized-background to-background border-y bg-gradient-to-bl px-6 py-12 shadow-sm sm:rounded-lg sm:border sm:px-12 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
            {dataMessage ? (
              <div className="flex">
                <div className="shrink-0">
                  <CheckCircleIcon aria-hidden="true" className="size-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{dataMessage}</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRequestReset} method="POST" className="space-y-6">
                <EmailInput errorMessage={errorMessage} />

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full justify-center rounded-md bg-rose-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-500 dark:shadow-none dark:hover:bg-rose-400 dark:focus-visible:outline-rose-500"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      <p className="pb-6 text-center text-xs/6 text-zinc-500 dark:text-zinc-400">
        <Link href="/terms" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
