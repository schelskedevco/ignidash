'use client';

import { type LiabilityInputs /* liabilitySchema */ } from '@/lib/schemas/finances/liability-schema';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import Card from '@/components/ui/card';

interface LiabilityDrawerProps {
  setOpen: (open: boolean) => void;
  liabilities: LiabilityInputs[] | null;
}

export default function LiabilityDrawer({ setOpen, liabilities }: LiabilityDrawerProps) {
  return (
    <>
      <SectionContainer showBottomBorder={false} location="drawer">
        <SectionHeader title="Liabilities" desc="Add new or update existing liabilities to track them from Dashboard." />
        <Card>Liability Form</Card>
      </SectionContainer>
    </>
  );
}
