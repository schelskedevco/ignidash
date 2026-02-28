'use client';

import { track } from '@vercel/analytics';
import posthog from 'posthog-js';

import { authClient } from '@/lib/auth-client';
import GoogleIcon from '@/components/ui/google-icon';

interface GoogleSignInProps {
  safeRedirect: string;
}

export default function GoogleSignIn({ safeRedirect }: GoogleSignInProps) {
  const handleGoogleSignIn = async () => {
    track('Sign in', { signin_method: 'google' });
    posthog.capture('sign_in', {
      signin_method: 'google',
    });
    await authClient.signIn.social({ provider: 'google', callbackURL: safeRedirect });
  };

  return (
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
          className="focus-outline flex w-full items-center justify-center gap-3 rounded-md bg-white px-3 py-2 text-sm font-semibold text-stone-900 shadow-xs inset-ring inset-ring-stone-300 hover:bg-stone-50 focus-visible:inset-ring-transparent dark:bg-white/10 dark:text-white dark:shadow-none dark:inset-ring-white/5 dark:hover:bg-white/20"
        >
          <GoogleIcon className="h-5 w-5" />
          <span className="text-sm/6 font-semibold">Google</span>
        </button>
      </div>
    </div>
  );
}
