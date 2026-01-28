'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState, RefObject, useCallback } from 'react';
import { LandmarkIcon, PiggyBankIcon, TrendingUpIcon, RouteIcon, HomeIcon } from 'lucide-react';
import { PlusIcon } from '@heroicons/react/16/solid';

import { useAccountsData, useGlidePathData, usePhysicalAssetsData } from '@/hooks/use-convex-data';
import DisclosureSection from '@/components/ui/disclosure-section';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { formatNumber } from '@/lib/utils';
import type { DisclosureState } from '@/lib/types/disclosure-state';
import { accountTypeForDisplay, taxCategoryFromAccountType } from '@/lib/schemas/inputs/account-form-schema';
import type { TaxCategory } from '@/lib/calc/asset';
import type { AccountInputs } from '@/lib/schemas/inputs/account-form-schema';
import type { PhysicalAssetInputs } from '@/lib/schemas/inputs/physical-asset-form-schema';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import DataItem from '@/components/ui/data-item';
import { Skeleton } from '@/components/ui/skeleton';
import DeleteDataItemAlert from '@/components/ui/delete-data-item-alert';
import DataListEmptyStateButton from '@/components/ui/data-list-empty-state-button';

import AccountDialog from '../dialogs/account-dialog';
import SavingsDialog from '../dialogs/savings-dialog';
import GlidePathDialog from '../dialogs/glide-path-dialog';
import PhysicalAssetDialog from '../dialogs/physical-asset-dialog';

function getAccountDesc(account: AccountInputs) {
  return (
    <p>
      {formatNumber(account.balance, 2, '$')} | {accountTypeForDisplay(account.type)}
      {account.type !== 'savings' && ` | ${account.percentBonds ? `${formatNumber(account.percentBonds, 0)}% Bonds` : 'No Bonds'}`}
    </p>
  );
}

function getPhysicalAssetDesc(asset: PhysicalAssetInputs) {
  return (
    <p>
      {formatNumber(asset.marketValue ?? asset.purchasePrice, 2, '$')} | {formatNumber(asset.appreciationRate, 1)}% appreciation
    </p>
  );
}

