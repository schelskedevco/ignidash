"use client";

import { useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FireIcon } from "@heroicons/react/24/solid";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import { DesktopSidebar } from "./components/desktop-sidebar";
import { MobileHeader } from "./components/mobile-header";
import { navigation } from "./navigation";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <div>
        <Dialog
          open={sidebarOpen}
          onClose={setSidebarOpen}
          className="relative z-50 lg:hidden"
        >
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
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="-m-2.5 p-2.5"
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon
                      aria-hidden="true"
                      className="size-6 text-white"
                    />
                  </button>
                </div>
              </TransitionChild>

              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2 dark:bg-zinc-900">
                <div className="border-foreground/10 flex h-16 shrink-0 items-center justify-between gap-2 border-b">
                  <div className="flex items-center gap-2">
                    <FireIcon className="h-8 w-8 text-rose-500" />
                    <span className="font-display text-xl">Ignidash</span>
                  </div>
                  <ModeToggle />
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.name}>
                            <a
                              href={item.href}
                              className={cn(
                                item.current
                                  ? "bg-gray-50 text-rose-600 dark:bg-zinc-800 dark:text-rose-400"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-rose-600 dark:text-gray-300 dark:hover:bg-zinc-800 dark:hover:text-rose-400",
                                "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                              )}
                            >
                              <item.icon
                                aria-hidden="true"
                                className={cn(
                                  item.current
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-gray-400 group-hover:text-rose-600 dark:text-gray-500 dark:group-hover:text-rose-400",
                                  "size-6 shrink-0"
                                )}
                              />
                              {item.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        <DesktopSidebar navigation={navigation} />

        <MobileHeader
          onMenuClick={() => setSidebarOpen(true)}
          currentPageTitle="Quick Plan"
        />

        <main className="lg:pl-72">
          <div className="xl:pl-96">
            <div className="px-4 py-10 sm:px-6 lg:px-8 lg:py-6">
              {/* Main area */}
            </div>
          </div>
        </main>

        <aside className="border-foreground/10 dark:border-foreground/10 fixed inset-y-0 left-72 hidden w-96 overflow-y-auto border-r px-4 py-6 sm:px-6 lg:px-8 xl:block">
          {/* Secondary column (hidden on smaller screens) */}
        </aside>
      </div>
    </>
  );
}
