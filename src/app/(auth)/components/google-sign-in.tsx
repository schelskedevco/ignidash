'use client';

import posthog from 'posthog-js';

import { authClient } from '@/lib/auth-client';

interface GoogleSignInProps {
  safeRedirect: string;
}

export default function GoogleSignIn({ safeRedirect }: GoogleSignInProps) {
  const handleGoogleSignIn = async () => {
    posthog.capture('sign_in', {
      signin_method: 'google',
    });
    await authClient.signIn.social({ provider: 'google', callbackURL: safeRedirect });
  };

  return (
    <div>
      <div className="mt-10 flex items-center gap-x-6">
        <div className="w-full flex-1 border-t border-zinc-200 dark:border-white/10" />
        <p className="text-sm/6 font-medium text-nowrap text-zinc-900 dark:text-white">Or continue with</p>
        <div className="w-full flex-1 border-t border-zinc-200 dark:border-white/10" />
      </div>

      <div className="mt-6">
        <button
          onClick={handleGoogleSignIn}
          type="button"
          className="focus-outline flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-xs inset-ring inset-ring-zinc-300 hover:bg-zinc-50 focus-visible:inset-ring-transparent dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
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
  );
}
