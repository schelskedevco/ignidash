'use client';

import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { Transition } from '@headlessui/react';

interface SuccessNotificationProps {
  title: string;
  desc?: string;
  setShow: (show: boolean) => void;
  show: boolean;
}

export default function SuccessNotification({ title, desc, setShow, show }: SuccessNotificationProps) {
  return (
    <div aria-live="assertive" className="pointer-events-none fixed inset-0 z-50 flex items-end px-4 py-6 sm:items-start sm:p-6">
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        <Transition show={show}>
          <div className="bg-emphasized-background pointer-events-auto w-full max-w-sm rounded-lg shadow-lg outline-1 outline-black/5 transition data-closed:opacity-0 data-enter:transform data-enter:duration-300 data-enter:ease-out data-closed:data-enter:translate-y-2 data-leave:duration-100 data-leave:ease-in data-closed:data-enter:sm:translate-x-2 data-closed:data-enter:sm:translate-y-0 dark:-outline-offset-1 dark:outline-white/10">
            <div className="p-4">
              <div className="flex items-start">
                <div className="shrink-0">
                  <CheckCircleIcon aria-hidden="true" className="size-6 text-green-400" />
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-stone-900 dark:text-white">{title}</p>
                  <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{desc}</p>
                </div>
                <div className="ml-4 flex shrink-0">
                  <button
                    type="button"
                    onClick={() => setShow(false)}
                    className="inline-flex rounded-md text-stone-400 hover:text-stone-500 focus:outline-2 focus:outline-offset-2 focus:outline-rose-600 dark:hover:text-white dark:focus:outline-rose-500"
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon aria-hidden="true" className="size-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  );
}
