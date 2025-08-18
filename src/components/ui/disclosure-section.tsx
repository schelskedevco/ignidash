import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

interface DisclosureSectionProps {
  title: string;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
  >;
  children: React.ReactNode;
}

export default function DisclosureSection({ title, icon: Icon, children }: DisclosureSectionProps) {
  return (
    <Disclosure as="div" className="-mx-2 sm:-mx-3 lg:-mx-4">
      <DisclosureButton className="group data-open:border-border focus-outline flex w-full items-center justify-between px-4 py-8 data-open:border-b">
        <div className="flex w-full items-center justify-between text-left transition-opacity duration-150 group-data-hover:opacity-75">
          <div className="flex items-center gap-2 font-medium">
            <Icon className="text-primary size-6 shrink-0" aria-hidden="true" />
            <h3 className="text-xl font-semibold tracking-tight whitespace-nowrap">{title}</h3>
          </div>
          <ChevronDownIcon
            className="text-muted-foreground ml-2 h-5 w-5 shrink-0 transition-transform duration-100 group-data-open:-rotate-180"
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
