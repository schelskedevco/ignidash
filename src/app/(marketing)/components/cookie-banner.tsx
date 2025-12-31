/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import posthog from 'posthog-js';

export default function CookieBanner() {
  const [consentGiven, setConsentGiven] = useState('');

  useEffect(() => {
    setConsentGiven(posthog.get_explicit_consent_status());
  }, []);

  const handleAcceptCookies = () => {
    posthog.opt_in_capturing();
    setConsentGiven('granted');
  };

  const handleDeclineCookies = () => {
    posthog.opt_out_capturing();
    setConsentGiven('denied');
  };

  if (consentGiven !== 'pending') return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 px-6 pb-6">
      <div className="pointer-events-auto max-w-xl rounded-xl bg-white p-6 shadow-lg outline-1 outline-zinc-900/10 dark:bg-zinc-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
        <p className="text-sm/6 text-zinc-900 dark:text-white">
          We use cookies for product analytics to understand how you use the app. For more information, see our{' '}
          <Link
            href="/privacy#cookies"
            className="font-semibold text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            privacy policy
          </Link>
          .
        </p>
        <div className="mt-4 flex items-center gap-x-5">
          <button
            type="button"
            onClick={handleAcceptCookies}
            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:bg-zinc-700 dark:inset-ring dark:inset-ring-white/10 dark:hover:bg-white/15 dark:focus-visible:outline-white"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={handleDeclineCookies}
            className="text-sm/6 font-semibold text-zinc-900 hover:text-zinc-700 dark:text-white dark:hover:text-zinc-300"
          >
            Reject all
          </button>
        </div>
      </div>
    </div>
  );
}
