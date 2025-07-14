"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { MobileSidebarContent } from "./mobile-sidebar-content";
import type { NavigationItem } from "../navigation";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  navigation: NavigationItem[];
}

export function MobileSidebar({
  open,
  onClose,
  navigation,
}: MobileSidebarProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50 lg:hidden">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-zinc-900/90 transition-opacity duration-300 ease-linear data-closed:opacity-0"
      />

      <div className="fixed inset-0 flex">
        <DialogPanel
          transition
          className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
        >
          <TransitionChild>
            <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
              <button
                type="button"
                onClick={onClose}
                className="focus-visible:outline-foreground -m-2.5 p-2.5 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon aria-hidden="true" className="size-6 text-white" />
              </button>
            </div>
          </TransitionChild>

          <MobileSidebarContent navigation={navigation} onClose={onClose} />
        </DialogPanel>
      </div>
    </Dialog>
  );
}
