'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, TransitionChild } from '@headlessui/react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

interface DrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string | React.ReactNode;
  children?: React.ReactNode;
  size?: 'regular' | 'large';
}

export default function Drawer({ open, setOpen, title, children, size = 'regular' }: DrawerProps) {
  const sizeClasses = size === 'large' ? 'sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl' : 'sm:max-w-md';

  return (
    <Dialog open={open} onClose={setOpen} className="relative z-50">
      <DialogBackdrop
        transition
        className="bg-emphasized-background fixed inset-0 transition-opacity duration-300 ease-in-out data-closed:opacity-0 sm:bg-stone-100/75 dark:sm:bg-stone-900/75"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full sm:pl-16">
            <DialogPanel
              transition
              className={cn(
                'pointer-events-auto relative w-screen max-w-full transform transition duration-300 ease-in-out data-closed:translate-x-full',
                sizeClasses
              )}
            >
              <TransitionChild>
                <div className="absolute top-0 left-0 -ml-8 hidden pt-4 pr-2 duration-300 ease-in-out data-closed:opacity-0 sm:-ml-10 sm:flex sm:pr-4">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="relative rounded-md text-white hover:text-stone-300 focus-visible:ring-2 focus-visible:ring-black focus-visible:outline-hidden dark:focus-visible:ring-white"
                  >
                    <span className="absolute -inset-2.5" />
                    <span className="sr-only">Close panel</span>
                    <X aria-hidden="true" className="size-6 text-black dark:text-white" />
                  </button>
                </div>
              </TransitionChild>
              <div className="border-border/50 flex h-full flex-col sm:border-l">
                <div className="bg-emphasized-background border-border/50 flex items-center justify-between border-b px-4 py-6 sm:px-5">
                  <DialogTitle className="text-xl font-semibold tracking-tight">{title}</DialogTitle>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="focus-outline hover:text-muted-foreground rounded-md sm:hidden"
                  >
                    <span className="sr-only">Close panel</span>
                    <X aria-hidden="true" className="size-6" />
                  </button>
                </div>
                <div className="bg-background relative flex-1 overflow-y-auto px-2 sm:px-3">{children}</div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
