import { Link } from '@/components/catalyst/link';
import { XMarkIcon } from '@heroicons/react/20/solid';

interface BannerProps {
  setShowBanner: (show: boolean) => void;
}

export default function Banner({ setShowBanner }: BannerProps) {
  return (
    <div className="border-border/25 relative isolate flex items-center gap-x-6 overflow-hidden border-b bg-stone-50 px-6 py-2.5 sm:px-3.5 sm:before:flex-1 dark:bg-stone-800/50 dark:after:pointer-events-none dark:after:absolute dark:after:inset-x-0 dark:after:bottom-0 dark:after:h-px dark:after:bg-white/10">
      <div aria-hidden="true" className="absolute top-1/2 left-[max(-7rem,calc(50%-52rem))] -z-10 -translate-y-1/2 transform-gpu blur-2xl">
        <div
          style={{
            clipPath:
              'polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)',
          }}
          className="aspect-577/310 w-144.25 bg-linear-to-r from-[#ff80b5] to-[#e11d48] opacity-30 dark:opacity-40"
        />
      </div>
      <div aria-hidden="true" className="absolute top-1/2 left-[max(45rem,calc(50%+8rem))] -z-10 -translate-y-1/2 transform-gpu blur-2xl">
        <div
          style={{
            clipPath:
              'polygon(74.8% 41.9%, 97.2% 73.2%, 100% 34.9%, 92.5% 0.4%, 87.5% 0%, 75% 28.6%, 58.5% 54.6%, 50.1% 56.8%, 46.9% 44%, 48.3% 17.4%, 24.7% 53.9%, 0% 27.9%, 11.9% 74.2%, 24.9% 54.1%, 68.6% 100%, 74.8% 41.9%)',
          }}
          className="aspect-577/310 w-144.25 bg-linear-to-r from-[#ff80b5] to-[#e11d48] opacity-30 dark:opacity-40"
        />
      </div>
      <p className="text-sm/6 text-stone-900 dark:text-stone-100">
        Beta users receive 50% off their first month when subscriptions launch.{' '}
        <Link
          href="/signup"
          className="font-semibold whitespace-nowrap text-stone-900 hover:text-stone-700 dark:text-white dark:hover:text-stone-300"
        >
          Sign up today&nbsp;<span aria-hidden="true">&rarr;</span>
        </Link>
      </p>
      <div className="flex flex-1 justify-end">
        <button type="button" className="-m-3 p-3 focus-visible:-outline-offset-4" onClick={() => setShowBanner(false)}>
          <span className="sr-only">Dismiss</span>
          <XMarkIcon aria-hidden="true" className="size-5 text-stone-900 dark:text-stone-100" />
        </button>
      </div>
    </div>
  );
}
