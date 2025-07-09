import Image from "next/image";
import Link from "next/link";
import { FireIcon } from "@heroicons/react/24/solid";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import type { NavigationItem } from "../navigation";

interface DesktopSidebarProps {
  navigation: NavigationItem[];
}

export function DesktopSidebar({ navigation }: DesktopSidebarProps) {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      {/* Sidebar component, swap this element with another sidebar if you like */}
      <div className="border-foreground/10 dark:border-foreground/10 bg-emphasized-background flex grow flex-col gap-y-5 overflow-y-auto border-r px-6">
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
              <ul role="list" className="-mx-2 space-y-2">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        item.current
                          ? "border border-rose-600 bg-white text-rose-600 dark:border-rose-400 dark:bg-zinc-800 dark:text-rose-400"
                          : "border border-transparent text-gray-700 hover:bg-white hover:text-rose-600 dark:text-gray-300 dark:hover:bg-zinc-800 dark:hover:text-rose-400",
                        "group focus-visible:outline-foreground flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
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
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            <li className="-mx-6 mt-auto">
              <a
                href="#"
                className="focus-visible:outline-foreground flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-gray-900 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-gray-100 dark:hover:bg-zinc-800"
              >
                <Image
                  alt=""
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  className="size-8 rounded-full bg-white dark:bg-gray-800"
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
  );
}
