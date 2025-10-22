'use client';

import { useState, RefObject, useCallback } from 'react';
import { LandmarkIcon, PiggyBankIcon, TrendingUpIcon } from 'lucide-react';
import { PlusIcon } from '@heroicons/react/16/solid';

import { useAccountsData, useDeleteAccount } from '@/lib/stores/quick-plan-store';
import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { formatNumber } from '@/lib/utils';
import type { DisclosureState } from '@/lib/types/disclosure-state';
import { accountTypeForDisplay } from '@/lib/schemas/account-form-schema';

import AccountDialog from '../dialogs/account-dialog';
import SavingsDialog from '../dialogs/savings-dialog';
import DisclosureSectionDataItem from '../disclosure-section-data-item';
import DisclosureSectionDeleteDataAlert from '../disclosure-section-delete-data-alert';
import DisclosureSectionEmptyStateButton from '../disclosure-section-empty-state-button';

interface PortfolioSectionProps {
  toggleDisclosure: (newDisclosure: DisclosureState) => void;
  disclosureButtonRef: RefObject<HTMLButtonElement | null>;
  disclosureKey: string;
}

export default function PortfolioSection({ toggleDisclosure, disclosureButtonRef, disclosureKey }: PortfolioSectionProps) {
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [selectedAccountID, setSelectedAccountID] = useState<string | null>(null);

  const [savingsDialogOpen, setSavingsDialogOpen] = useState(false);
  const [selectedSavingsID, setSelectedSavingsID] = useState<string | null>(null);

  const [accountToDelete, setAccountToDelete] = useState<{ id: string; name: string } | null>(null);

  const accounts = useAccountsData();
  const hasAccounts = Object.keys(accounts).length > 0;

  const deleteAccount = useDeleteAccount();

  const handleAccountDialogClose = useCallback(() => {
    setSelectedAccountID(null);
    setAccountDialogOpen(false);
  }, []);

  const handleSavingsDialogClose = useCallback(() => {
    setSelectedSavingsID(null);
    setSavingsDialogOpen(false);
  }, []);

  return (
    <>
      <DisclosureSection
        title="Portfolio"
        icon={LandmarkIcon}
        centerPanelContent={!hasAccounts}
        toggleDisclosure={toggleDisclosure}
        disclosureButtonRef={disclosureButtonRef}
        disclosureKey={disclosureKey}
      >
        <div className="flex h-full flex-col gap-2">
          {hasAccounts && (
            <>
              <ul role="list" className="mb-6 grid grid-cols-1 gap-3">
                {Object.entries(accounts).map(([id, account], index) => (
                  <DisclosureSectionDataItem
                    key={id}
                    id={id}
                    index={index}
                    name={account.name}
                    desc={<p>{`${formatNumber(account.currentValue, 2, '$')} | ${accountTypeForDisplay(account.type)}`}</p>}
                    leftAddOn={account.type === 'savings' ? <PiggyBankIcon className="size-8" /> : <TrendingUpIcon className="size-8" />}
                    onDropdownClickEdit={() => {
                      if (account.type === 'savings') {
                        setSavingsDialogOpen(true);
                        setSelectedSavingsID(id);
                      } else {
                        setAccountDialogOpen(true);
                        setSelectedAccountID(id);
                      }
                    }}
                    onDropdownClickDelete={() => {
                      setAccountToDelete({ id, name: account.name });
                    }}
                    colorClassName="bg-[var(--chart-3)] dark:bg-[var(--chart-2)]"
                  />
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-end gap-x-2">
                <Button outline onClick={() => setSavingsDialogOpen(true)} disabled={!!selectedSavingsID}>
                  <PlusIcon />
                  Savings
                </Button>
                <Button outline onClick={() => setAccountDialogOpen(true)} disabled={!!selectedAccountID}>
                  <PlusIcon />
                  Investment
                </Button>
              </div>
            </>
          )}
          {!hasAccounts && (
            <div className="flex h-full gap-2 sm:flex-col">
              <DisclosureSectionEmptyStateButton onClick={() => setSavingsDialogOpen(true)} icon={PiggyBankIcon} buttonText="Add savings" />
              <DisclosureSectionEmptyStateButton
                onClick={() => setAccountDialogOpen(true)}
                icon={TrendingUpIcon}
                buttonText="Add investment"
              />
            </div>
          )}
        </div>
      </DisclosureSection>
      <Dialog size="xl" open={accountDialogOpen} onClose={handleAccountDialogClose}>
        <AccountDialog selectedAccountID={selectedAccountID} onClose={handleAccountDialogClose} />
      </Dialog>
      <Dialog size="xl" open={savingsDialogOpen} onClose={handleSavingsDialogClose}>
        <SavingsDialog selectedAccountID={selectedSavingsID} onClose={handleSavingsDialogClose} />
      </Dialog>
      <DisclosureSectionDeleteDataAlert dataToDelete={accountToDelete} setDataToDelete={setAccountToDelete} deleteData={deleteAccount} />
    </>
  );
}
