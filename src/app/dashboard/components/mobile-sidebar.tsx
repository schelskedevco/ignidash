import { FireIcon } from "@heroicons/react/24/solid";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";
import type { NavigationItem } from "../navigation";

interface MobileSidebarProps {
  navigation: NavigationItem[];
}

export function MobileSidebar({ navigation }: MobileSidebarProps) {
  return (
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
  );
}
