'use client';

import { FireIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import Link from 'next/link';

import { authClient } from '@/lib/auth-client';

import EmailInput from '../components/email-input';

export default function ForgotPasswordPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRequestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;

    await authClient.requestPasswordReset(
      {
        email,
        redirectTo: '/reset-password',
      },
      {
        onError: (ctx) => {
          setErrorMessage(ctx.error.message);
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
          <div className="border-border/25 from-emphasized-background to-background border bg-gradient-to-bl px-6 py-12 shadow-sm sm:rounded-lg sm:px-12 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
            <form onSubmit={handleRequestReset} method="POST" className="space-y-6">
              <EmailInput errorMessage={errorMessage} />

              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-rose-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 dark:bg-rose-500 dark:shadow-none dark:hover:bg-rose-400 dark:focus-visible:outline-rose-500"
                >
                  Send Reset Link
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
