'use client';

import { FireIcon } from '@heroicons/react/24/solid';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { track } from '@vercel/analytics';
import posthog from 'posthog-js';

import { authClient } from '@/lib/auth-client';
import SuccessNotification from '@/components/ui/success-notification';
import { useSuccessNotification } from '@/hooks/use-success-notification';
import { useRedirectUrl } from '@/hooks/use-redirect-url';

import EmailInput from '../components/email-input';
import PasswordInput from '../components/password-input';
import GoogleSignIn from '../components/google-sign-in';

export default function SignInForm() {
  const { notificationState, showSuccessNotification, setShow } = useSuccessNotification();

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { safeRedirect, buildRedirectUrl } = useRedirectUrl();

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    track('Sign in');

    const formData = new FormData(event.currentTarget);

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const rememberMe = formData.get('remember-me') === 'on';

    posthog.capture('sign_in', {
      signin_method: 'email',
      remember_me: rememberMe,
    });

    await authClient.signIn.email(
      { email, password, callbackURL: safeRedirect, rememberMe },
      {
        onRequest() {
          setErrorMessage(null);
          setIsLoading(true);
        },
        onSuccess() {
          setErrorMessage(null);
          setIsLoading(false);
        },
        onError: (ctx) => {
          setErrorMessage(ctx.error.message);
          setIsLoading(false);
        },
      }
    );
  };

  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get('reset') === 'success';
  const deletedSuccess = searchParams.get('deleted') === 'success';

  useEffect(() => {
    if (resetSuccess) {
      showSuccessNotification('Password reset successful!', 'You can now sign in with your new password.');
    } else if (deletedSuccess) {
      showSuccessNotification('Account deletion successful!', "We're sorry to see you go.");
    }
  }, [resetSuccess, deletedSuccess, showSuccessNotification]);

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <FireIcon className="text-primary mx-auto h-10 w-auto" />
            <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-stone-900 dark:text-white">Sign in to Ignidash</h2>
          </div>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
            <div className="border-border/25 from-emphasized-background to-background border-y bg-gradient-to-bl px-6 py-12 shadow-sm sm:rounded-lg sm:border sm:px-12 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
              <form onSubmit={handleEmailSignIn} method="POST" className="space-y-6">
                <EmailInput errorMessage={errorMessage} />
                <PasswordInput passwordType="current" />

                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-6 shrink-0 items-center">
                      <div className="group grid size-4 grid-cols-1">
                        <input
                          id="remember-me"
                          name="remember-me"
                          type="checkbox"
                          className="col-start-1 row-start-1 appearance-none rounded-sm border border-stone-300 bg-white checked:border-rose-600 checked:bg-rose-600 indeterminate:border-rose-600 indeterminate:bg-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:border-stone-300 disabled:bg-stone-100 disabled:checked:bg-stone-100 dark:border-white/10 dark:bg-white/5 dark:checked:border-rose-500 dark:checked:bg-rose-500 dark:indeterminate:border-rose-500 dark:indeterminate:bg-rose-500 dark:focus-visible:outline-rose-500 forced-colors:appearance-auto"
                          defaultChecked
                        />
                        <svg
                          fill="none"
                          viewBox="0 0 14 14"
                          className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-stone-950/25 dark:group-has-disabled:stroke-white/25"
                        >
                          <path
                            d="M3 8L6 11L11 3.5"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="opacity-0 group-has-checked:opacity-100"
                          />
                          <path
                            d="M3 7H11"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="opacity-0 group-has-indeterminate:opacity-100"
                          />
                        </svg>
                      </div>
                    </div>
                    <label htmlFor="remember-me" className="block text-sm/6 text-stone-900 dark:text-white">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm/6">
                    <Link
                      href={buildRedirectUrl('/forgot-password')}
                      className="font-semibold text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full justify-center rounded-md bg-rose-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-rose-500 dark:shadow-none dark:hover:bg-rose-400 dark:focus-visible:outline-rose-500"
                  >
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </button>
                </div>
              </form>
              <GoogleSignIn safeRedirect={safeRedirect} />
            </div>

            <p className="mt-10 text-center text-sm/6 text-stone-500 dark:text-stone-400">
              New to Ignidash?{' '}
              <Link
                href={buildRedirectUrl('/signup')}
                className="font-semibold text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
        <p className="pb-6 text-center text-xs/6 text-stone-500 dark:text-stone-400">
          By signing in, you agree to the{' '}
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
      <SuccessNotification {...notificationState} setShow={setShow} />
    </>
  );
}
