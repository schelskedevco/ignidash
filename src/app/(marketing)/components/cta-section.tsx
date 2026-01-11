import Link from 'next/link';

import CTADashboardLink from './cta-dashboard-link';

export default function CTASection() {
  return (
    <div>
      <div className="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="relative isolate overflow-hidden bg-stone-900 px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16 dark:shadow-none dark:after:pointer-events-none dark:after:absolute dark:after:inset-0 dark:after:inset-ring dark:after:inset-ring-white/10 dark:after:sm:rounded-3xl">
          <h2 className="text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl">Plan with (artificial) intelligence</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg/8 text-pretty text-stone-300">
            Powerful projections with plain-English explanations, so you can{' '}
            <span className="text-stone-100 underline decoration-stone-600 underline-offset-4">actually understand your plan</span>. Free to
            get started.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <CTADashboardLink />
            <Link href="/pricing" className="text-sm/6 font-semibold text-white">
              View pricing <span aria-hidden="true">→</span>
            </Link>
          </div>
          <svg
            viewBox="0 0 1024 1024"
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -z-10 size-256 -translate-x-1/2 mask-[radial-gradient(closest-side,white,transparent)]"
          >
            <circle r={512} cx={512} cy={512} fill="url(#827591b1-ce8c-4110-b064-7cb85a0b1217)" fillOpacity="0.7" />
            <defs>
              <radialGradient id="827591b1-ce8c-4110-b064-7cb85a0b1217">
                <stop stopColor="#e11d48" />
                <stop offset={1} stopColor="#ff80b5" />
              </radialGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}
