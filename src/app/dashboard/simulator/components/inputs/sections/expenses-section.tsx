'use client';

import { useState, RefObject, useCallback } from 'react';
import { BanknoteArrowDownIcon } from 'lucide-react';
import { PlusIcon } from '@heroicons/react/16/solid';

import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { useExpensesData, useDeleteExpense, useUpdateExpenses } from '@/lib/stores/simulator-store';
import { formatNumber } from '@/lib/utils';
import type { DisclosureState } from '@/lib/types/disclosure-state';
import { frequencyForDisplay, timeFrameForDisplay } from '@/lib/utils/data-display-formatters';
import type { ExpenseInputs } from '@/lib/schemas/expense-form-schema';

import ExpenseDialog from '../dialogs/expense-dialog';
import DisclosureSectionDataItem from '../disclosure-section-data-item';
import DisclosureSectionDeleteDataAlert from '../disclosure-section-delete-data-alert';
import DisclosureSectionEmptyStateButton from '../disclosure-section-empty-state-button';

function getExpenseDesc(expense: ExpenseInputs) {
  return (
    <>
      <p>{`${formatNumber(expense.amount, 2, '$')} ${frequencyForDisplay(expense.frequency)}`}</p>
      <p>{timeFrameForDisplay(expense.timeframe.start, expense.timeframe.end)}</p>
    </>
  );
}

interface ExpensesSectionProps {
  toggleDisclosure: (newDisclosure: DisclosureState) => void;
  disclosureButtonRef: RefObject<HTMLButtonElement | null>;
  disclosureKey: string;
}

export default function ExpensesSection(props: ExpensesSectionProps) {
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedExpenseID, setSelectedExpenseID] = useState<string | null>(null);

  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; name: string } | null>(null);

  const expenses = useExpensesData();
  const hasExpenses = Object.keys(expenses).length > 0;

  const updateExpenses = useUpdateExpenses();
  const deleteExpense = useDeleteExpense();

  const disableExpense = useCallback(
    (id: string) => {
      const expense = expenses[id];
      if (!expense) return;

      updateExpenses({ ...expense, disabled: !expense.disabled });
    },
    [expenses, updateExpenses]
  );

  const handleClose = () => {
    setSelectedExpenseID(null);
    setExpenseDialogOpen(false);
  };

  const handleDropdownClickEdit = (id: string) => {
    setExpenseDialogOpen(true);
    setSelectedExpenseID(id);
  };

  return (
    <>
      <DisclosureSection title="Expenses" icon={BanknoteArrowDownIcon} centerPanelContent={!hasExpenses} {...props}>
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
                    desc={getExpenseDesc(expense)}
                    leftAddOn={<BanknoteArrowDownIcon className="size-8" />}
                    disabled={expense.disabled}
                    onDropdownClickEdit={() => handleDropdownClickEdit(id)}
                    onDropdownClickDelete={() => setExpenseToDelete({ id, name: expense.name })}
                    onDropdownClickDisable={() => disableExpense(id)}
                    colorClassName="bg-[var(--chart-3)] dark:bg-[var(--chart-2)]"
                  />
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-end">
                <Button outline onClick={() => setExpenseDialogOpen(true)} disabled={!!selectedExpenseID}>
                  <PlusIcon />
                  Expense
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
