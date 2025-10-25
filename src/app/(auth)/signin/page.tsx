'use client';

import { FireIcon } from '@heroicons/react/24/solid';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { authClient } from '@/lib/auth-client';

import EmailInput from '../components/email-input';
import PasswordInput from '../components/password-input';
import GoogleSignIn from '../components/google-sign-in';

export default function SignInPage() {
  const [showNotification, setShowNotification] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleEmailSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const rememberMe = formData.get('remember-me') === 'on';

    await authClient.signIn.email(
      { email, password, callbackURL: '/dashboard/quick-plan', rememberMe },
      {
        onError: (ctx) => {
          setErrorMessage(ctx.error.message);
        },
      }
    );
  };

  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get('reset') === 'success';

  useEffect(() => {
    if (resetSuccess) {
      setShowNotification(true);

      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [resetSuccess]);

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <div className="flex flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <FireIcon className="text-primary mx-auto h-10 w-auto" />
            <h2 className="mt-6 text-center text-2xl/9 font-bold tracking-tight text-stone-900 dark:text-white">Sign in to Ignidash</h2>
          </div>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
            <div className="border-border/25 from-emphasized-background to-background border bg-gradient-to-bl px-6 py-12 shadow-sm sm:rounded-lg sm:px-12 dark:shadow-none dark:outline dark:-outline-offset-1 dark:outline-white/10">
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
                      href="/forgot-password"
                      className="font-semibold text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
                    >
                      Forgot password?
                    </Link>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    className="flex w-full justify-center rounded-md bg-rose-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 dark:bg-rose-500 dark:shadow-none dark:hover:bg-rose-400 dark:focus-visible:outline-rose-500"
                  >
                    Sign in
                  </button>
                </div>
              </form>

              <GoogleSignIn />
            </div>

            <p className="mt-10 text-center text-sm/6 text-stone-500 dark:text-stone-400">
              New to Ignidash?{' '}
              <Link href="/signup" className="font-semibold text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300">
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
      <div aria-live="assertive" className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6">
        <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
          <Transition show={showNotification}>
            <div className="bg-emphasized-background pointer-events-auto w-full max-w-sm rounded-lg shadow-lg outline-1 outline-black/5 transition data-closed:opacity-0 data-enter:transform data-enter:duration-300 data-enter:ease-out data-closed:data-enter:translate-y-2 data-leave:duration-100 data-leave:ease-in data-closed:data-enter:sm:translate-x-2 data-closed:data-enter:sm:translate-y-0 dark:-outline-offset-1 dark:outline-white/10">
              <div className="p-4">
                <div className="flex items-start">
                  <div className="shrink-0">
                    <CheckCircleIcon aria-hidden="true" className="size-6 text-green-400" />
                  </div>
                  <div className="ml-3 w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-stone-900 dark:text-white">Password reset successful!</p>
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">You can now sign in with your new password.</p>
                  </div>
                  <div className="ml-4 flex shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowNotification(false)}
                      className="inline-flex rounded-md text-stone-400 hover:text-stone-500 focus:outline-2 focus:outline-offset-2 focus:outline-rose-600 dark:hover:text-white dark:focus:outline-rose-500"
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon aria-hidden="true" className="size-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </>
  );
}
