'use client';

import { RefObject } from 'react';
import { HandCoinsIcon, PiggyBankIcon, BanknoteArrowDownIcon } from 'lucide-react';

import DisclosureSection from '@/components/ui/disclosure-section';
import { DisclosureState } from '@/lib/types/disclosure-state';
import { Divider } from '@/components/catalyst/divider';
import { Field, Label, Description } from '@/components/catalyst/fieldset';
import { Listbox, ListboxLabel, ListboxDescription, ListboxOption } from '@/components/catalyst/listbox';

interface ContributionsSectionProps {
  toggleDisclosure: (newDisclosure: DisclosureState) => void;
  disclosureButtonRef: RefObject<HTMLButtonElement | null>;
  disclosureKey: string;
}

export default function ContributionsSection({ toggleDisclosure, disclosureButtonRef, disclosureKey }: ContributionsSectionProps) {
  return (
    <>
      <DisclosureSection
        title="Contributions"
        icon={HandCoinsIcon}
        centerPanelContent
        toggleDisclosure={toggleDisclosure}
        disclosureButtonRef={disclosureButtonRef}
        disclosureKey={disclosureKey}
      >
        <div className="flex h-full flex-col">
          <Field>
            <Label>Base Rule</Label>
            <Listbox name="status" defaultValue="spend">
              <ListboxOption value="spend">
                <BanknoteArrowDownIcon data-slot="icon" className="text-primary" />
                <ListboxLabel>Spend</ListboxLabel>
                <ListboxDescription>Spend anything left</ListboxDescription>
              </ListboxOption>
              <ListboxOption value="save">
                <PiggyBankIcon data-slot="icon" className="text-primary" />
                <ListboxLabel>Save</ListboxLabel>
                <ListboxDescription>Save anything left</ListboxDescription>
              </ListboxOption>
            </Listbox>
            <Description>Allocate any leftover cash after your contribution rules are applied.</Description>
          </Field>
          <Divider className="my-4" />
          <button
            type="button"
            className="focus-outline relative block w-full grow rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400 dark:border-white/15 dark:hover:border-white/25"
          >
            <HandCoinsIcon aria-hidden="true" className="text-primary mx-auto size-12" />
            <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-white">Add contribution rule</span>
          </button>
        </div>
      </DisclosureSection>
    </>
  );
}
