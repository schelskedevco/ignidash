'use client';

import { FireIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';
import Link from 'next/link';

import { authClient } from '@/lib/auth-client';

import EmailInput from '../components/email-input';
import PasswordInput from '../components/password-input';

export default function SignInPage() {
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

  const handleGoogleSignIn = async () => await authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard/quick-plan' });

  return (
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

            <div>
              <div className="mt-10 flex items-center gap-x-6">
                <div className="w-full flex-1 border-t border-stone-200 dark:border-white/10" />
                <p className="text-sm/6 font-medium text-nowrap text-stone-900 dark:text-white">Or continue with</p>
                <div className="w-full flex-1 border-t border-stone-200 dark:border-white/10" />
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleSignIn}
                  type="button"
                  className="flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-stone-900 shadow-xs inset-ring inset-ring-stone-300 hover:bg-stone-50 focus-visible:inset-ring-transparent dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
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
                  <span className="text-sm/6 font-semibold">Google</span>
                </button>
              </div>
            </div>
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
  );
}
