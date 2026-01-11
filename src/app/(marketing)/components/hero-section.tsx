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
            New: AI chat and insights are here.{' '}
            <Link href="/dashboard" className="text-primary font-semibold">
              <span aria-hidden="true" className="absolute inset-0" />
              Try free beta <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-balance text-stone-900 antialiased sm:text-7xl dark:text-white">
            <span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">FIRE</span> Planning Made{' '}
            <span className="bg-gradient-to-r from-rose-600 to-pink-500 bg-clip-text text-transparent">Smarter</span>.
          </h1>
          <p className="mt-8 text-lg font-medium text-pretty text-stone-500 sm:text-xl/8 dark:text-stone-300">
            Explore your financial future with AI-powered simulations.
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
