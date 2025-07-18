'use client';

import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

interface DisclosureCardProps {
  title: string;
  desc: string | React.ReactNode;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
  >;
  children: React.ReactNode;
}

export default function DisclosureCard({ title, desc, icon: Icon, children }: DisclosureCardProps) {
  return (
    <Disclosure
      as="div"
      className="bg-emphasized-background border-border my-4 overflow-hidden rounded-lg border shadow-sm transition-shadow duration-300 ease-in-out hover:shadow-md"
    >
      <DisclosureButton className="group data-open:border-border focus-outline flex w-full items-center justify-between p-4 data-open:border-b data-open:pb-5">
        <div className="flex w-full items-center justify-between text-left">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 font-medium">
              <Icon className="text-primary h-5 w-5" aria-hidden="true" />
              <span>{title}</span>
            </div>
            <p className="text-muted-foreground text-sm">{desc}</p>
          </div>
          <ChevronDownIcon
            className="ml-2 h-5 w-5 shrink-0 transition-transform duration-100 group-data-open:-rotate-180"
            aria-hidden="true"
          />
        </div>
      </DisclosureButton>
      <DisclosurePanel>
        <div className="px-4 py-5 sm:p-6">{children}</div>
      </DisclosurePanel>
    </Disclosure>
  );
}
