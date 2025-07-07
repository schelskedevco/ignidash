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
  children: React.ReactNode;
  className?: string;
}

export function DisclosureSection({
  title,
  desc,
  children,
  className,
}: DisclosureSectionProps) {
  return (
    <Disclosure>
      <DisclosureButton
        className={cn(
          "group data-open:border-foreground/10 flex w-full items-center justify-between gap-2 data-open:mb-5 data-open:border-b data-open:pb-5",
          className ?? ""
        )}
      >
        <div className="w-full text-left">
          <div className="flex w-full items-center justify-between">
            <h4 className="text-base font-semibold">{title}</h4>
            <ChevronDownIcon className="w-5 shrink-0 group-data-open:rotate-180" />
          </div>
          <p className="text-muted-foreground mt-2 hidden text-xs group-data-open:block">
            {desc}
          </p>
        </div>
      </DisclosureButton>
      <DisclosurePanel>{children}</DisclosurePanel>
    </Disclosure>
  );
}
