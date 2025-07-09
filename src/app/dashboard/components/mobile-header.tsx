import Image from "next/image";
import { Bars3Icon } from "@heroicons/react/24/outline";

interface MobileHeaderProps {
  onMenuClick: () => void;
  currentPageTitle: string;
}

export function MobileHeader({
  onMenuClick,
  currentPageTitle,
}: MobileHeaderProps) {
  return (
    <div className="bg-emphasized-background sticky top-0 z-40 flex items-center gap-x-6 px-4 py-4 shadow-xs sm:px-6 lg:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden dark:text-gray-300"
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon aria-hidden="true" className="size-6" />
      </button>
      <div className="flex-1 text-sm/6 font-semibold text-gray-900 dark:text-gray-100">
        {currentPageTitle}
      </div>
      <a href="#">
        <span className="sr-only">Your profile</span>
        <Image
          alt=""
          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          className="size-8 rounded-full bg-gray-100 dark:bg-gray-800"
          width={32}
          height={32}
        />
      </a>
    </div>
  );
}
