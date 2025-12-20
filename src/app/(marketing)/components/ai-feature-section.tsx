import Image from 'next/image';

export default function AIFeatureSection() {
  return (
    <div className="overflow-hidden bg-white py-24 sm:py-32 dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="max-w-2xl text-5xl font-semibold tracking-tight text-pretty text-zinc-900 sm:text-6xl sm:text-balance dark:text-white">
          Everything you need to deploy your app
        </p>
        <div className="relative mt-16 aspect-2362/1328 h-144 sm:h-auto sm:w-[calc(var(--container-7xl)-calc(var(--spacing)*16))]">
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
