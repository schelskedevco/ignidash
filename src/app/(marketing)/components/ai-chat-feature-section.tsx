import Image from 'next/image';

export default function AIChatFeatureSection() {
  return (
    <div className="overflow-hidden py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="ml-auto max-w-2xl text-right text-5xl font-semibold tracking-tight text-pretty text-stone-900 sm:text-6xl sm:text-balance dark:text-white">
          Instant clarity. Powered by{' '}
          <span className="bg-gradient-to-r from-pink-500 to-rose-600 bg-clip-text text-transparent">GPT-5.2</span>.
        </p>
        <p className="mt-6 ml-auto max-w-xl text-right text-lg/8 text-pretty text-stone-700 dark:text-stone-300">
          The AI chatbot that{' '}
          <span className="text-stone-700 underline decoration-stone-300 underline-offset-4 dark:text-stone-100 dark:decoration-stone-600">
            knows your plan inside out
          </span>
          &hellip; and only occasionally invents new tax brackets.
        </p>
        <div className="relative mt-16 aspect-2362/1328 sm:h-auto sm:w-[calc(var(--container-7xl)-calc(var(--spacing)*16))]">
          <div className="absolute -inset-2 rounded-[calc(var(--radius-xl)+calc(var(--spacing)*2))] shadow-xs ring-1 ring-black/5 dark:bg-white/2.5 dark:ring-white/10" />
          <Image
            alt="AI chat screenshot"
            src="/screenshots/ai-chat-light.webp"
            width={2362}
            height={1328}
            className="h-full rounded-xl shadow-2xl ring-1 ring-black/10 dark:hidden dark:ring-white/10"
            unoptimized
          />
          <Image
            alt="AI chat screenshot"
            src="/screenshots/ai-chat-dark.webp"
            width={2362}
            height={1328}
            className="h-full rounded-xl shadow-2xl ring-1 ring-black/10 not-dark:hidden dark:ring-white/10"
            unoptimized
          />
        </div>
      </div>
    </div>
  );
}
