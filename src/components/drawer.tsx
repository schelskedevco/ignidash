"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface DrawerProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  title?: string;
  children?: React.ReactNode;
}

export default function Drawer({
  open,
  setOpen,
  title = "Settings",
  children,
}: DrawerProps) {
  return (
    <Dialog open={open} onClose={setOpen} className="relative z-60">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-zinc-900/80 transition-opacity duration-500 ease-in-out data-closed:opacity-0"
      />

      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
            <DialogPanel
              transition
              className="pointer-events-auto relative w-screen max-w-md transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
            >
              <TransitionChild>
                <div className="absolute top-0 left-0 -ml-8 flex pt-4 pr-2 duration-500 ease-in-out data-closed:opacity-0 sm:-ml-10 sm:pr-4">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="relative rounded-md text-white hover:text-gray-200 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-hidden"
                  >
                    <span className="absolute -inset-2.5" />
                    <span className="sr-only">Close panel</span>
                    <XMarkIcon aria-hidden="true" className="size-6" />
                  </button>
                </div>
              </TransitionChild>
              <div className="bg-emphasized-background flex h-full flex-col overflow-y-auto py-6">
                <div className="px-4 sm:px-6">
                  <DialogTitle className="text-foreground text-base font-semibold">
                    {title}
                  </DialogTitle>
                </div>
                <div className="relative mt-6 flex-1 px-4 sm:px-6">
                  {children}
                </div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
