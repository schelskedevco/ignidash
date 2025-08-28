'use client';

import { useState, RefObject } from 'react';
import { BanknoteArrowUpIcon } from 'lucide-react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/16/solid';

import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';
import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/catalyst/alert';
import { useIncomesData, useDeleteIncome } from '@/lib/stores/quick-plan-store';
import { cn, formatNumber } from '@/lib/utils';
import type { DisclosureState } from '@/lib/types/disclosure-state';

import IncomeDialog from '../dialogs/income-dialog';

const colors = ['bg-rose-500/50', 'bg-rose-500/75', 'bg-rose-500'];

interface IncomeSectionProps {
  toggleDisclosure: (newDisclosure: DisclosureState) => void;
  disclosureButtonRef: RefObject<HTMLButtonElement | null>;
  disclosureKey: string;
}

export default function IncomeSection({ toggleDisclosure, disclosureButtonRef, disclosureKey }: IncomeSectionProps) {
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [selectedIncomeID, setSelectedIncomeID] = useState<string | null>(null);

  const [incomeToDelete, setIncomeToDelete] = useState<{ id: string; name: string } | null>(null);

  const incomes = useIncomesData();
  const hasIncomes = Object.keys(incomes).length > 0;

  const deleteIncome = useDeleteIncome();

  return (
    <>
      <DisclosureSection
        title="Income"
        icon={BanknoteArrowUpIcon}
        centerPanelContent={!hasIncomes}
        toggleDisclosure={toggleDisclosure}
        disclosureButtonRef={disclosureButtonRef}
        disclosureKey={disclosureKey}
      >
        {hasIncomes && (
          <div className="flex h-full flex-col">
            <ul role="list" className="mb-6 grid grid-cols-1 gap-3">
              {Object.entries(incomes).map(([id, income], index) => (
                <li key={id} className="col-span-1 flex rounded-md shadow-xs dark:shadow-none">
                  <div
                    className={cn(
                      'border-foreground/50 flex w-16 shrink-0 items-center justify-center rounded-l-md border text-xl font-medium text-white',
                      colors[index % colors.length]
                    )}
                  >
                    {income.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="bg-emphasized-background/25 border-border flex flex-1 items-center justify-between truncate rounded-r-md border-t border-r border-b">
                    <div className="flex-1 truncate px-4 py-2 text-sm">
                      <span className="font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-200">
                        {income.name}
                      </span>
                      <p className="text-muted-foreground">{formatNumber(income.amount, 2, '$') + ` ${income.frequency}`}</p>
                    </div>
                    <div className="shrink-0 pr-2">
                      <Dropdown>
                        <DropdownButton plain aria-label="Open options">
                          <EllipsisVerticalIcon />
                        </DropdownButton>
                        <DropdownMenu>
                          <DropdownItem
                            onClick={() => {
                              setIncomeDialogOpen(true);
                              setSelectedIncomeID(id);
                            }}
                          >
                            Edit
                          </DropdownItem>
                          <DropdownItem
                            onClick={() => {
                              setIncomeToDelete({ id, name: income.name });
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
              <Button outline onClick={() => setIncomeDialogOpen(true)}>
                <PlusIcon />
                Income
              </Button>
            </div>
          </div>
        )}
        {!hasIncomes && (
          <div className="flex h-full flex-col">
            <button
              type="button"
              className="focus-outline relative block w-full grow rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400 dark:border-white/15 dark:hover:border-white/25"
              onClick={() => setIncomeDialogOpen(true)}
            >
              <BanknoteArrowUpIcon aria-hidden="true" className="text-primary mx-auto size-12" />
              <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-white">Add income</span>
            </button>
          </div>
        )}
      </DisclosureSection>

      <Dialog
        size="xl"
        open={incomeDialogOpen}
        onClose={() => {
          setSelectedIncomeID(null);
          setIncomeDialogOpen(false);
        }}
      >
        <IncomeDialog setIncomeDialogOpen={setIncomeDialogOpen} selectedIncomeID={selectedIncomeID} />
      </Dialog>
      <Alert
        open={!!incomeToDelete}
        onClose={() => {
          setIncomeToDelete(null);
        }}
      >
        <AlertTitle>Are you sure you want to delete {incomeToDelete ? `"${incomeToDelete.name}"` : 'this income'}?</AlertTitle>
        <AlertDescription>This action cannot be undone.</AlertDescription>
        <AlertActions>
          <Button plain onClick={() => setIncomeToDelete(null)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              deleteIncome(incomeToDelete!.id);
              setIncomeToDelete(null);
            }}
          >
            Delete
          </Button>
        </AlertActions>
      </Alert>
    </>
  );
}
