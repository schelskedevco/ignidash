'use client';

import { useState, RefObject, useCallback } from 'react';
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
import DisclosureSectionEmptyStateButton from '../disclosure-section-empty-state-button';

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

  const handleClose = useCallback(() => {
    setSelectedExpenseID(null);
    setExpenseDialogOpen(false);
  }, []);

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
        <div className="flex h-full flex-col">
          {hasExpenses && (
            <>
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
                <Button outline onClick={() => setExpenseDialogOpen(true)} disabled={!!selectedExpenseID}>
                  <PlusIcon />
                  Expenses
                </Button>
              </div>
            </>
          )}
          {!hasExpenses && (
            <DisclosureSectionEmptyStateButton
              onClick={() => setExpenseDialogOpen(true)}
              icon={BanknoteArrowDownIcon}
              buttonText="Add expense"
            />
          )}
        </div>
      </DisclosureSection>

      <Dialog size="xl" open={expenseDialogOpen} onClose={handleClose}>
        <ExpenseDialog selectedExpenseID={selectedExpenseID} onClose={handleClose} />
      </Dialog>
      <DisclosureSectionDeleteDataAlert dataToDelete={expenseToDelete} setDataToDelete={setExpenseToDelete} deleteData={deleteExpense} />
    </>
  );
}
