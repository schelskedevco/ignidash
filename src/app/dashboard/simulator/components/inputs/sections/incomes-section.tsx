'use client';

import { useState, RefObject, useCallback } from 'react';
import { BanknoteArrowUpIcon } from 'lucide-react';
import { PlusIcon } from '@heroicons/react/16/solid';

import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { useIncomesData, useDeleteIncome, useUpdateIncomes } from '@/lib/stores/simulator-store';
import { formatNumber } from '@/lib/utils';
import type { DisclosureState } from '@/lib/types/disclosure-state';
import { frequencyForDisplay, timeFrameForDisplay } from '@/lib/utils/data-display-formatters';
import type { IncomeInputs } from '@/lib/schemas/income-form-schema';

import IncomeDialog from '../dialogs/income-dialog';
import DisclosureSectionDataItem from '../disclosure-section-data-item';
import DisclosureSectionDeleteDataAlert from '../disclosure-section-delete-data-alert';
import DisclosureSectionEmptyStateButton from '../disclosure-section-empty-state-button';

function getIncomeDesc(income: IncomeInputs) {
  return (
    <>
      <p>{`${formatNumber(income.amount, 2, '$')} ${frequencyForDisplay(income.frequency)}`}</p>
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
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [selectedIncomeID, setSelectedIncomeID] = useState<string | null>(null);

  const [incomeToDelete, setIncomeToDelete] = useState<{ id: string; name: string } | null>(null);

  const incomes = useIncomesData();
  const hasIncomes = Object.keys(incomes).length > 0;

  const updateIncomes = useUpdateIncomes();
  const deleteIncome = useDeleteIncome();

  const disableIncome = useCallback(
    (id: string) => {
      const income = incomes[id];
      if (!income) return;

      updateIncomes({ ...income, disabled: !income.disabled });
    },
    [incomes, updateIncomes]
  );

  const handleClose = () => {
    setSelectedIncomeID(null);
    setIncomeDialogOpen(false);
  };

  const handleDropdownClickEdit = (id: string) => {
    setIncomeDialogOpen(true);
    setSelectedIncomeID(id);
  };

  return (
    <>
      <DisclosureSection defaultOpen title="Incomes" icon={BanknoteArrowUpIcon} centerPanelContent={!hasIncomes} {...props}>
        <div className="flex h-full flex-col">
          {hasIncomes && (
            <>
              <ul role="list" className="mb-6 grid grid-cols-1 gap-3">
                {Object.entries(incomes).map(([id, income], index) => (
                  <DisclosureSectionDataItem
                    key={id}
                    id={id}
                    index={index}
                    name={income.name}
                    desc={getIncomeDesc(income)}
                    leftAddOn={<BanknoteArrowUpIcon className="size-8" />}
                    disabled={income.disabled}
                    onDropdownClickEdit={() => handleDropdownClickEdit(id)}
                    onDropdownClickDelete={() => setIncomeToDelete({ id, name: income.name })}
                    onDropdownClickDisable={() => disableIncome(id)}
                    colorClassName="bg-[var(--chart-3)] dark:bg-[var(--chart-2)]"
                  />
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-end">
                <Button outline onClick={() => setIncomeDialogOpen(true)} disabled={!!selectedIncomeID}>
                  <PlusIcon />
                  Income
                </Button>
              </div>
            </>
          )}
          {!hasIncomes && (
            <DisclosureSectionEmptyStateButton
              onClick={() => setIncomeDialogOpen(true)}
              icon={BanknoteArrowUpIcon}
              buttonText="Add income"
            />
          )}
        </div>
      </DisclosureSection>
      <Dialog size="xl" open={incomeDialogOpen} onClose={handleClose}>
        <IncomeDialog selectedIncomeID={selectedIncomeID} onClose={handleClose} />
      </Dialog>
      <DisclosureSectionDeleteDataAlert dataToDelete={incomeToDelete} setDataToDelete={setIncomeToDelete} deleteData={deleteIncome} />
    </>
  );
}
