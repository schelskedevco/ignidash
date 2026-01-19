import Image from 'next/image';
import Link from 'next/link';

import HeroDashboardLink from './hero-dashboard-link';

export default function HeroSection() {
  return (
    <div className="relative isolate px-6 pt-14 lg:px-8">
      <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#e11d48] opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
        />
      </div>
      <div className="mx-auto max-w-2xl pt-32 sm:pt-48 lg:pt-56">
        <div className="hidden sm:mb-8 sm:flex sm:justify-center">
          <div className="relative rounded-full px-3 py-1 text-sm/6 text-stone-600 ring-1 ring-stone-900/10 hover:ring-stone-900/20 dark:text-stone-300 dark:ring-white/10 dark:hover:ring-white/20">
            Now open source & self-hostable.{' '}
            <Link href="/dashboard" className="text-primary font-semibold">
              <span aria-hidden="true" className="absolute inset-0" />
              <svg fill="currentColor" viewBox="0 0 24 24" aria-hidden="true" className="inline size-4.5 align-text-bottom">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>{' '}
              GitHub <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-balance text-stone-900 antialiased sm:text-7xl dark:text-white">
            <span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">FIRE</span> Planning Made{' '}
            <span className="bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent">Smarter</span>.
          </h1>
          <p className="mt-8 text-lg font-medium text-pretty text-stone-500 sm:text-xl/8 dark:text-stone-300">
            <span className="text-stone-700 underline decoration-stone-300 underline-offset-4 dark:text-stone-100 dark:decoration-stone-600">
              Detailed simulations
            </span>{' '}
            +{' '}
            <span className="text-stone-700 underline decoration-stone-300 underline-offset-4 dark:text-stone-100 dark:decoration-stone-600">
              AI tools
            </span>{' '}
            = the best way to{' '}
            <span className="text-stone-700 underline decoration-stone-300 underline-offset-4 dark:text-stone-100 dark:decoration-stone-600">
              plan your financial future
            </span>
            .
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <HeroDashboardLink />
            <a href="#features" className="text-sm/6 font-semibold">
              See features <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 pb-32 sm:pb-48 lg:px-8 lg:pb-56">
        <div className="mt-16 flow-root sm:mt-24">
          <div className="-m-2 rounded-xl bg-stone-900/5 p-2 ring-1 ring-stone-900/10 ring-inset lg:-m-4 lg:rounded-2xl lg:p-4 dark:bg-white/2.5 dark:ring-white/10">
            <Image
              alt="App screenshot"
              src="/screenshots/simulator-light.webp"
              width={2362}
              height={1328}
              className="ring-border/50 rounded-md bg-stone-50 shadow-xl ring-1 dark:hidden"
              unoptimized
              priority
            />
            <Image
              alt="App screenshot"
              src="/screenshots/simulator-dark.webp"
              width={2362}
              height={1328}
              className="ring-border/50 rounded-md bg-white/5 shadow-2xl ring-1 not-dark:hidden"
              unoptimized
              priority
            />
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-tr from-[#ff80b5] to-[#e11d48] opacity-30 sm:left-[calc(50%+36rem)] sm:w-288.75"
        />
      </div>
    </div>
  );
}
