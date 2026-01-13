'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, RefObject, useCallback } from 'react';
import { BanknoteArrowUpIcon } from 'lucide-react';
import { PlusIcon } from '@heroicons/react/16/solid';

import { useIncomesData } from '@/hooks/use-convex-data';
import { incomeToConvex } from '@/lib/utils/convex-to-zod-transformers';
import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { formatNumber } from '@/lib/utils';
import type { DisclosureState } from '@/lib/types/disclosure-state';
import { frequencyForDisplay, timeFrameForDisplay } from '@/lib/utils/data-display-formatters';
import type { IncomeInputs } from '@/lib/schemas/inputs/income-form-schema';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import DataItem from '@/components/ui/data-item';
import { Skeleton } from '@/components/ui/skeleton';
import DeleteDataItemAlert from '@/components/ui/delete-data-item-alert';
import DataListEmptyStateButton from '@/components/ui/data-list-empty-state-button';

import IncomeDialog from '../dialogs/income-dialog';

function getIncomeDesc(income: IncomeInputs) {
  return (
    <>
      <p>
        {formatNumber(income.amount, 2, '$')} {frequencyForDisplay(income.frequency)}
      </p>
      <p>{timeFrameForDisplay(income.timeframe.start, income.timeframe.end)}</p>
    </>
  );
}

interface IncomesSectionProps {
  toggleDisclosure: (newDisclosure: DisclosureState) => void;
  disclosureButtonRef: RefObject<HTMLButtonElement | null>;
  disclosureKey: string;
}

export default function IncomesSection(props: IncomesSectionProps) {
  const planId = useSelectedPlanId();

  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<IncomeInputs | null>(null);

  const [incomeToDelete, setIncomeToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: incomes, isLoading } = useIncomesData();
  const numIncomes = Object.keys(incomes).length;
  const hasIncomes = numIncomes > 0;

  const updateMutation = useMutation(api.income.upsertIncome);
  const updateIncomes = useCallback(
    async (data: IncomeInputs) => {
      const income = incomeToConvex(data);
      await updateMutation({ income, planId });
    },
    [updateMutation, planId]
  );

  const deleteMutation = useMutation(api.income.deleteIncome);
  const deleteIncome = useCallback(
    async (incomeId: string) => {
      await deleteMutation({ incomeId, planId });
    },
    [deleteMutation, planId]
  );

  const disableIncome = useCallback(
    async (id: string) => {
      const income = incomes[id];
      if (!income) return;

      await updateIncomes({ ...income, disabled: !income.disabled });
    },
    [incomes, updateIncomes]
  );

  const handleClose = () => {
    setSelectedIncome(null);
    setIncomeDialogOpen(false);
  };

  const handleDropdownClickEdit = (income: IncomeInputs) => {
    setSelectedIncome(income);
    setIncomeDialogOpen(true);
  };

  return (
    <>
      <DisclosureSection defaultOpen title="Incomes" icon={BanknoteArrowUpIcon} centerPanelContent={!hasIncomes} {...props}>
        <div className="flex h-full flex-col">
          {hasIncomes && (
            <>
              <ul role="list" className="mb-6 grid grid-cols-1 gap-3">
                {Object.entries(incomes).map(([id, income], index) => (
                  <DataItem
                    key={id}
                    id={id}
                    index={index}
                    name={income.name}
                    desc={getIncomeDesc(income)}
                    leftAddOn={<BanknoteArrowUpIcon className="size-8" />}
                    disabled={income.disabled}
                    onDropdownClickEdit={() => handleDropdownClickEdit(income)}
                    onDropdownClickDelete={() => setIncomeToDelete({ id, name: income.name })}
                    onDropdownClickDisable={async () => await disableIncome(id)}
                    colorClassName="bg-[var(--chart-3)] dark:bg-[var(--chart-2)]"
                  />
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-end gap-x-2">
                <Button outline onClick={() => setIncomeDialogOpen(true)} disabled={!!selectedIncome}>
                  <PlusIcon />
                  Income
                </Button>
              </div>
            </>
          )}
          {!hasIncomes && !isLoading && (
            <DataListEmptyStateButton onClick={() => setIncomeDialogOpen(true)} icon={BanknoteArrowUpIcon} buttonText="Add income" />
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
      <Dialog size="xl" open={incomeDialogOpen} onClose={handleClose}>
        <IncomeDialog selectedIncome={selectedIncome} numIncomes={numIncomes} onClose={handleClose} />
      </Dialog>
      <DeleteDataItemAlert dataToDelete={incomeToDelete} setDataToDelete={setIncomeToDelete} deleteData={deleteIncome} />
    </>
  );
}
