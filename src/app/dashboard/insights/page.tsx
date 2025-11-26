import MainArea from '@/components/layout/main-area';

export default function InsightsPage() {
  return (
    <MainArea hasSecondaryColumn={false}>
      <div className="bg-white px-6 py-24 sm:py-32 lg:px-8 dark:bg-gray-900">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-base/7 font-semibold text-rose-600 dark:text-rose-400">Get the help you need</p>
          <h2 className="mt-2 text-5xl font-semibold tracking-tight text-gray-900 sm:text-7xl dark:text-white">Support center</h2>
          <p className="mt-8 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8 dark:text-gray-400">
            Anim aute id magna aliqua ad ad non deserunt sunt. Qui irure qui lorem cupidatat commodo. Elit sunt amet fugiat veniam occaecat
            fugiat.
          </p>
        </div>
      </div>
    </MainArea>
  );
}
