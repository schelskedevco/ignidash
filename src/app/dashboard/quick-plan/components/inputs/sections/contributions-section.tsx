'use client';

import { useState, RefObject } from 'react';
import { HandCoinsIcon, PiggyBankIcon, BanknoteArrowDownIcon } from 'lucide-react';
import { PlusIcon } from '@heroicons/react/16/solid';

import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { DisclosureState } from '@/lib/types/disclosure-state';
import { Divider } from '@/components/catalyst/divider';
import { Field, Label /* Description */ } from '@/components/catalyst/fieldset';
import { Listbox, ListboxLabel, ListboxDescription, ListboxOption } from '@/components/catalyst/listbox';
import { useContributionRulesData, useDeleteContributionRule } from '@/lib/stores/quick-plan-store';

import ContributionRuleDialog from '../dialogs/contribution-rule-dialog';
import DisclosureSectionDataItem from '../disclosure-section-data-item';
import DisclosureSectionDeleteDataAlert from '../disclosure-section-delete-data-alert';
import DisclosureSectionEmptyStateButton from '../disclosure-section-empty-state-button';

interface ContributionsSectionProps {
  toggleDisclosure: (newDisclosure: DisclosureState) => void;
  disclosureButtonRef: RefObject<HTMLButtonElement | null>;
  disclosureKey: string;
}

export default function ContributionsSection({ toggleDisclosure, disclosureButtonRef, disclosureKey }: ContributionsSectionProps) {
  const [contributionRuleDialogOpen, setContributionRuleDialogOpen] = useState(false);
  const [selectedContributionRuleID, setSelectedContributionRuleID] = useState<string | null>(null);

  const [contributionRuleToDelete, setContributionRuleToDelete] = useState<{ id: string; name: string } | null>(null);

  const contributionRules = useContributionRulesData();
  const hasContributionRules = Object.keys(contributionRules).length > 0;

  const deleteContributionRule = useDeleteContributionRule();

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
            <Label className="sr-only">Base Rule</Label>
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
            {/* <Description>Allocate any leftover cash after your contribution rules are applied.</Description> */}
          </Field>
          <Divider className="my-4" />
          {hasContributionRules && (
            <>
              <ul role="list" className="mb-6 grid grid-cols-1 gap-3">
                {Object.entries(contributionRules).map(([id, contributionRule], index) => (
                  <DisclosureSectionDataItem
                    key={id}
                    id={id}
                    index={index}
                    name={'Contribution Rule ' + (index + 1)}
                    desc={'Placeholder Contribution Rule Description'}
                    leftAddOnCharacter={String(contributionRule.rank)}
                    onDropdownClickEdit={() => {
                      setContributionRuleDialogOpen(true);
                      setSelectedContributionRuleID(id);
                    }}
                    onDropdownClickDelete={() => {
                      setContributionRuleToDelete({ id, name: 'Contribution Rule ' + (index + 1) });
                    }}
                  />
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-end">
                <Button outline onClick={() => setContributionRuleDialogOpen(true)}>
                  <PlusIcon />
                  Contribution Rule
                </Button>
              </div>
            </>
          )}
          {!hasContributionRules && (
            <DisclosureSectionEmptyStateButton
              onClick={() => setContributionRuleDialogOpen(true)}
              icon={HandCoinsIcon}
              buttonText="Add contribution rule"
            />
          )}
        </div>
      </DisclosureSection>

      <Dialog
        size="xl"
        open={contributionRuleDialogOpen}
        onClose={() => {
          setSelectedContributionRuleID(null);
          setContributionRuleDialogOpen(false);
        }}
      >
        <ContributionRuleDialog
          setContributionRuleDialogOpen={setContributionRuleDialogOpen}
          selectedContributionRuleID={selectedContributionRuleID}
        />
      </Dialog>
      <DisclosureSectionDeleteDataAlert
        dataToDelete={contributionRuleToDelete}
        setDataToDelete={setContributionRuleToDelete}
        deleteData={deleteContributionRule}
      />
    </>
  );
}
