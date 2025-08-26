'use client';

import { useState, RefObject } from 'react';
import { LandmarkIcon, PiggyBankIcon, TrendingUpIcon } from 'lucide-react';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/16/solid';

import { useAccountsData, useDeleteAccount } from '@/lib/stores/quick-plan-store';
import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';
import { Alert, AlertActions, AlertDescription, AlertTitle } from '@/components/catalyst/alert';
import { cn, formatNumber } from '@/lib/utils';
import type { DisclosureState } from '@/lib/types/disclosure-state';

import AccountDialog from '../dialogs/account-dialog';
import SavingsDialog from '../dialogs/savings-dialog';

const colors = ['bg-rose-500/50', 'bg-rose-500/75', 'bg-rose-500'];

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
          <>
            <ul role="list" className="grid grid-cols-1 gap-3">
              {Object.entries(accounts).map(([id, account], index) => (
                <li key={id} className="col-span-1 flex rounded-md shadow-xs dark:shadow-none">
                  <div
                    className={cn(
                      'border-foreground/50 flex w-16 shrink-0 items-center justify-center rounded-l-md border text-xl font-medium text-white',
                      colors[index % colors.length]
                    )}
                  >
                    {account.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="bg-emphasized-background/25 border-border flex flex-1 items-center justify-between truncate rounded-r-md border-t border-r border-b">
                    <div className="flex-1 truncate px-4 py-2 text-sm">
                      <span className="font-medium text-gray-900 hover:text-gray-600 dark:text-white dark:hover:text-gray-200">
                        {account.name}
                      </span>
                      <p className="text-muted-foreground">{formatNumber(account.balance, 2, '$')}</p>
                    </div>
                    <div className="shrink-0 pr-2">
                      <Dropdown>
                        <DropdownButton plain aria-label="Open options">
                          <EllipsisVerticalIcon />
                        </DropdownButton>
                        <DropdownMenu>
                          <DropdownItem
                            onClick={() => {
                              if (account.type === 'savings') {
                                setSavingsDialogOpen(true);
                                setSelectedSavingsID(id);
                              } else {
                                setAccountDialogOpen(true);
                                setSelectedAccountID(id);
                              }
                            }}
                          >
                            Edit
                          </DropdownItem>
                          <DropdownItem
                            onClick={() => {
                              setAccountToDelete({ id, name: account.name });
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
            <div className="mt-6 flex items-center justify-end gap-x-2">
              <Button outline onClick={() => setSavingsDialogOpen(true)}>
                <PlusIcon />
                Savings
              </Button>
              <Button outline onClick={() => setAccountDialogOpen(true)}>
                <PlusIcon />
                Investment
              </Button>
            </div>
          </>
        )}
        {!hasAccounts && (
          <div className="flex h-full flex-col gap-2">
            <button
              type="button"
              className="focus-outline relative block w-full grow rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-gray-400 sm:p-12 dark:border-white/15 dark:hover:border-white/25"
              onClick={() => setSavingsDialogOpen(true)}
            >
              <PiggyBankIcon aria-hidden="true" className="text-primary mx-auto size-12" />
              <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-white">Add savings</span>
            </button>
            <button
              type="button"
              className="focus-outline relative block w-full grow rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-gray-400 sm:p-12 dark:border-white/15 dark:hover:border-white/25"
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
