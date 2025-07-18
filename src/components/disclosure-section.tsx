'use client';

import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface DisclosureSectionProps {
  title: string;
  desc: string;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
  >;
  children: React.ReactNode;
}

export default function DisclosureSection({ title, desc, icon: Icon, children }: DisclosureSectionProps) {
  return (
    <Disclosure as="div" className="bg-emphasized-background border-border my-4 overflow-hidden rounded-lg border shadow-sm">
      <DisclosureButton
        className={cn(
          'group data-open:border-border focus-outline flex w-full items-center justify-between gap-2 p-4 data-open:border-b data-open:pb-5'
        )}
      >
        <div className="flex w-full items-center justify-between text-left">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Icon className="text-primary h-5 w-5" aria-hidden="true" />
              <span>{title}</span>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">{desc}</p>
          </div>
          <ChevronDownIcon className="ml-2 w-5 shrink-0 group-data-open:rotate-180" aria-hidden="true" />
        </div>
      </DisclosureButton>
      <DisclosurePanel>
        <div className="px-4 py-5 sm:p-6">{children}</div>
      </DisclosurePanel>
    </Disclosure>
  );
}
