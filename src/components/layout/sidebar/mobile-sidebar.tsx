'use client';

import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react';
import { X } from 'lucide-react';

import type { NavigationItem } from '@/lib/navigation';

import MobileSidebarContent from './mobile-sidebar-content';

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  navigation: NavigationItem[];
  secondaryNavigation: NavigationItem[];
}

export default function MobileSidebar({ open, onClose, navigation, secondaryNavigation }: MobileSidebarProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50 lg:hidden">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-zinc-100/80 transition-opacity duration-300 ease-linear data-closed:opacity-0 dark:bg-zinc-900/80"
      />

      <div className="fixed inset-0 flex">
        <DialogPanel
          transition
          className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
        >
          <TransitionChild>
            <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
              <button type="button" onClick={onClose} className="focus-outline -m-2.5 p-2.5">
                <span className="sr-only">Close sidebar</span>
                <X aria-hidden="true" className="size-6 text-black dark:text-white" />
              </button>
            </div>
          </TransitionChild>
          <MobileSidebarContent navigation={navigation} secondaryNavigation={secondaryNavigation} onClose={onClose} />
        </DialogPanel>
      </div>
    </Dialog>
  );
}
