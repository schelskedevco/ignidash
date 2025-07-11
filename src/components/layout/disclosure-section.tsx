"use client";

import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { cn } from "@/lib/utils";

interface DisclosureSectionProps {
  title: string;
  desc?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DisclosureSection({
  title,
  desc,
  icon,
  children,
  className,
}: DisclosureSectionProps) {
  return (
    <div className="bg-emphasized-background text-foreground hover:ring-foreground/10 rounded-lg text-sm font-medium shadow-sm hover:ring-1 hover:ring-inset">
      <Disclosure>
        <DisclosureButton
          className={cn(
            "group data-open:border-foreground/10 focus-visible:outline-foreground flex w-full items-center justify-between gap-2 px-2.5 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 data-open:border-b data-open:pb-5",
            className ?? ""
          )}
        >
          <div className="w-full text-left">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                {icon}
                <h4>{title}</h4>
              </div>
              <ChevronDownIcon
                className="w-5 shrink-0 group-data-open:rotate-180"
                aria-hidden="true"
              />
            </div>
            <p className="text-muted-foreground mt-2 hidden text-xs group-data-open:block">
              {desc}
            </p>
          </div>
        </DisclosureButton>
        <DisclosurePanel>
          <div className="px-4 py-5 sm:p-6">{children}</div>
        </DisclosurePanel>
      </Disclosure>
    </div>
  );
}
