import { CircleQuestionMarkIcon } from 'lucide-react';

export default function HelpPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-prose px-2 pt-[4.25rem] pb-[2.125rem] sm:px-3 lg:px-4">
      <div className="my-8">
        <div className="flex items-center gap-4">
          <CircleQuestionMarkIcon className="text-primary h-12 w-12" />
          <h1 className="text-3xl font-bold">Help Center</h1>
        </div>
      </div>
    </main>
  );
}
