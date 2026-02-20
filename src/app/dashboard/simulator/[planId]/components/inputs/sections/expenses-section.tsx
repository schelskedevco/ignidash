'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, RefObject, useCallback } from 'react';
import { BanknoteArrowDownIcon, CreditCardIcon } from 'lucide-react';
import { PlusIcon } from '@heroicons/react/16/solid';

import { useExpensesData, useDebtsData, useLiabilityData } from '@/hooks/use-convex-data';
import { expenseToConvex, debtToConvex } from '@/lib/utils/convex-to-zod-transformers';
import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { formatCompactCurrency } from '@/lib/utils/format-currency';
import type { DisclosureState } from '@/lib/types/disclosure-state';
import { frequencyForDisplay, timeFrameForDisplay, compareTimePoints } from '@/lib/utils/data-display-formatters';
import { estimatePayoffMonths, formatPayoffEstimate } from '@/lib/utils/payoff-estimator';
import type { ExpenseInputs } from '@/lib/schemas/inputs/expense-form-schema';
import type { DebtInputs } from '@/lib/schemas/inputs/debt-form-schema';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import DataItem from '@/components/ui/data-item';
import { Skeleton } from '@/components/ui/skeleton';
import DeleteDataItemAlert from '@/components/ui/delete-data-item-alert';
import DataListEmptyStateButton from '@/components/ui/data-list-empty-state-button';

import ExpenseDialog from '../dialogs/expense-dialog';
import DebtDialog from '../dialogs/debt-dialog';

function getExpenseDesc(expense: ExpenseInputs) {
  return (
    <>
      <p>
        {formatCompactCurrency(expense.amount, 2)} {frequencyForDisplay(expense.frequency)}
      </p>
      <p>{timeFrameForDisplay(expense.timeframe.start, expense.timeframe.end)}</p>
    </>
  );
}

