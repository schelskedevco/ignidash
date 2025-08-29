'use client';

import { useState, RefObject } from 'react';
import { LandmarkIcon, PiggyBankIcon, TrendingUpIcon } from 'lucide-react';
import { PlusIcon } from '@heroicons/react/16/solid';

import { useAccountsData, useDeleteAccount } from '@/lib/stores/quick-plan-store';
import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/catalyst/alert';
import { formatNumber } from '@/lib/utils';
import type { DisclosureState } from '@/lib/types/disclosure-state';
import { accountTypeForDisplay } from '@/lib/schemas/account-form-schema';

import AccountDialog from '../dialogs/account-dialog';
import SavingsDialog from '../dialogs/savings-dialog';
import DisclosureSectionDataItem from '../disclosure-section-data-item';

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
        {hasAccounts && (
          <div className="flex h-full flex-col">
            <ul role="list" className="mb-6 grid grid-cols-1 gap-3">
              {Object.entries(accounts).map(([id, account], index) => (
                <DisclosureSectionDataItem
                  key={id}
                  id={id}
                  index={index}
                  name={account.name}
                  desc={`${formatNumber(account.currentValue, 2, '$')} | ${accountTypeForDisplay(account.type)}`}
                  leftAddOnCharacter={account.name.charAt(0).toUpperCase()}
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
                />
              ))}
            </ul>
            <div className="mt-auto flex items-center justify-end gap-x-2">
              <Button outline onClick={() => setSavingsDialogOpen(true)}>
                <PlusIcon />
                Savings
              </Button>
              <Button outline onClick={() => setAccountDialogOpen(true)}>
                <PlusIcon />
                Investment
              </Button>
            </div>
          </div>
        )}
        {!hasAccounts && (
          <div className="flex h-full flex-col gap-2">
            <button
              type="button"
              className="focus-outline relative block w-full grow rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400 dark:border-white/15 dark:hover:border-white/25"
              onClick={() => setSavingsDialogOpen(true)}
            >
              <PiggyBankIcon aria-hidden="true" className="text-primary mx-auto size-12" />
              <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-white">Add savings</span>
            </button>
            <button
              type="button"
              className="focus-outline relative block w-full grow rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-gray-400 dark:border-white/15 dark:hover:border-white/25"
              onClick={() => setAccountDialogOpen(true)}
            >
              <TrendingUpIcon aria-hidden="true" className="text-primary mx-auto size-12" />
              <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-white">Add investment</span>
            </button>
          </div>
        )}
      </DisclosureSection>
      <Dialog
        size="xl"
        open={accountDialogOpen}
        onClose={() => {
          setSelectedAccountID(null);
          setAccountDialogOpen(false);
        }}
      >
        <AccountDialog setAccountDialogOpen={setAccountDialogOpen} selectedAccountID={selectedAccountID} />
      </Dialog>
      <Dialog
        size="xl"
        open={savingsDialogOpen}
        onClose={() => {
          setSelectedSavingsID(null);
          setSavingsDialogOpen(false);
        }}
      >
        <SavingsDialog setSavingsDialogOpen={setSavingsDialogOpen} selectedAccountID={selectedSavingsID} />
      </Dialog>
      <Alert
        open={!!accountToDelete}
        onClose={() => {
          setAccountToDelete(null);
        }}
      >
        <AlertTitle>Are you sure you want to delete {accountToDelete ? `"${accountToDelete.name}"` : 'this account'}?</AlertTitle>
        <AlertDescription>This action cannot be undone.</AlertDescription>
        <AlertActions>
          <Button plain onClick={() => setAccountToDelete(null)}>
            Cancel
          </Button>
          <Button
            color="red"
            onClick={() => {
              deleteAccount(accountToDelete!.id);
              setAccountToDelete(null);
            }}
          >
            Delete
          </Button>
        </AlertActions>
      </Alert>
    </>
  );
}
