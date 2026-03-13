'use client';

import { useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { Preloaded } from 'convex/react';
import { usePreloadedAuthQuery } from '@convex-dev/better-auth/nextjs/client';
import { useState } from 'react';
import { WalletIcon as MicroWalletIcon, CreditCardIcon as MicroCreditCardIcon, BuildingLibraryIcon } from '@heroicons/react/16/solid';
import { WalletIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { ExternalLinkIcon, LinkIcon } from 'lucide-react';

import { type AssetInputs, assetTypeForDisplay, assetIconForDisplay } from '@/lib/schemas/finances/asset-form-schema';
import { type LiabilityInputs, liabilityTypeForDisplay, liabilityIconForDisplay } from '@/lib/schemas/finances/liability-form-schema';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { formatCompactCurrency } from '@/lib/utils/number-formatters';
import { Heading, Subheading } from '@/components/catalyst/heading';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Divider } from '@/components/catalyst/divider';
import DataItem from '@/components/ui/data-item';
import DataListEmptyStateButton from '@/components/ui/data-list-empty-state-button';
import DeleteDataItemAlert from '@/components/ui/delete-data-item-alert';
import { cn } from '@/lib/utils';
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '@/components/catalyst/dropdown';
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';
import PlaidLinkButton from '@/components/ui/plaid-link-button';
import { usePlaidItemsData, usePlaidConfigured } from '@/hooks/use-convex-data';
import AssetDialog from './dialogs/asset-dialog';
import LiabilityDialog from './dialogs/liability-dialog';

function InstitutionPill({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
      <LinkIcon className="size-2.5" />
      {name}
    </span>
  );
}

function getAssetDesc(asset: AssetInputs, institutionName?: string) {
  return (
    <>
      <p className="flex items-center gap-1.5">
        {formatCompactCurrency(asset.value, 1)} | {assetTypeForDisplay(asset.type)}
        {institutionName && <InstitutionPill name={institutionName} />}
      </p>
      <p>
        Updated <time dateTime={new Date(asset.updatedAt).toISOString()}>{new Date(asset.updatedAt).toLocaleDateString()}</time>
      </p>
    </>
  );
}

function getLiabilityDesc(liability: LiabilityInputs, institutionName?: string) {
  return (
    <>
      <p className="flex items-center gap-1.5">
        {formatCompactCurrency(liability.balance, 1)} | {liabilityTypeForDisplay(liability.type)}
        {institutionName && <InstitutionPill name={institutionName} />}
      </p>
      <p>
        Updated <time dateTime={new Date(liability.updatedAt).toISOString()}>{new Date(liability.updatedAt).toLocaleDateString()}</time>
      </p>
    </>
  );
}

function HoverableIcon({
  defaultIcon: DefaultIcon,
  hoverIcon: HoverIcon,
  className,
  href,
}: {
  defaultIcon: React.ComponentType<{ className?: string }>;
  hoverIcon: React.ComponentType<{ className?: string }>;
  className?: string;
  href?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  if (!href) return <DefaultIcon className={className} />;

  return (
    <div
      className="relative flex size-full items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <DefaultIcon className={cn(className, 'transition-opacity duration-100', { 'opacity-0': isHovered })} />
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn('absolute inset-0 flex items-center justify-center transition-opacity duration-100', {
          'pointer-events-none opacity-0': !isHovered,
        })}
      >
        <HoverIcon className={className} />
      </a>
    </div>
  );
}

interface FinancesProps {
  preloadedAssets: Preloaded<typeof api.finances.getAssets>;
  preloadedLiabilities: Preloaded<typeof api.finances.getLiabilities>;
}

export default function Finances({ preloadedAssets, preloadedLiabilities }: FinancesProps) {
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetInputs | null>(null);

  const assets = usePreloadedAuthQuery(preloadedAssets);
  const numAssets = assets?.length ?? 0;

  const handleAssetDialogClose = () => {
    setAssetDialogOpen(false);
    setSelectedAsset(null);
  };

  const [liabilityDialogOpen, setLiabilityDialogOpen] = useState(false);
  const [selectedLiability, setSelectedLiability] = useState<LiabilityInputs | null>(null);

  const liabilities = usePreloadedAuthQuery(preloadedLiabilities);
  const numLiabilities = liabilities?.length ?? 0;

  const handleLiabilityDialogClose = () => {
    setLiabilityDialogOpen(false);
    setSelectedLiability(null);
  };

  const hasAssets = numAssets > 0;
  const hasLiabilities = numLiabilities > 0;

  const [assetToDelete, setAssetToDelete] = useState<{ id: string; name: string } | null>(null);
  const deleteAssetMutation = useMutation(api.finances.deleteAsset);
  const deleteAsset = async (assetId: string) => {
    await deleteAssetMutation({ assetId });
  };

  const [liabilityToDelete, setLiabilityToDelete] = useState<{ id: string; name: string } | null>(null);
  const deleteLiabilityMutation = useMutation(api.finances.deleteLiability);
  const deleteLiability = async (liabilityId: string) => {
    await deleteLiabilityMutation({ liabilityId });
  };

  const handleEditAsset = (asset: AssetInputs) => {
    setSelectedAsset(asset);
    setAssetDialogOpen(true);
  };

  const handleEditLiability = (liability: LiabilityInputs) => {
    setSelectedLiability(liability);
    setLiabilityDialogOpen(true);
  };

  const totalAssets = assets?.reduce((acc, asset) => acc + asset.value, 0) ?? 0;
  const totalLiabilities = liabilities?.reduce((acc, liability) => acc + liability.balance, 0) ?? 0;
  const netWorth = totalAssets - totalLiabilities;

  // Plaid
  const plaidConfigured = usePlaidConfigured();
  type PlaidItem = { _id: string; institutionName: string; accounts: { plaidAccountId: string; name: string }[]; lastSyncedAt?: number };
  const plaidItems = usePlaidItemsData() as PlaidItem[];
  const syncPlaidItem = useAction(api.plaid.syncPlaidItem);
  const deletePlaidItem = useAction(api.plaid.deletePlaidItem);
  const [syncingItemId, setSyncingItemId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [managingItemId, setManagingItemId] = useState<Id<'plaidItems'> | null>(null);
  const [connectingInstitution, setConnectingInstitution] = useState(false);
  const institutionNameById = Object.fromEntries(plaidItems.map((item) => [item._id, item.institutionName]));

  const handleSyncPlaidItem = async (plaidItemId: Id<'plaidItems'>) => {
    setSyncingItemId(plaidItemId);
    try {
      await syncPlaidItem({ plaidItemId });
    } finally {
      setSyncingItemId(null);
    }
  };

  const handleDeletePlaidItem = async (plaidItemId: Id<'plaidItems'>) => {
    setDeletingItemId(plaidItemId);
    try {
      await deletePlaidItem({ plaidItemId });
    } finally {
      setDeletingItemId(null);
    }
  };

  return (
    <>
      <aside className="border-border/50 -mx-2 border-t sm:-mx-3 lg:fixed lg:top-[4.3125rem] lg:right-0 lg:bottom-0 lg:mx-0 lg:w-96 lg:overflow-y-auto lg:border-t-0 lg:border-l lg:bg-stone-50 dark:lg:bg-black/10">
        <header className="from-emphasized-background to-background border-border/50 flex flex-col gap-3 border-b bg-gradient-to-l px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex w-full items-center justify-between gap-3">
            <Tooltip>
              <TooltipTrigger>
                <Heading level={4} className="underline decoration-stone-300 underline-offset-4 dark:decoration-stone-600">
                  NW Tracker
                </Heading>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add assets and liabilities to track your net worth.</p>
                <p>Entries can be synced to Simulator plans.</p>
              </TooltipContent>
            </Tooltip>
            <span className="text-muted-foreground text-2xl/8 font-normal sm:text-xl/8">{formatCompactCurrency(netWorth, 2)}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button outline onClick={() => setAssetDialogOpen(true)}>
                  <MicroWalletIcon />
                  <span className="sr-only">Add asset</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add asset</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button outline onClick={() => setLiabilityDialogOpen(true)}>
                  <MicroCreditCardIcon />
                  <span className="sr-only">Add liability</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add liability</TooltipContent>
            </Tooltip>
            {plaidConfigured && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button outline onClick={() => setConnectingInstitution(true)}>
                    <BuildingLibraryIcon />
                    <span className="sr-only">Connect institution</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Connect institution</TooltipContent>
              </Tooltip>
            )}
          </div>
        </header>
        <div className="flex h-full flex-col gap-2 px-4 py-5 sm:py-6 lg:h-[calc(100%-5.3125rem)]">
          {!hasAssets ? (
            <DataListEmptyStateButton onClick={() => setAssetDialogOpen(true)} icon={WalletIcon} buttonText="Add asset" />
          ) : (
            <>
              <div className="flex w-full items-center justify-between">
                <Subheading level={5} className="font-medium underline decoration-stone-300 underline-offset-4 dark:decoration-stone-600">
                  Assets
                </Subheading>
                <span className="text-base/7 font-bold text-stone-950 sm:text-sm/6 dark:text-white">
                  {formatCompactCurrency(totalAssets, 2)}
                </span>
              </div>
              <ul role="list" className="grid grid-cols-1 gap-3">
                {assets!.map((asset, index) => {
                  const Icon = assetIconForDisplay(asset.type);
                  return (
                    <DataItem
                      key={asset.id}
                      id={asset.id}
                      index={index}
                      name={
                        asset.url ? (
                          <a href={asset.url} target="_blank" rel="noopener noreferrer">
                            {asset.name}
                          </a>
                        ) : (
                          asset.name
                        )
                      }
                      desc={getAssetDesc(asset, asset.plaidItemId ? institutionNameById[asset.plaidItemId] : undefined)}
                      leftAddOn={<HoverableIcon defaultIcon={Icon} hoverIcon={ExternalLinkIcon} className="size-8" href={asset.url} />}
                      onDropdownClickEdit={() => handleEditAsset(asset)}
                      onDropdownClickDelete={() => setAssetToDelete({ id: asset.id, name: asset.name })}
                      colorClassName="bg-[var(--chart-3)] dark:bg-[var(--chart-2)]"
                    />
                  );
                })}
              </ul>
            </>
          )}
          <Divider className="my-2" soft />
          {!hasLiabilities ? (
            <DataListEmptyStateButton onClick={() => setLiabilityDialogOpen(true)} icon={CreditCardIcon} buttonText="Add liability" />
          ) : (
            <>
              <div className="flex w-full items-center justify-between">
                <Subheading level={5} className="font-medium underline decoration-stone-300 underline-offset-4 dark:decoration-stone-600">
                  Liabilities
                </Subheading>
                <span className="text-base/7 font-bold text-stone-950 sm:text-sm/6 dark:text-white">
                  {formatCompactCurrency(totalLiabilities, 2)}
                </span>
              </div>
              <ul role="list" className="grid grid-cols-1 gap-3">
                {liabilities!.map((liability, index) => {
                  const Icon = liabilityIconForDisplay(liability.type);
                  return (
                    <DataItem
                      key={liability.id}
                      id={liability.id}
                      index={index}
                      name={
                        liability.url ? (
                          <a href={liability.url} target="_blank" rel="noopener noreferrer">
                            {liability.name}
                          </a>
                        ) : (
                          liability.name
                        )
                      }
                      desc={getLiabilityDesc(liability, liability.plaidItemId ? institutionNameById[liability.plaidItemId] : undefined)}
                      leftAddOn={<HoverableIcon defaultIcon={Icon} hoverIcon={ExternalLinkIcon} className="size-8" href={liability.url} />}
                      onDropdownClickEdit={() => handleEditLiability(liability)}
                      onDropdownClickDelete={() => setLiabilityToDelete({ id: liability.id, name: liability.name })}
                      colorClassName="bg-[var(--chart-4)] dark:bg-[var(--chart-1)]"
                    />
                  );
                })}
              </ul>
            </>
          )}
          {plaidConfigured && plaidItems.length > 0 && (
            <>
              <Divider className="my-2" soft />
              <div className="flex w-full items-center justify-between">
                <Subheading level={5} className="font-medium underline decoration-stone-300 underline-offset-4 dark:decoration-stone-600">
                  Connected Institutions
                </Subheading>
              </div>
              {plaidItems.length > 0 && (
                <ul role="list" className="grid grid-cols-1 gap-2">
                  {plaidItems.map((item) => {
                    const linkedCount = item.accounts.length;
                    return (
                      <li key={item._id} className="bg-background border-border/50 rounded-lg border px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{item.institutionName}</p>
                            <p className="text-muted-foreground text-xs">
                              {linkedCount} account{linkedCount !== 1 ? 's' : ''}
                              {item.lastSyncedAt ? ` · synced ${new Date(item.lastSyncedAt).toLocaleDateString()}` : ' · never synced'}
                            </p>
                          </div>
                          <div className="shrink-0">
                            <Dropdown>
                              <DropdownButton
                                plain
                                aria-label="Open options"
                                disabled={syncingItemId === item._id || deletingItemId === item._id}
                              >
                                <EllipsisVerticalIcon className="size-5" />
                              </DropdownButton>
                              <DropdownMenu portal={false}>
                                <DropdownItem onClick={() => setManagingItemId(item._id as Id<'plaidItems'>)}>Manage accounts</DropdownItem>
                                <DropdownItem onClick={() => handleSyncPlaidItem(item._id as Id<'plaidItems'>)}>
                                  {syncingItemId === item._id ? 'Refreshing…' : 'Refresh holdings'}
                                </DropdownItem>
                                <DropdownItem onClick={() => handleDeletePlaidItem(item._id as Id<'plaidItems'>)}>
                                  Disconnect institution
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
          <div className="h-4 shrink-0" aria-hidden="true" />
        </div>
      </aside>
      <Dialog size="xl" open={assetDialogOpen} onClose={handleAssetDialogClose}>
        <AssetDialog onClose={handleAssetDialogClose} selectedAsset={selectedAsset} numAssets={numAssets} />
      </Dialog>
      <Dialog size="xl" open={liabilityDialogOpen} onClose={handleLiabilityDialogClose}>
        <LiabilityDialog onClose={handleLiabilityDialogClose} selectedLiability={selectedLiability} numLiabilities={numLiabilities} />
      </Dialog>
      <DeleteDataItemAlert dataToDelete={assetToDelete} setDataToDelete={setAssetToDelete} deleteData={deleteAsset} />
      <DeleteDataItemAlert dataToDelete={liabilityToDelete} setDataToDelete={setLiabilityToDelete} deleteData={deleteLiability} />
      {connectingInstitution && (
        <div className="hidden">
          <PlaidLinkButton autoOpen onSuccess={() => setConnectingInstitution(false)} />
        </div>
      )}
      {managingItemId && (
        <div className="hidden">
          <PlaidLinkButton plaidItemId={managingItemId} onSuccess={() => setManagingItemId(null)} />
        </div>
      )}
    </>
  );
}