const ACCOUNT_COLOR_MAP: Record<TaxCategory, string> = {
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
  const [accountToDelete, setAccountToDelete] = useState<{ id: string; name: string } | null>(null);

  const [glidePathDialogOpen, setGlidePathDialogOpen] = useState(false);

  const [physicalAssetDialogOpen, setPhysicalAssetDialogOpen] = useState(false);
  const [selectedPhysicalAsset, setSelectedPhysicalAsset] = useState<PhysicalAssetInputs | null>(null);
  const [physicalAssetToDelete, setPhysicalAssetToDelete] = useState<{ id: string; name: string } | null>(null);

  const { data: accounts, isLoading: accountsLoading } = useAccountsData();
  const numAccounts = Object.keys(accounts).length;

  const { data: physicalAssets, isLoading: physicalAssetsLoading } = usePhysicalAssetsData();
  const numPhysicalAssets = Object.keys(physicalAssets).length;

  const { data: glidePath } = useGlidePathData();

  const isLoading = accountsLoading || physicalAssetsLoading;
  const hasData = numAccounts > 0 || numPhysicalAssets > 0;

  const deleteAccountMutation = useMutation(api.account.deleteAccount);
  const deleteAccount = useCallback(
    async (accountId: string) => {
      await deleteAccountMutation({ accountId, planId });
    },
    [deleteAccountMutation, planId]
  );

  const deletePhysicalAssetMutation = useMutation(api.physical_asset.deletePhysicalAsset);
  const deletePhysicalAsset = useCallback(
    async (physicalAssetId: string) => {
      await deletePhysicalAssetMutation({ physicalAssetId, planId });
    },
    [deletePhysicalAssetMutation, planId]
  );

  const handleAccountDialogClose = () => {
    setSelectedAccount(null);
    setAccountDialogOpen(false);
  };
  const handleSavingsDialogClose = () => {
    setSelectedSavings(null);
    setSavingsDialogOpen(false);
  };
  const handleAccountDropdownClickEdit = (account: AccountInputs) => {
    if (account.type === 'savings') {
      setSelectedSavings(account);
      setSavingsDialogOpen(true);
    } else {
      setSelectedAccount(account);
      setAccountDialogOpen(true);
    }
  };

  const handleGlidePathDialogClose = () => {
    setGlidePathDialogOpen(false);
  };

  const handlePhysicalAssetDialogClose = () => {
    setSelectedPhysicalAsset(null);
    setPhysicalAssetDialogOpen(false);
  };
  const handlePhysicalAssetDropdownClickEdit = (asset: PhysicalAssetInputs) => {
    setSelectedPhysicalAsset(asset);
    setPhysicalAssetDialogOpen(true);
  };

  return (
    <>
      <DisclosureSection title="Portfolio" icon={LandmarkIcon} centerPanelContent={!hasData} {...props}>
        <div className="flex h-full flex-col gap-2">
          {hasData && (
            <>
              <ul role="list" className="mb-6 grid grid-cols-1 gap-3">
                {numAccounts > 0 &&
                  Object.entries(accounts).map(([id, account], index) => (
                    <DataItem
                      key={id}
                      id={id}
                      index={index}
                      name={account.name}
                      desc={getAccountDesc(account)}
                      leftAddOn={account.type === 'savings' ? <PiggyBankIcon className="size-8" /> : <TrendingUpIcon className="size-8" />}
                      onDropdownClickEdit={() => handleAccountDropdownClickEdit(account)}
                      onDropdownClickDelete={() => setAccountToDelete({ id, name: account.name })}
                      colorClassName={ACCOUNT_COLOR_MAP[taxCategoryFromAccountType(account.type)]}
                    />
                  ))}
                {numPhysicalAssets > 0 &&
                  Object.entries(physicalAssets).map(([id, asset], index) => (
                    <DataItem
                      key={id}
                      id={id}
                      index={index}
                      name={asset.name}
                      desc={getPhysicalAssetDesc(asset)}
                      leftAddOn={<HomeIcon className="size-8" />}
                      onDropdownClickEdit={() => handlePhysicalAssetDropdownClickEdit(asset)}
                      onDropdownClickDelete={() => setPhysicalAssetToDelete({ id, name: asset.name })}
                      colorClassName="bg-[var(--chart-7)]"
                    />
                  ))}
              </ul>
              <div className="mt-auto flex flex-col items-end gap-y-2">
                <Button outline onClick={() => setPhysicalAssetDialogOpen(true)} disabled={!!selectedPhysicalAsset}>
                  <PlusIcon />
                  Physical asset
                </Button>
                <div className="flex items-center gap-x-2">
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
              </div>
            </>
          )}
          {!hasData && !isLoading && (
            <div className="flex h-full gap-2 sm:flex-col">
              <DataListEmptyStateButton onClick={() => setSavingsDialogOpen(true)} icon={PiggyBankIcon} buttonText="Add savings" />
              <DataListEmptyStateButton onClick={() => setAccountDialogOpen(true)} icon={TrendingUpIcon} buttonText="Add investment" />
              <DataListEmptyStateButton onClick={() => setPhysicalAssetDialogOpen(true)} icon={HomeIcon} buttonText="Add physical asset" />
            </div>
          )}
          {isLoading && (
            <>
              <div className="flex flex-1 flex-col gap-3">
                <Skeleton className="h-[80px] w-full" />
                <Skeleton className="h-[80px] w-full" />
                <Skeleton className="h-[80px] w-full" />
              </div>
              <div className="mt-auto flex flex-col items-end gap-y-2">
                <Skeleton className="h-[40px] w-[100px] rounded-full" />
                <div className="flex items-center gap-x-2">
                  <Skeleton className="h-[40px] w-[40px] rounded-full" />
                  <Skeleton className="h-[40px] w-[100px] rounded-full" />
                  <Skeleton className="h-[40px] w-[100px] rounded-full" />
                </div>
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
      <Dialog size="xl" open={physicalAssetDialogOpen} onClose={handlePhysicalAssetDialogClose}>
        <PhysicalAssetDialog
          selectedPhysicalAsset={selectedPhysicalAsset}
          numPhysicalAssets={numPhysicalAssets}
          onClose={handlePhysicalAssetDialogClose}
        />
      </Dialog>
      <DeleteDataItemAlert dataToDelete={accountToDelete} setDataToDelete={setAccountToDelete} deleteData={deleteAccount} />
      <DeleteDataItemAlert
        dataToDelete={physicalAssetToDelete}
        setDataToDelete={setPhysicalAssetToDelete}
        deleteData={deletePhysicalAsset}
      />
    </>
  );
}
