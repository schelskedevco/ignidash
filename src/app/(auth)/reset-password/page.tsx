'use client';

import { FireIcon } from '@heroicons/react/24/solid';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

import { authClient } from '@/lib/auth-client';

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      alert('Invalid or missing token. Please request a new password reset link.');
      return;
    }

    const formData = new FormData(event.currentTarget);
    const newPassword = formData.get('password') as string;

    await authClient.resetPassword({
      newPassword,
      token,
    });
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
            <form onSubmit={handleResetPassword} method="POST" className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm/6 font-medium text-stone-900 dark:text-white">
                  New Password
                </label>
                <div className="relative mt-2">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    className="block w-full rounded-md bg-white px-3 py-1.5 pr-10 text-base text-stone-900 outline-1 -outline-offset-1 outline-stone-400 placeholder:text-stone-400 focus:outline-2 focus:-outline-offset-2 focus:outline-rose-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/25 dark:placeholder:text-stone-500 dark:focus:outline-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-rose-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-rose-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 dark:bg-rose-500 dark:shadow-none dark:hover:bg-rose-400 dark:focus-visible:outline-rose-500"
                >
                  Reset Password
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
