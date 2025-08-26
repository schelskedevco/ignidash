'use client';

import { useState } from 'react';
import { BanknoteArrowDownIcon } from 'lucide-react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/16/solid';

import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';
import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/catalyst/alert';
import { useExpensesData, useDeleteExpense } from '@/lib/stores/quick-plan-store';
import { cn, formatNumber } from '@/lib/utils';

import ExpenseDialog from '../dialogs/expense-dialog';

const colors = ['bg-rose-500/50', 'bg-rose-500/75', 'bg-rose-500'];

export default function ExpensesSection() {
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [selectedExpenseID, setSelectedExpenseID] = useState<string | null>(null);

  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; name: string } | null>(null);

  const expenses = useExpensesData();
  const hasExpenses = Object.keys(expenses).length > 0;

  const deleteExpense = useDeleteExpense();

  return (
    <>
      <DisclosureSection title="Expenses" icon={BanknoteArrowDownIcon} centerPanelContent={!hasExpenses}>
        {hasExpenses && (
          <>
            <ul role="list" className="grid grid-cols-1 gap-3">
              {Object.entries(expenses).map(([id, expense], index) => (
                <li key={id} className="col-span-1 flex rounded-md shadow-xs dark:shadow-none">
                  <div
                    className={cn(
                      'border-foreground/50 flex w-16 shrink-0 items-center justify-center rounded-l-md border text-xl font-medium text-white',
                      colors[index % colors.length]
                    )}
                  >
                    {expense.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="bg-emphasized-background/25 border-border flex flex-1 items-center justify-between truncate rounded-r-md border-t border-r border-b">
                    <div className="flex-1 truncate px-4 py-2 text-sm">
                      <span className="font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-200">
                        {expense.name}
                      </span>
                      <p className="text-muted-foreground">{formatNumber(expense.amount, 2, '$') + ` ${expense.frequency}`}</p>
                    </div>
                    <div className="shrink-0 pr-2">
                      <Dropdown>
                        <DropdownButton plain aria-label="Open options">
                          <EllipsisVerticalIcon />
                        </DropdownButton>
                        <DropdownMenu>
                          <DropdownItem
                            onClick={() => {
                              setExpenseDialogOpen(true);
                              setSelectedExpenseID(id);
                            }}
                          >
                            Edit
                          </DropdownItem>
                          <DropdownItem
                            onClick={() => {
                              setExpenseToDelete({ id, name: expense.name });
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
            <div className="mt-6 flex items-center justify-end">
              <Button outline onClick={() => setExpenseDialogOpen(true)}>
                <PlusIcon />
                Expenses
              </Button>
            </div>
          </>
        )}
        {!hasExpenses && (
          <button
            type="button"
            className="focus-outline relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-gray-400 sm:p-12 dark:border-white/15 dark:hover:border-white/25"
            onClick={() => setExpenseDialogOpen(true)}
          >
            <BanknoteArrowDownIcon aria-hidden="true" className="text-primary mx-auto size-12" />
            <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-white">Add expense</span>
          </button>
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
      <Alert
        open={!!expenseToDelete}
        onClose={() => {
          setExpenseToDelete(null);
        }}
      >
        <AlertTitle>Are you sure you want to delete {expenseToDelete ? `"${expenseToDelete.name}"` : 'this expense'}?</AlertTitle>
        <AlertDescription>This action cannot be undone.</AlertDescription>
        <AlertActions>
          <Button plain onClick={() => setExpenseToDelete(null)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              deleteExpense(expenseToDelete!.id);
              setExpenseToDelete(null);
            }}
          >
            Delete
          </Button>
        </AlertActions>
      </Alert>
    </>
  );
}
