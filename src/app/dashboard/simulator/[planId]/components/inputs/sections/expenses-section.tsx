'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, RefObject, useCallback } from 'react';
import { BanknoteArrowDownIcon } from 'lucide-react';
import { PlusIcon } from '@heroicons/react/16/solid';

import { useExpensesData } from '@/hooks/use-convex-data';
import { expenseToConvex } from '@/lib/utils/convex-to-zod-transformers';
import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { formatNumber } from '@/lib/utils';
import type { DisclosureState } from '@/lib/types/disclosure-state';
import { frequencyForDisplay, timeFrameForDisplay } from '@/lib/utils/data-display-formatters';
import type { ExpenseInputs } from '@/lib/schemas/inputs/expense-form-schema';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import DataItem from '@/components/ui/data-item';
import { Skeleton } from '@/components/ui/skeleton';
import DeleteDataItemAlert from '@/components/ui/delete-data-item-alert';
import DataListEmptyStateButton from '@/components/ui/data-list-empty-state-button';

import ExpenseDialog from '../dialogs/expense-dialog';

function getExpenseDesc(expense: ExpenseInputs) {
  return (
    <>
      <p>
        {formatNumber(expense.amount, 2, '$')} {frequencyForDisplay(expense.frequency)}
      </p>
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
  const planId = useSelectedPlanId();

  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseInputs | null>(null);

  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: expenses, isLoading } = useExpensesData();
  const numExpenses = Object.keys(expenses).length;
  const hasExpenses = numExpenses > 0;

  const updateMutation = useMutation(api.expense.upsertExpense);
  const updateExpenses = useCallback(
    async (data: ExpenseInputs) => {
      const expense = expenseToConvex(data);
      await updateMutation({ expense, planId });
    },
    [updateMutation, planId]
  );

  const deleteMutation = useMutation(api.expense.deleteExpense);
  const deleteExpense = useCallback(
    async (expenseId: string) => {
      await deleteMutation({ expenseId, planId });
    },
    [deleteMutation, planId]
  );

  const disableExpense = useCallback(
    async (id: string) => {
      const expense = expenses[id];
      if (!expense) return;

      await updateExpenses({ ...expense, disabled: !expense.disabled });
    },
    [expenses, updateExpenses]
  );

  const handleClose = () => {
    setSelectedExpense(null);
    setExpenseDialogOpen(false);
  };

  const handleDropdownClickEdit = (expense: ExpenseInputs) => {
    setSelectedExpense(expense);
    setExpenseDialogOpen(true);
  };

  return (
    <>
      <DisclosureSection title="Expenses" icon={BanknoteArrowDownIcon} centerPanelContent={!hasExpenses} {...props}>
        <div className="flex h-full flex-col">
          {hasExpenses && (
            <>
              <ul role="list" className="mb-6 grid grid-cols-1 gap-3">
                {Object.entries(expenses).map(([id, expense], index) => (
                  <DataItem
                    key={id}
                    id={id}
                    index={index}
                    name={expense.name}
                    desc={getExpenseDesc(expense)}
                    leftAddOn={<BanknoteArrowDownIcon className="size-8" />}
                    disabled={expense.disabled}
                    onDropdownClickEdit={() => handleDropdownClickEdit(expense)}
                    onDropdownClickDelete={() => setExpenseToDelete({ id, name: expense.name })}
                    onDropdownClickDisable={async () => await disableExpense(id)}
                    colorClassName="bg-[var(--chart-3)] dark:bg-[var(--chart-2)]"
                  />
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-end gap-x-2">
                <Button outline onClick={() => setExpenseDialogOpen(true)} disabled={!!selectedExpense}>
                  <PlusIcon />
                  Expense
                </Button>
              </div>
            </>
          )}
          {!hasExpenses && !isLoading && (
            <DataListEmptyStateButton onClick={() => setExpenseDialogOpen(true)} icon={BanknoteArrowDownIcon} buttonText="Add expense" />
          )}
          {isLoading && (
            <>
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-[80px] w-full" />
                <Skeleton className="h-[80px] w-full" />
              </div>
              <div className="mt-auto flex items-center justify-end">
                <Skeleton className="h-[40px] w-[100px] rounded-full" />
              </div>
            </>
          )}
        </div>
      </DisclosureSection>
      <Dialog size="xl" open={expenseDialogOpen} onClose={handleClose}>
        <ExpenseDialog selectedExpense={selectedExpense} numExpenses={numExpenses} onClose={handleClose} />
      </Dialog>
      <DeleteDataItemAlert dataToDelete={expenseToDelete} setDataToDelete={setExpenseToDelete} deleteData={deleteExpense} />
    </>
  );
}
