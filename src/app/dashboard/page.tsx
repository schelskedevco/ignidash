"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import {
  Bars3Icon,
  CalendarIcon,
  ChartPieIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { FireIcon } from "@heroicons/react/24/solid";
import { ModeToggle } from "@/components/mode-toggle";

const navigation = [
  { name: "Dashboard", href: "#", icon: HomeIcon, current: true },
  { name: "Team", href: "#", icon: UsersIcon, current: false },
  { name: "Projects", href: "#", icon: FolderIcon, current: false },
  { name: "Calendar", href: "#", icon: CalendarIcon, current: false },
  { name: "Documents", href: "#", icon: DocumentDuplicateIcon, current: false },
  { name: "Reports", href: "#", icon: ChartPieIcon, current: false },
];
const teams = [
  { id: 1, name: "Heroicons", href: "#", initial: "H", current: false },
  { id: 2, name: "Tailwind Labs", href: "#", initial: "T", current: false },
  { id: 3, name: "Workcation", href: "#", initial: "W", current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Example() {
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
                              className={classNames(
                                item.current
                                  ? "bg-gray-50 text-rose-600 dark:bg-zinc-800 dark:text-rose-400"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-rose-600 dark:text-gray-300 dark:hover:bg-zinc-800 dark:hover:text-rose-400",
                                "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                              )}
                            >
                              <item.icon
                                aria-hidden="true"
                                className={classNames(
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
                    <li>
                      <div className="text-xs/6 font-semibold text-gray-400 dark:text-gray-500">
                        Your teams
                      </div>
                      <ul role="list" className="-mx-2 mt-2 space-y-1">
                        {teams.map((team) => (
                          <li key={team.name}>
                            <a
                              href={team.href}
                              className={classNames(
                                team.current
                                  ? "bg-gray-50 text-rose-600 dark:bg-zinc-800 dark:text-rose-400"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-rose-600 dark:text-gray-300 dark:hover:bg-zinc-800 dark:hover:text-rose-400",
                                "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                              )}
                            >
                              <span
                                className={classNames(
                                  team.current
                                    ? "border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400"
                                    : "border-foreground/10 dark:border-foreground/20 text-gray-400 group-hover:border-rose-600 group-hover:text-rose-600 dark:text-gray-500 dark:group-hover:border-rose-400 dark:group-hover:text-rose-400",
                                  "flex size-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium dark:bg-zinc-900"
                                )}
                              >
                                {team.initial}
                              </span>
                              <span className="truncate">{team.name}</span>
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

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="border-foreground/10 dark:border-foreground/10 flex grow flex-col gap-y-5 overflow-y-auto border-r bg-white px-6 dark:bg-zinc-900">
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
                          className={classNames(
                            item.current
                              ? "bg-gray-50 text-rose-600 dark:bg-zinc-800 dark:text-rose-400"
                              : "text-gray-700 hover:bg-gray-50 hover:text-rose-600 dark:text-gray-300 dark:hover:bg-zinc-800 dark:hover:text-rose-400",
                            "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                          )}
                        >
                          <item.icon
                            aria-hidden="true"
                            className={classNames(
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
                <li>
                  <div className="text-xs/6 font-semibold text-gray-400 dark:text-gray-500">
                    Your teams
                  </div>
                  <ul role="list" className="-mx-2 mt-2 space-y-1">
                    {teams.map((team) => (
                      <li key={team.name}>
                        <a
                          href={team.href}
                          className={classNames(
                            team.current
                              ? "bg-gray-50 text-rose-600 dark:bg-zinc-800 dark:text-rose-400"
                              : "text-gray-700 hover:bg-gray-50 hover:text-rose-600 dark:text-gray-300 dark:hover:bg-zinc-800 dark:hover:text-rose-400",
                            "group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold"
                          )}
                        >
                          <span
                            className={classNames(
                              team.current
                                ? "border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400"
                                : "border-foreground/10 dark:border-foreground/20 text-gray-400 group-hover:border-rose-600 group-hover:text-rose-600 dark:text-gray-500 dark:group-hover:border-rose-400 dark:group-hover:text-rose-400",
                              "flex size-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium dark:bg-zinc-900"
                            )}
                          >
                            {team.initial}
                          </span>
                          <span className="truncate">{team.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
                <li className="-mx-6 mt-auto">
                  <a
                    href="#"
                    className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50 dark:text-gray-100 dark:hover:bg-zinc-800"
                  >
                    <Image
                      alt=""
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      className="size-8 rounded-full bg-gray-50 dark:bg-gray-800"
                      width={32}
                      height={32}
                    />
                    <span className="sr-only">Your profile</span>
                    <span aria-hidden="true">Tom Cook</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-xs sm:px-6 lg:hidden dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden dark:text-gray-300"
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
          <div className="flex-1 text-sm/6 font-semibold text-gray-900 dark:text-gray-100">
            Dashboard
          </div>
          <a href="#">
            <span className="sr-only">Your profile</span>
            <Image
              alt=""
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              className="size-8 rounded-full bg-gray-50 dark:bg-gray-800"
              width={32}
              height={32}
            />
          </a>
        </div>

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
