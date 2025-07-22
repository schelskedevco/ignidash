'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, TransitionChild } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface DrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: string;
  children?: React.ReactNode;
}

export default function Drawer({ open, setOpen, title = 'Settings', children }: DrawerProps) {
  return (
    <Dialog open={open} onClose={setOpen} className="relative z-50">
      <DialogBackdrop
        transition
        className="bg-emphasized-background fixed inset-0 transition-opacity duration-300 ease-in-out data-closed:opacity-0 sm:bg-zinc-900/75"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full sm:pl-16">
            <DialogPanel
              transition
              className="pointer-events-auto relative w-screen max-w-full transform transition duration-300 ease-in-out data-closed:translate-x-full sm:max-w-md"
            >
              <TransitionChild>
                <div className="absolute top-0 left-0 -ml-8 hidden pt-4 pr-2 duration-300 ease-in-out data-closed:opacity-0 sm:-ml-10 sm:flex sm:pr-4">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="relative rounded-md text-white hover:text-zinc-300 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-hidden"
                  >
                    <span className="absolute -inset-2.5" />
                    <span className="sr-only">Close panel</span>
                    <XMarkIcon aria-hidden="true" className="size-6" />
                  </button>
                </div>
              </TransitionChild>
              <div className="border-border flex h-full flex-col overflow-y-auto sm:border-l">
                <div className="bg-emphasized-background border-border flex items-center justify-between border-b px-4 py-6 sm:px-6">
                  <DialogTitle className="text-xl font-semibold tracking-tight">{title}</DialogTitle>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="focus-outline hover:text-muted-foreground rounded-md sm:hidden"
                  >
                    <span className="sr-only">Close panel</span>
                    <XMarkIcon aria-hidden="true" className="size-6" />
                  </button>
                </div>
                <div className="bg-background relative flex-1 px-4 py-6 sm:px-6">{children}</div>
              </div>
            </DialogPanel>
            {/* Checked through here. */}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
