'use client';

import { useState, RefObject } from 'react';
import { HandCoinsIcon, PiggyBankIcon, BanknoteArrowDownIcon } from 'lucide-react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/16/solid';

import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { DisclosureState } from '@/lib/types/disclosure-state';
import { Divider } from '@/components/catalyst/divider';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';
import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/catalyst/alert';
import { Field, Label, Description } from '@/components/catalyst/fieldset';
import { Listbox, ListboxLabel, ListboxDescription, ListboxOption } from '@/components/catalyst/listbox';
import { cn } from '@/lib/utils';
import { useContributionRulesData, useDeleteContributionRule } from '@/lib/stores/quick-plan-store';

import ContributionRuleDialog from '../dialogs/contribution-rule-dialog';

const colors = ['bg-rose-500/50', 'bg-rose-500/75', 'bg-rose-500'];

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
          {hasContributionRules && (
            <div className="flex h-full flex-col">
              <ul role="list" className="mb-6 grid grid-cols-1 gap-3">
                {Object.entries(contributionRules).map(([id, contributionRule], index) => (
                  <li key={id} className="col-span-1 flex rounded-md shadow-xs dark:shadow-none">
                    <div
                      className={cn(
                        'border-foreground/50 flex w-16 shrink-0 items-center justify-center rounded-l-md border text-xl font-medium text-white',
                        colors[index % colors.length]
                      )}
                    >
                      {contributionRule.rank}
                    </div>
                    <div className="bg-emphasized-background/25 border-border flex flex-1 items-center justify-between truncate rounded-r-md border-t border-r border-b">
                      <div className="flex-1 truncate px-4 py-2 text-sm">
                        <span className="font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-200">
                          {'Contribution Rule ' + (index + 1)}
                        </span>
                        <p className="text-muted-foreground">Placeholder Contribution Rule Description</p>
                      </div>
                      <div className="shrink-0 pr-2">
                        <Dropdown>
                          <DropdownButton plain aria-label="Open options">
                            <EllipsisVerticalIcon />
                          </DropdownButton>
                          <DropdownMenu>
                            <DropdownItem
                              onClick={() => {
                                setContributionRuleDialogOpen(true);
                                setSelectedContributionRuleID(id);
                              }}
                            >
                              Edit
                            </DropdownItem>
                            <DropdownItem
                              onClick={() => {
                                setContributionRuleToDelete({ id, name: 'Contribution Rule ' + (index + 1) });
                              }}
                            >
                              Delete
                            </DropdownItem>
                          </DropdownMenu>
                        </Dropdown>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-end">
                <Button outline onClick={() => setContributionRuleDialogOpen(true)}>
                  <PlusIcon />
                  Contribution Rule
                </Button>
              </div>
            </div>
          )}
          {!hasContributionRules && (
            <button
              type="button"
              className="focus-outline relative block w-full grow rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400 dark:border-white/15 dark:hover:border-white/25"
              onClick={() => setContributionRuleDialogOpen(true)}
            >
              <HandCoinsIcon aria-hidden="true" className="text-primary mx-auto size-12" />
              <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-white">Add contribution rule</span>
            </button>
          )}
          <Divider className="my-4" />
          <Field className="mb-4">
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
            <Description>Allocate any leftover cash after your contribution rules are applied.</Description>
          </Field>
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
      <Alert
        open={!!contributionRuleToDelete}
        onClose={() => {
          setContributionRuleToDelete(null);
        }}
      >
        <AlertTitle>
          Are you sure you want to delete {contributionRuleToDelete ? `"${contributionRuleToDelete.name}"` : 'this contribution rule'}?
        </AlertTitle>
        <AlertDescription>This action cannot be undone.</AlertDescription>
        <AlertActions>
          <Button plain onClick={() => setContributionRuleToDelete(null)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              deleteContributionRule(contributionRuleToDelete!.id);
              setContributionRuleToDelete(null);
            }}
          >
            Delete
          </Button>
        </AlertActions>
      </Alert>
    </>
  );
}
