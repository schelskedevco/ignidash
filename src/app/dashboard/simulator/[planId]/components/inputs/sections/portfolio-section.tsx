'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, RefObject } from 'react';
import { LandmarkIcon, PiggyBankIcon, TrendingUpIcon, RouteIcon } from 'lucide-react';
import { PlusIcon } from '@heroicons/react/16/solid';

import { useAccountsData, useGlidePathData } from '@/hooks/use-convex-data';
import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { formatNumber } from '@/lib/utils';
import type { DisclosureState } from '@/lib/types/disclosure-state';
import { accountTypeForDisplay, taxCategoryFromAccountType } from '@/lib/schemas/inputs/account-form-schema';
import type { TaxCategory } from '@/lib/calc/asset';
import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import DataItem from '@/components/ui/data-item';
import { Skeleton } from '@/components/ui/skeleton';
import DeleteDataItemAlert from '@/components/ui/delete-data-item-alert';
import DataListEmptyStateButton from '@/components/ui/data-list-empty-state-button';

import AccountDialog from '../dialogs/account-dialog';
import SavingsDialog from '../dialogs/savings-dialog';
import GlidePathDialog from '../dialogs/glide-path-dialog';

function getAccountDesc(account: AccountInputs) {
  return (
    <p>
      {formatNumber(account.balance, 2, '$')} | {accountTypeForDisplay(account.type)}
      {account.type !== 'savings' && ` | ${account.percentBonds ? `${formatNumber(account.percentBonds, 0)}% Bonds` : 'No Bonds'}`}
    </p>
  );
}

const COLOR_MAP: Record<TaxCategory, string> = {
  taxable: 'bg-[var(--chart-1)]',
  taxDeferred: 'bg-[var(--chart-2)]',
  taxFree: 'bg-[var(--chart-3)]',
  cashSavings: 'bg-[var(--chart-4)]',
} as const;

interface PortfolioSectionProps {
  toggleDisclosure: (newDisclosure: DisclosureState) => void;
  disclosureButtonRef: RefObject<HTMLButtonElement | null>;
  disclosureKey: string;
}

export default function PortfolioSection(props: PortfolioSectionProps) {
  const planId = useSelectedPlanId();

  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountInputs | null>(null);

  const [savingsDialogOpen, setSavingsDialogOpen] = useState(false);
  const [selectedSavings, setSelectedSavings] = useState<AccountInputs | null>(null);

  const [glidePathDialogOpen, setGlidePathDialogOpen] = useState(false);

  const [accountToDelete, setAccountToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: accounts, isLoading } = useAccountsData();
  const numAccounts = Object.keys(accounts).length;
  const hasAccounts = numAccounts > 0;

  const { data: glidePath } = useGlidePathData();

  const m = useMutation(api.account.deleteAccount);
  const deleteAccount = async (accountId: string) => {
    await m({ accountId, planId });
  };

  const handleAccountDialogClose = () => {
    setSelectedAccount(null);
    setAccountDialogOpen(false);
  };

  const handleSavingsDialogClose = () => {
    setSelectedSavings(null);
    setSavingsDialogOpen(false);
  };

  const handleGlidePathDialogClose = () => {
    setGlidePathDialogOpen(false);
  };

  const handleDropdownClickEdit = (account: AccountInputs) => {
    if (account.type === 'savings') {
      setSelectedSavings(account);
      setSavingsDialogOpen(true);
    } else {
      setSelectedAccount(account);
      setAccountDialogOpen(true);
    }
  };

  return (
    <>
      <DisclosureSection title="Portfolio" icon={LandmarkIcon} centerPanelContent={!hasAccounts} {...props}>
        <div className="flex h-full flex-col gap-2">
          {hasAccounts && (
            <>
              <ul role="list" className="mb-6 grid grid-cols-1 gap-3">
                {Object.entries(accounts).map(([id, account], index) => (
                  <DataItem
                    key={id}
                    id={id}
                    index={index}
                    name={account.name}
                    desc={getAccountDesc(account)}
                    leftAddOn={account.type === 'savings' ? <PiggyBankIcon className="size-8" /> : <TrendingUpIcon className="size-8" />}
                    onDropdownClickEdit={() => handleDropdownClickEdit(account)}
                    onDropdownClickDelete={() => setAccountToDelete({ id, name: account.name })}
                    colorClassName={COLOR_MAP[taxCategoryFromAccountType(account.type)]}
                  />
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-end gap-x-2">
                <Button outline onClick={() => setGlidePathDialogOpen(true)}>
                  <RouteIcon data-slot="icon" />
                </Button>
                <Button outline onClick={() => setSavingsDialogOpen(true)} disabled={!!selectedSavings}>
                  <PlusIcon />
                  Savings
                </Button>
                <Button outline onClick={() => setAccountDialogOpen(true)} disabled={!!selectedAccount}>
                  <PlusIcon />
                  Investment
                </Button>
              </div>
            </>
          )}
          {!hasAccounts && !isLoading && (
            <div className="flex h-full gap-2 sm:flex-col">
              <DataListEmptyStateButton onClick={() => setSavingsDialogOpen(true)} icon={PiggyBankIcon} buttonText="Add savings" />
              <DataListEmptyStateButton onClick={() => setAccountDialogOpen(true)} icon={TrendingUpIcon} buttonText="Add investment" />
            </div>
          )}
          {isLoading && (
            <>
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-[80px] w-full" />
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
      <Dialog size="xl" open={accountDialogOpen} onClose={handleAccountDialogClose}>
        <AccountDialog selectedAccount={selectedAccount} numAccounts={numAccounts} onClose={handleAccountDialogClose} />
      </Dialog>
      <Dialog size="xl" open={savingsDialogOpen} onClose={handleSavingsDialogClose}>
        <SavingsDialog selectedAccount={selectedSavings} numAccounts={numAccounts} onClose={handleSavingsDialogClose} />
      </Dialog>
      <Dialog size="xl" open={glidePathDialogOpen} onClose={handleGlidePathDialogClose}>
        <GlidePathDialog glidePath={glidePath} accounts={Object.values(accounts)} onClose={handleGlidePathDialogClose} />
      </Dialog>
      <DeleteDataItemAlert dataToDelete={accountToDelete} setDataToDelete={setAccountToDelete} deleteData={deleteAccount} />
    </>
  );
}
