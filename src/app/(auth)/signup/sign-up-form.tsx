'use client';

import { FireIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import posthog from 'posthog-js';

import { authClient } from '@/lib/auth-client';
import { useRedirectUrl } from '@/hooks/use-redirect-url';
import { useRouter } from 'next/navigation';

import EmailInput from '../components/email-input';
import PasswordInput from '../components/password-input';
import GoogleSignIn from '../components/google-sign-in';
import ErrorMessageCard from '@/components/ui/error-message-card';

export default function SignUpForm() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { safeRedirect, buildRedirectUrl } = useRedirectUrl();
  const router = useRouter();

  const handleEmailSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    track('Sign up');

    const formData = new FormData(event.currentTarget);

    const email = formData.get('email') as string;
    const fullName = formData.get('full-name') as string;
    const password = formData.get('password') as string;

    posthog.capture('sign_up', { email, full_name: fullName });

    await authClient.signUp.email(
      { email, password, name: fullName, callbackURL: safeRedirect },
      {
        onRequest() {
          setErrorMessage(null);
          setIsLoading(true);
        },
        onSuccess() {
          setErrorMessage(null);
          setIsLoading(false);
          router.push(safeRedirect);
        },
        onError: (ctx) => {
          setErrorMessage(ctx.error.message);
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
          <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-stone-900 dark:text-white">Sign up for Ignidash</h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className="border-border/25 from-emphasized-background to-background border-y bg-gradient-to-bl px-6 py-12 shadow-sm sm:rounded-lg sm:border sm:px-12 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
            <form onSubmit={handleEmailSignUp} method="POST" className="space-y-6">
              <ErrorMessageCard errorMessage={errorMessage} />
              <EmailInput errorMessage={null} />
              <div>
                <label htmlFor="full-name" className="block text-sm/6 font-medium text-stone-900 dark:text-white">
                  Name
                </label>
                <div className="mt-2">
                  <input
                    id="full-name"
                    name="full-name"
                    type="text"
                    autoComplete="given-name"
                    required
                    className="block w-full rounded-md bg-white px-3 py-1.5 pr-10 text-base text-stone-900 outline-1 -outline-offset-1 outline-stone-400 placeholder:text-stone-400 focus:outline-2 focus:-outline-offset-2 focus:outline-rose-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/25 dark:placeholder:text-stone-500 dark:focus:outline-rose-500"
                  />
                </div>
              </div>
              <PasswordInput passwordType="new" />
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full justify-center rounded-md bg-rose-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-500 dark:shadow-none dark:hover:bg-rose-400 dark:focus-visible:outline-rose-500"
                >
                  {isLoading ? 'Signing up...' : 'Sign up'}
                </button>
              </div>
            </form>
            <GoogleSignIn safeRedirect={safeRedirect} />
          </div>

          <p className="mt-10 text-center text-sm/6 text-stone-500 dark:text-stone-400">
            Already have an account?{' '}
            <Link
              href={buildRedirectUrl('/signin')}
              className="font-semibold text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
            >
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
