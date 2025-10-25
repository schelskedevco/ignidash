'use client';

import { FireIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import Link from 'next/link';

import { authClient } from '@/lib/auth-client';

import EmailInput from '../components/email-input';
import PasswordInput from '../components/password-input';
import GoogleSignIn from '../components/google-sign-in';

export default function SignUpPage() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEmailSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    await authClient.signUp.email(
      { email, password, name: email.split('@')[0], callbackURL: '/dashboard/quick-plan' },
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
          <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-stone-900 dark:text-white">Sign up for Ignidash</h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="border-border/25 from-emphasized-background to-background border bg-gradient-to-bl px-6 py-12 shadow-sm sm:rounded-lg sm:px-12 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
            <form onSubmit={handleEmailSignUp} method="POST" className="space-y-6">
              <EmailInput errorMessage={errorMessage} />
              <PasswordInput passwordType="new" />

              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-rose-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 dark:bg-rose-500 dark:shadow-none dark:hover:bg-rose-400 dark:focus-visible:outline-rose-500"
                >
                  Sign up
                </button>
              </div>
            </form>

            <GoogleSignIn />
          </div>

          <p className="mt-10 text-center text-sm/6 text-stone-500 dark:text-stone-400">
            Already have an account?{' '}
            <Link href="/signin" className="font-semibold text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
      <p className="pb-6 text-center text-xs/6 text-stone-500 dark:text-stone-400">
        By creating an account, you agree to the{' '}
        <Link href="/terms" className="underline hover:text-stone-700 dark:hover:text-stone-300">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="underline hover:text-stone-700 dark:hover:text-stone-300">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
