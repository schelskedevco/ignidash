'use client';

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useState } from 'react';
import { WalletIcon as MicroWalletIcon, CreditCardIcon as MicroCreditCardIcon } from '@heroicons/react/16/solid';
import { WalletIcon, CreditCardIcon } from '@heroicons/react/24/outline';

import type { AssetInputs } from '@/lib/schemas/finances/asset-schema';
import type { LiabilityInputs } from '@/lib/schemas/finances/liability-schema';
import { Dialog } from '@/components/catalyst/dialog';
import { Button } from '@/components/catalyst/button';
import { Heading } from '@/components/catalyst/heading';
import { useAssetData, useLiabilityData } from '@/hooks/use-convex-data';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Divider } from '@/components/catalyst/divider';
import DataItem from '@/components/ui/data-item';

import AssetDialog from './dialogs/asset-dialog';
import LiabilityDialog from './dialogs/liability-dialog';

export default function Finances() {
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<AssetInputs | null>(null);

  const assets = useAssetData();
  const numAssets = assets?.length ?? 0;

  const handleAssetDialogClose = () => {
    setAssetDialogOpen(false);
    setSelectedAsset(null);
  };

  const [liabilityDialogOpen, setLiabilityDialogOpen] = useState(false);
  const [selectedLiability, setSelectedLiability] = useState<LiabilityInputs | null>(null);

  const liabilities = useLiabilityData();
  const numLiabilities = liabilities?.length ?? 0;

  const handleLiabilityDialogClose = () => {
    setLiabilityDialogOpen(false);
    setSelectedLiability(null);
  };

  const hasAssets = numAssets > 0;
  const hasLiabilities = numLiabilities > 0;

  const deleteAssetMutation = useMutation(api.finances.deleteAsset);
  const deleteAsset = async (assetId: string) => {
    await deleteAssetMutation({ assetId });
  };

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

  return (
    <>
      <aside className="border-border/50 -mx-2 border-t sm:-mx-3 lg:fixed lg:top-[4.3125rem] lg:right-0 lg:bottom-0 lg:mx-0 lg:w-96 lg:overflow-y-auto lg:border-t-0 lg:border-l lg:bg-zinc-50 dark:lg:bg-black/10">
        <header className="from-emphasized-background to-background border-border/50 flex items-center justify-between border-b bg-gradient-to-l px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <Heading level={4}>Finances</Heading>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button outline onClick={() => setAssetDialogOpen(true)}>
                  <MicroWalletIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add asset</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button outline onClick={() => setLiabilityDialogOpen(true)}>
                  <MicroCreditCardIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Add liability</TooltipContent>
            </Tooltip>
          </div>
        </header>
        <div className="flex h-full gap-2 px-4 py-5 sm:flex-col sm:py-6 lg:h-[calc(100%-5.3125rem)]">
          {!hasAssets ? (
            <button
              type="button"
              className="focus-outline relative block w-full grow rounded-lg border-2 border-dashed border-zinc-300 p-4 text-center hover:border-zinc-400 dark:border-white/15 dark:hover:border-white/25"
              onClick={() => setAssetDialogOpen(true)}
            >
              <WalletIcon aria-hidden="true" className="text-primary mx-auto size-12" />
              <span className="mt-2 block text-sm font-semibold text-zinc-900 dark:text-white">Add asset</span>
            </button>
          ) : (
            <ul role="list" className="grid grid-cols-1 gap-3">
              {assets!.map((asset, index) => (
                <DataItem
                  key={asset.id}
                  id={asset.id}
                  index={index}
                  name={asset.name}
                  desc={'Placeholder description'}
                  leftAddOn={<WalletIcon className="size-8" />}
                  onDropdownClickEdit={() => handleEditAsset(asset)}
                  onDropdownClickDelete={() => deleteAsset(asset.id)}
                  colorClassName="bg-[var(--chart-3)]"
                />
              ))}
            </ul>
          )}
          <Divider className="my-4 hidden sm:block" />
          {!hasLiabilities ? (
            <button
              type="button"
              className="focus-outline relative block w-full grow rounded-lg border-2 border-dashed border-zinc-300 p-4 text-center hover:border-zinc-400 dark:border-white/15 dark:hover:border-white/25"
              onClick={() => setLiabilityDialogOpen(true)}
            >
              <CreditCardIcon aria-hidden="true" className="text-primary mx-auto size-12" />
              <span className="mt-2 block text-sm font-semibold text-zinc-900 dark:text-white">Add liability</span>
            </button>
          ) : (
            <ul role="list" className="grid grid-cols-1 gap-3">
              {liabilities!.map((liability, index) => (
                <DataItem
                  key={liability.id}
                  id={liability.id}
                  index={index}
                  name={liability.name}
                  desc={'Placeholder description'}
                  leftAddOn={<CreditCardIcon className="size-8" />}
                  onDropdownClickEdit={() => handleEditLiability(liability)}
                  onDropdownClickDelete={() => deleteLiability(liability.id)}
                  colorClassName="bg-[var(--chart-4)]"
                />
              ))}
            </ul>
          )}
        </div>
      </aside>
      <Dialog size="xl" open={assetDialogOpen} onClose={handleAssetDialogClose}>
        <AssetDialog onClose={handleAssetDialogClose} selectedAsset={selectedAsset} numAssets={numAssets} />
      </Dialog>
      <Dialog size="xl" open={liabilityDialogOpen} onClose={handleLiabilityDialogClose}>
        <LiabilityDialog onClose={handleLiabilityDialogClose} selectedLiability={selectedLiability} numLiabilities={numLiabilities} />
      </Dialog>
    </>
  );
}
