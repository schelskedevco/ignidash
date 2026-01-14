'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Preloaded } from 'convex/react';
import { usePreloadedAuthQuery } from '@convex-dev/better-auth/nextjs/client';
import { useState } from 'react';
import { WalletIcon as MicroWalletIcon, CreditCardIcon as MicroCreditCardIcon } from '@heroicons/react/16/solid';
import { WalletIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { ExternalLinkIcon } from 'lucide-react';

import { type AssetInputs, assetTypeForDisplay, assetIconForDisplay } from '@/lib/schemas/finances/asset-schema';
import { type LiabilityInputs, liabilityTypeForDisplay, liabilityIconForDisplay } from '@/lib/schemas/finances/liability-schema';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { formatNumber } from '@/lib/utils';
import { Heading, Subheading } from '@/components/catalyst/heading';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Divider } from '@/components/catalyst/divider';
import DataItem from '@/components/ui/data-item';
import DataListEmptyStateButton from '@/components/ui/data-list-empty-state-button';
import DeleteDataItemAlert from '@/components/ui/delete-data-item-alert';

import AssetDialog from './dialogs/asset-dialog';
import LiabilityDialog from './dialogs/liability-dialog';

function getAssetDesc(asset: AssetInputs) {
  return (
    <>
      <p>
        {formatNumber(asset.value, 1, '$')} | {assetTypeForDisplay(asset.type)}
      </p>
      <p>
        Updated <time dateTime={new Date(asset.updatedAt).toISOString()}>{new Date(asset.updatedAt).toLocaleDateString()}</time>
      </p>
    </>
  );
}

function getLiabilityDesc(liability: LiabilityInputs) {
  return (
    <>
      <p>
        {formatNumber(liability.balance, 1, '$')} | {liabilityTypeForDisplay(liability.type)}
      </p>
      <p>
        Updated <time dateTime={new Date(liability.updatedAt).toISOString()}>{new Date(liability.updatedAt).toLocaleDateString()}</time>
      </p>
    </>
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

  return (
    <>
      <aside className="border-border/50 -mx-2 border-t sm:-mx-3 lg:fixed lg:top-[4.3125rem] lg:right-0 lg:bottom-0 lg:mx-0 lg:w-96 lg:overflow-y-auto lg:border-t-0 lg:border-l lg:bg-stone-50 dark:lg:bg-black/10">
        <header className="from-emphasized-background to-background border-border/50 flex items-center justify-between border-b bg-gradient-to-l px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex w-full items-center gap-3">
            <Tooltip>
              <TooltipTrigger>
                <Heading level={4} className="underline decoration-stone-300 underline-offset-4 dark:decoration-stone-600">
                  NW Tracker
                </Heading>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add assets and liabilities to track your net worth.</p>
                <p>Note: entries are not connected to Simulator plans.</p>
              </TooltipContent>
            </Tooltip>
            <span className="text-muted-foreground text-2xl/8 font-normal sm:text-xl/8">{formatNumber(netWorth, 2, '$')}</span>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </header>
        <div className="flex h-full flex-col gap-2 px-4 py-5 sm:py-6 lg:h-[calc(100%-5.3125rem)]">
          {!hasAssets ? (
            <DataListEmptyStateButton onClick={() => setAssetDialogOpen(true)} icon={WalletIcon} buttonText="Add asset" />
          ) : (
            <>
              <div className="flex w-full items-center justify-between">
                <Subheading level={5} className="font-medium">
                  Assets
                </Subheading>
                <span className="text-base/7 font-bold text-stone-950 sm:text-sm/6 dark:text-white">
                  {formatNumber(totalAssets, 2, '$')}
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
                          <a href={asset.url} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-2">
                            <span>{asset.name}</span>
                            <ExternalLinkIcon className="text-muted-foreground size-4 shrink-0" />
                          </a>
                        ) : (
                          asset.name
                        )
                      }
                      desc={getAssetDesc(asset)}
                      leftAddOn={<Icon className="size-8" />}
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
                <Subheading level={5} className="font-medium">
                  Liabilities
                </Subheading>
                <span className="text-base/7 font-bold text-stone-950 sm:text-sm/6 dark:text-white">
                  {formatNumber(totalLiabilities, 2, '$')}
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
                          <a
                            href={liability.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center gap-2"
                          >
                            <span>{liability.name}</span>
                            <ExternalLinkIcon className="text-muted-foreground size-4 shrink-0" />
                          </a>
                        ) : (
                          liability.name
                        )
                      }
                      desc={getLiabilityDesc(liability)}
                      leftAddOn={<Icon className="size-8" />}
                      onDropdownClickEdit={() => handleEditLiability(liability)}
                      onDropdownClickDelete={() => setLiabilityToDelete({ id: liability.id, name: liability.name })}
                      colorClassName="bg-[var(--chart-4)] dark:bg-[var(--chart-1)]"
                    />
                  );
                })}
              </ul>
            </>
          )}
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
    </>
  );
}
