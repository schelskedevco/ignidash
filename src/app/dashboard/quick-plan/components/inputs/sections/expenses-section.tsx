'use client';

import { useState, RefObject } from 'react';
import { BanknoteArrowDownIcon } from 'lucide-react';
import { PlusIcon } from '@heroicons/react/16/solid';

import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { useExpensesData, useDeleteExpense } from '@/lib/stores/quick-plan-store';
import { formatNumber } from '@/lib/utils';
import type { DisclosureState } from '@/lib/types/disclosure-state';

import ExpenseDialog from '../dialogs/expense-dialog';
import DisclosureSectionDataItem from '../disclosure-section-data-item';
import DisclosureSectionDeleteDataAlert from '../disclosure-section-delete-data-alert';

interface ExpensesSectionProps {
  toggleDisclosure: (newDisclosure: DisclosureState) => void;
  disclosureButtonRef: RefObject<HTMLButtonElement | null>;
  disclosureKey: string;
}

export default function ExpensesSection({ toggleDisclosure, disclosureButtonRef, disclosureKey }: ExpensesSectionProps) {
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedExpenseID, setSelectedExpenseID] = useState<string | null>(null);

  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; name: string } | null>(null);

  const expenses = useExpensesData();
  const hasExpenses = Object.keys(expenses).length > 0;

  const deleteExpense = useDeleteExpense();

  return (
    <>
      <DisclosureSection
        title="Expenses"
        icon={BanknoteArrowDownIcon}
        centerPanelContent={!hasExpenses}
        toggleDisclosure={toggleDisclosure}
        disclosureButtonRef={disclosureButtonRef}
        disclosureKey={disclosureKey}
      >
        {hasExpenses && (
          <div className="flex h-full flex-col">
            <ul role="list" className="mb-6 grid grid-cols-1 gap-3">
              {Object.entries(expenses).map(([id, expense], index) => (
                <DisclosureSectionDataItem
                  key={id}
                  id={id}
                  index={index}
                  name={expense.name}
                  desc={formatNumber(expense.amount, 2, '$') + ` ${expense.frequency}`}
                  leftAddOnCharacter={expense.name.charAt(0).toUpperCase()}
                  onDropdownClickEdit={() => {
                    setExpenseDialogOpen(true);
                    setSelectedExpenseID(id);
                  }}
                  onDropdownClickDelete={() => {
                    setExpenseToDelete({ id, name: expense.name });
                  }}
                />
              ))}
            </ul>
            <div className="mt-auto flex items-center justify-end">
              <Button outline onClick={() => setExpenseDialogOpen(true)}>
                <PlusIcon />
                Expenses
              </Button>
            </div>
          </div>
        )}
        {!hasExpenses && (
          <div className="flex h-full flex-col">
            <button
              type="button"
              className="focus-outline relative block w-full grow rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400 dark:border-white/15 dark:hover:border-white/25"
              onClick={() => setExpenseDialogOpen(true)}
            >
              <BanknoteArrowDownIcon aria-hidden="true" className="text-primary mx-auto size-12" />
              <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-white">Add expense</span>
            </button>
          </div>
        )}
      </DisclosureSection>

      <Dialog
        size="xl"
        open={expenseDialogOpen}
        onClose={() => {
          setSelectedExpenseID(null);
          setExpenseDialogOpen(false);
        }}
      >
        <ExpenseDialog setExpenseDialogOpen={setExpenseDialogOpen} selectedExpenseID={selectedExpenseID} />
      </Dialog>
      <DisclosureSectionDeleteDataAlert dataToDelete={expenseToDelete} setDataToDelete={setExpenseToDelete} deleteData={deleteExpense} />
    </>
  );
}
