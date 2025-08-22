'use client';

import { useState } from 'react';
import { BanknoteArrowUpIcon } from 'lucide-react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';

import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';
import { useIncomesData, useDeleteIncome } from '@/lib/stores/quick-plan-store';
import { cn, formatNumber } from '@/lib/utils';

import IncomeDialog from '../dialogs/income-dialog';

const colors = ['bg-rose-500/50', 'bg-rose-500/75', 'bg-rose-500'];

export default function IncomeSection() {
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [selectedIncomeID, setSelectedIncomeID] = useState<string | null>(null);

  const incomes = useIncomesData();
  const hasIncomes = Object.keys(incomes).length > 0;

  const deleteIncome = useDeleteIncome();

  return (
    <>
      <DisclosureSection title="Income" icon={BanknoteArrowUpIcon}>
        {hasIncomes && (
          <>
            <ul role="list" className="grid grid-cols-1 gap-3">
              {Object.entries(incomes).map(([id, income], index) => (
                <li key={id} className="col-span-1 flex rounded-md shadow-xs dark:shadow-none">
                  <div
                    className={cn(
                      'border-foreground/50 flex w-16 shrink-0 items-center justify-center rounded-l-md border text-sm font-medium text-white',
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
                          <DropdownItem onClick={() => deleteIncome(id)}>Delete</DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center justify-end">
              <Button color="rose" onClick={() => setIncomeDialogOpen(true)}>
                Add Income
              </Button>
            </div>
          </>
        )}
        {!hasIncomes && (
          <button
            type="button"
            className="focus-outline relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 dark:border-white/15 dark:hover:border-white/25"
            onClick={() => setIncomeDialogOpen(true)}
          >
            <BanknoteArrowUpIcon aria-hidden="true" className="text-primary mx-auto size-12" />
            <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-white">Create an income</span>
          </button>
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
    </>
  );
}
