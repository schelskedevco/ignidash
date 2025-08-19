import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

interface DisclosureSectionProps {
  title: string;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
  >;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function DisclosureSection({ title, icon: Icon, children, defaultOpen }: DisclosureSectionProps) {
  return (
    <Disclosure as="div" className="border-border -mx-2 border-b sm:-mx-3 lg:-mx-4" defaultOpen={defaultOpen}>
      <DisclosureButton className="group data-open:border-border focus-outline from-background flex w-full items-center justify-between bg-gradient-to-r to-rose-500/25 px-4 py-8 hover:to-rose-500/50 data-open:border-b">
        <div className="flex w-full items-center justify-between text-left">
          <div className="flex items-center gap-2 font-medium">
            <Icon className="text-primary size-6 shrink-0" aria-hidden="true" />
            <h3 className="font-mono text-xl font-semibold tracking-tight whitespace-nowrap uppercase">{title}</h3>
          </div>
          <ChevronDownIcon
            className="text-muted-foreground ml-2 h-5 w-5 shrink-0 transition-transform duration-100 group-data-open:-rotate-180"
            aria-hidden="true"
          />
        </div>
      </DisclosureButton>
      <DisclosurePanel>
        <div className="px-2 py-5 sm:px-3 sm:py-6 lg:px-4">{children}</div>
      </DisclosurePanel>
    </Disclosure>
  );
}