function getDebtDesc(debt: DebtInputs) {
  const payoffMonths = estimatePayoffMonths(debt);

  return (
    <>
      <p>
        {formatCompactCurrency(debt.monthlyPayment, 2)} / mo | {formatCompactCurrency(debt.balance, 2)} owed
      </p>
      <p>
        {timeFrameForDisplay(debt.startDate)}
        {payoffMonths !== null && ` → ${formatPayoffEstimate(payoffMonths)} (est.)`}
      </p>
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

  // Expense state
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseInputs | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; name: string } | null>(null);

  // Debt state
  const [debtDialogOpen, setDebtDialogOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<DebtInputs | null>(null);
  const [debtToDelete, setDebtToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: expenses, isLoading: expensesLoading } = useExpensesData();
  const numExpenses = Object.keys(expenses).length;

  const { data: debts, isLoading: debtsLoading } = useDebtsData();
  const numDebts = Object.keys(debts).length;

  const nwLiabilities = useLiabilityData();

  const isLoading = expensesLoading || debtsLoading;
  const hasData = numExpenses > 0 || numDebts > 0;

  // Expense mutations
  const updateExpenseMutation = useMutation(api.expense.upsertExpense);
  const updateExpenses = useCallback(
    async (data: ExpenseInputs) => {
      const expense = expenseToConvex(data);
      await updateExpenseMutation({ expense, planId });
    },
    [updateExpenseMutation, planId]
  );

  const deleteExpenseMutation = useMutation(api.expense.deleteExpense);
  const deleteExpense = useCallback(
    async (expenseId: string) => {
      await deleteExpenseMutation({ expenseId, planId });
    },
    [deleteExpenseMutation, planId]
  );

  const disableExpense = useCallback(
    async (id: string) => {
      const expense = expenses[id];
      if (!expense) return;
      await updateExpenses({ ...expense, disabled: !expense.disabled });
    },
    [expenses, updateExpenses]
  );

  // Debt mutations
  const updateDebtMutation = useMutation(api.debt.upsertDebt);
  const updateDebts = useCallback(
    async (data: DebtInputs) => {
      const debt = debtToConvex(data);
      await updateDebtMutation({ debt, planId });
    },
    [updateDebtMutation, planId]
  );

  const deleteDebtMutation = useMutation(api.debt.deleteDebt);
  const deleteDebt = useCallback(
    async (debtId: string) => {
      await deleteDebtMutation({ debtId, planId });
    },
    [deleteDebtMutation, planId]
  );

  const disableDebt = useCallback(
    async (id: string) => {
      const debt = debts[id];
      if (!debt) return;
      await updateDebts({ ...debt, disabled: !debt.disabled });
    },
    [debts, updateDebts]
  );

  // Expense handlers
  const handleExpenseClose = () => {
    setSelectedExpense(null);
    setExpenseDialogOpen(false);
  };

  const handleExpenseDropdownClickEdit = (expense: ExpenseInputs) => {
    setSelectedExpense(expense);
    setExpenseDialogOpen(true);
  };

  // Debt handlers
  const handleDebtClose = () => {
    setSelectedDebt(null);
    setDebtDialogOpen(false);
  };

  const handleDebtDropdownClickEdit = (debt: DebtInputs) => {
    setSelectedDebt(debt);
    setDebtDialogOpen(true);
  };

  return (
    <>
      <DisclosureSection title="Expenses" icon={BanknoteArrowDownIcon} centerPanelContent={!hasData} {...props}>
        <div className="flex h-full flex-col">
          {hasData && (
            <>
              <ul role="list" className="mb-6 grid grid-cols-1 gap-3">
                {numExpenses > 0 &&
                  Object.entries(expenses)
                    .sort(([, a], [, b]) => compareTimePoints(a.timeframe.start, b.timeframe.start))
                    .map(([id, expense], index) => (
                      <DataItem
                        key={id}
                        id={id}
                        index={index}
                        name={expense.name}
                        desc={getExpenseDesc(expense)}
                        leftAddOn={<BanknoteArrowDownIcon className="size-8" />}
                        disabled={expense.disabled}
                        onDropdownClickEdit={() => handleExpenseDropdownClickEdit(expense)}
                        onDropdownClickDelete={() => setExpenseToDelete({ id, name: expense.name })}
                        onDropdownClickDisable={async () => await disableExpense(id)}
                        colorClassName="bg-[var(--chart-3)] dark:bg-[var(--chart-2)]"
                      />
                    ))}
                {numDebts > 0 &&
                  Object.entries(debts)
                    .sort(([, a], [, b]) => compareTimePoints(a.startDate, b.startDate))
                    .map(([id, debt], index) => (
                      <DataItem
                        key={id}
                        id={id}
                        index={index}
                        name={debt.name}
                        desc={getDebtDesc(debt)}
                        leftAddOn={<CreditCardIcon className="size-8" />}
                        disabled={debt.disabled}
                        onDropdownClickEdit={() => handleDebtDropdownClickEdit(debt)}
                        onDropdownClickDelete={() => setDebtToDelete({ id, name: debt.name })}
                        onDropdownClickDisable={async () => await disableDebt(id)}
                        colorClassName="bg-[var(--chart-5)]"
                        syncedWithNWTracker={!!debt.syncedFinanceId}
                      />
                    ))}
              </ul>
              <div className="mt-auto flex items-center justify-end gap-x-2">
                <Button outline onClick={() => setDebtDialogOpen(true)} disabled={!!selectedDebt}>
                  <PlusIcon />
                  Debt
                </Button>
                <Button outline onClick={() => setExpenseDialogOpen(true)} disabled={!!selectedExpense}>
                  <PlusIcon />
                  Expense
                </Button>
              </div>
            </>
          )}
          {!hasData && !isLoading && (
            <div className="flex h-full gap-2 sm:flex-col">
              <DataListEmptyStateButton onClick={() => setExpenseDialogOpen(true)} icon={BanknoteArrowDownIcon} buttonText="Add expense" />
              <DataListEmptyStateButton onClick={() => setDebtDialogOpen(true)} icon={CreditCardIcon} buttonText="Add debt" />
            </div>
          )}
          {isLoading && (
            <>
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-[80px] w-full" />
                <Skeleton className="h-[80px] w-full" />
              </div>
              <div className="mt-auto flex items-center justify-end gap-x-2">
                <Skeleton className="h-[40px] w-[100px] rounded-full" />
                <Skeleton className="h-[40px] w-[100px] rounded-full" />
              </div>
            </>
          )}
        </div>
      </DisclosureSection>
      <Dialog size="xl" open={expenseDialogOpen} onClose={handleExpenseClose}>
        <ExpenseDialog selectedExpense={selectedExpense} numExpenses={numExpenses} onClose={handleExpenseClose} />
      </Dialog>
      <Dialog size="xl" open={debtDialogOpen} onClose={handleDebtClose}>
        <DebtDialog selectedDebt={selectedDebt} debts={debts} nwLiabilities={nwLiabilities} onClose={handleDebtClose} />
      </Dialog>
      <DeleteDataItemAlert dataToDelete={expenseToDelete} setDataToDelete={setExpenseToDelete} deleteData={deleteExpense} />
      <DeleteDataItemAlert dataToDelete={debtToDelete} setDataToDelete={setDebtToDelete} deleteData={deleteDebt} />
    </>
  );
}
