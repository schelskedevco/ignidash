'use client';

import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface DisclosureSectionProps {
  title: string;
  desc?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function DisclosureSection({ title, desc, icon, children, className }: DisclosureSectionProps) {
  return (
    <div className="bg-emphasized-background text-foreground hover:ring-foreground/10 rounded-lg text-sm font-medium shadow-sm hover:ring-1 hover:ring-inset">
      <Disclosure>
        <DisclosureButton
          className={cn(
            'group data-open:border-foreground/10 focus-outline flex w-full items-center justify-between gap-2 p-4 data-open:border-b data-open:pb-5',
            className ?? ''
          )}
        >
          <div className="flex w-full items-center justify-between text-left">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {icon}
                <span>{title}</span>
              </div>
              {desc && <p className="text-muted-foreground mt-2 block text-xs">{desc}</p>}
            </div>
            <ChevronDownIcon className="ml-2 w-5 shrink-0 group-data-open:rotate-180" aria-hidden="true" />
          </div>
        </DisclosureButton>
        <DisclosurePanel>
          <div className="px-4 py-5 sm:p-6">{children}</div>
        </DisclosurePanel>
      </Disclosure>
    </div>
  );
}
