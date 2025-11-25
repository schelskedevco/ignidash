'use client';

import { type AssetInputs /* assetSchema */ } from '@/lib/schemas/finances/asset-schema';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';

interface AssetDrawerProps {
  setOpen: (open: boolean) => void;
  assets: AssetInputs[] | null;
}

export default function AssetDrawer({ setOpen, assets }: AssetDrawerProps) {
  return (
    <>
      <SectionContainer showBottomBorder={false} location="drawer">
        <SectionHeader title="Assets" desc="Add new or update existing assets to track them from Dashboard." />
        <Card>Asset Form</Card>
      </SectionContainer>
    </>
  );
}
