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
      <div className="pointer-events-auto max-w-xl rounded-xl bg-white p-6 shadow-lg outline-1 outline-gray-900/10 dark:bg-gray-800 dark:shadow-none dark:-outline-offset-1 dark:outline-white/10">
        <p className="text-sm/6 text-gray-900 dark:text-white">
          This website uses cookies to supplement a balanced diet and provide a much deserved reward to the senses after consuming bland but
          nutritious meals. Accepting our cookies is optional but recommended, as they are delicious. See our{' '}
          <Link href="/privacy" className="font-semibold text-rose-600 hover:text-rose-500 dark:text-rose-400 dark:hover:text-rose-300">
            cookie policy
          </Link>
          .
        </p>
        <div className="mt-4 flex items-center gap-x-5">
          <button
            type="button"
            onClick={handleAcceptCookies}
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:bg-gray-700 dark:inset-ring dark:inset-ring-white/10 dark:hover:bg-white/15 dark:focus-visible:outline-white"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={handleDeclineCookies}
            className="text-sm/6 font-semibold text-gray-900 hover:text-gray-700 dark:text-white dark:hover:text-gray-300"
          >
            Reject all
          </button>
        </div>
      </div>
    </div>
  );
}
