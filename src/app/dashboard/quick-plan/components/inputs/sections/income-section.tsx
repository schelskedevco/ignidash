'use client';

import { useState, RefObject, useCallback } from 'react';
import { BanknoteArrowUpIcon } from 'lucide-react';
import { PlusIcon } from '@heroicons/react/16/solid';

import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { useIncomesData, useDeleteIncome } from '@/lib/stores/quick-plan-store';
import { formatNumber } from '@/lib/utils';
import type { DisclosureState } from '@/lib/types/disclosure-state';

import IncomeDialog from '../dialogs/income-dialog';
import DisclosureSectionDataItem from '../disclosure-section-data-item';
import DisclosureSectionDeleteDataAlert from '../disclosure-section-delete-data-alert';
import DisclosureSectionEmptyStateButton from '../disclosure-section-empty-state-button';

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

  const handleClose = useCallback(() => {
    setSelectedIncomeID(null);
    setIncomeDialogOpen(false);
  }, []);

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
                    desc={formatNumber(income.amount, 2, '$') + ` ${income.frequency}`}
                    leftAddOnCharacter={income.name.charAt(0).toUpperCase()}
                    onDropdownClickEdit={() => {
                      setIncomeDialogOpen(true);
                      setSelectedIncomeID(id);
                    }}
                    onDropdownClickDelete={() => {
                      setIncomeToDelete({ id, name: income.name });
                    }}
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
