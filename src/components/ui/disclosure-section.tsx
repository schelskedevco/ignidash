'use client';

import { RefObject, useEffect, useRef } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

import type { DisclosureState } from '@/lib/types/disclosure-state';
import { cn } from '@/lib/utils';

interface DisclosureSectionProps {
  title: string;
  icon: React.ForwardRefExoticComponent<
    React.PropsWithoutRef<React.SVGProps<SVGSVGElement>> & { title?: string; titleId?: string } & React.RefAttributes<SVGSVGElement>
  >;
  children: React.ReactNode;
  defaultOpen?: boolean;
  centerPanelContent: boolean;
  toggleDisclosure: (newDisclosure: DisclosureState) => void;
  disclosureButtonRef: RefObject<HTMLButtonElement | null>;
  disclosureKey: string;
}

function DisclosureSectionContent({
  title,
  icon: Icon,
  children,
  defaultOpen,
  centerPanelContent,
  toggleDisclosure,
  disclosureButtonRef,
  disclosureKey,
  open,
  close,
}: DisclosureSectionProps & {
  open: boolean;
  close: (focusableElement?: HTMLElement | RefObject<HTMLElement | null> | undefined) => void;
}) {
  const hasInitialized = useRef<boolean>(false);
  useEffect(() => {
    if (defaultOpen && !hasInitialized.current) {
      toggleDisclosure({ open: false, close, key: disclosureKey });
      hasInitialized.current = true;
    }
  }, [defaultOpen, toggleDisclosure, close, disclosureKey]);

  return (
    <div className="contents">
      <div className="border-border/50 -mx-2 border-b sm:-mx-3 lg:-mx-4">
        <DisclosureButton
          ref={disclosureButtonRef}
          onClick={() => {
            if (!open) close();
            toggleDisclosure({ open, close, key: disclosureKey });
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              if (!open) close();
              toggleDisclosure({ open, close, key: disclosureKey });
            }
          }}
          className="focus-visible:ring-primary group from-emphasized-background to-background flex w-full items-center justify-between bg-gradient-to-r px-4 py-4 hover:to-rose-500/50 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset lg:py-8"
        >
          <div className="flex w-full items-center justify-between text-left">
            <div className="flex items-center gap-2 font-medium">
              <Icon className="text-primary size-5 shrink-0 lg:size-6" aria-hidden="true" />
              <h3 className="text-lg tracking-tight whitespace-nowrap lg:text-xl">{title}</h3>
            </div>
            <ChevronDownIcon
              className="ml-2 h-5 w-5 shrink-0 transition-transform duration-100 group-data-open:-rotate-180"
              aria-hidden="true"
            />
          </div>
        </DisclosureButton>
      </div>
      <DisclosurePanel className="border-border/50 -mx-2 flex flex-1 flex-col justify-center border-b sm:-mx-3 lg:-mx-4">
        <div className={cn('flex h-full flex-col px-4 py-5 sm:py-6', { 'justify-center': centerPanelContent })}>{children}</div>
      </DisclosurePanel>
    </div>
  );
}

export default function DisclosureSection({ defaultOpen, ...props }: DisclosureSectionProps) {
  return (
    <Disclosure defaultOpen={defaultOpen}>
      {({ open, close }) => <DisclosureSectionContent {...props} defaultOpen={defaultOpen} open={open} close={close} />}
    </Disclosure>
  );
}
