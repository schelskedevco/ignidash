import MainArea from '@/components/layout/main-area';

export default function ComparePage() {
  return (
    <MainArea hasSecondaryColumn={false}>
      <div className="flex h-full flex-col items-center justify-center px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-base/7 font-semibold text-rose-600 dark:text-rose-400">Coming soon</p>
          <h2 className="mt-2 text-5xl font-semibold tracking-tight text-stone-900 sm:text-7xl dark:text-white">Compare</h2>
          <p className="mt-8 text-lg font-medium text-pretty text-stone-500 sm:text-xl/8 dark:text-stone-400">
            Compare two plans and their results side-by-side.
          </p>
        </div>
      </div>
    </MainArea>
  );
}
