"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { MobileSidebar } from "./mobile-sidebar";
import type { NavigationItem } from "../navigation";

interface MobileSidebarDialogProps {
  open: boolean;
  onClose: () => void;
  navigation: NavigationItem[];
}

export function MobileSidebarDialog({
  open,
  onClose,
  navigation,
}: MobileSidebarDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50 lg:hidden">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-zinc-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
      />

      <div className="fixed inset-0 flex">
        <DialogPanel
          transition
          className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
        >
          <TransitionChild>
            <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
              <button type="button" onClick={onClose} className="-m-2.5 p-2.5">
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon aria-hidden="true" className="size-6 text-white" />
              </button>
            </div>
          </TransitionChild>

          {/* Sidebar component, swap this element with another sidebar if you like */}
          <MobileSidebar navigation={navigation} />
        </DialogPanel>
      </div>
    </Dialog>
  );
}
