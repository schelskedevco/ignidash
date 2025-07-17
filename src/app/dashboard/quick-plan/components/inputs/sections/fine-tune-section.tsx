'use client';

import { useState } from 'react';
import { DrawerTriggerButton } from '@/components/ui/drawer-trigger-button';
import Drawer from '@/components/ui/drawer';
import { MarketAssumptionsDrawer } from '../drawers/market-assumptions-drawer';
import { RetirementFundingDrawer } from '../drawers/retirement-funding-drawer';
import { ChartBarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { SectionHeader } from '@/components/section-header';

export function FineTuneSection() {
  const [marketAssumptionsOpen, setMarketAssumptionsOpen] = useState(false);
  const [retirementFundingOpen, setRetirementFundingOpen] = useState(false);

  return (
    <>
      <div className="border-foreground/10 mb-5 space-y-4 border-b pb-5">
        <SectionHeader title="Fine-Tuning" desc="Adjust advanced settings to refine your projections and assumptions." />

        <DrawerTriggerButton
          title="Market & Economic Assumptions"
          desc="Set inflation rate and how to project investment returns by asset class."
          leftIcon={ChartBarIcon}
          onClick={() => setMarketAssumptionsOpen(true)}
        />

        <DrawerTriggerButton
          title="Retirement Funding & Duration"
          desc="Configure withdrawal strategy, retirement income sources, and life expectancy."
          leftIcon={ClockIcon}
          onClick={() => setRetirementFundingOpen(true)}
        />
      </div>

      {/* Fine-Tune drawers */}
      <Drawer open={marketAssumptionsOpen} setOpen={setMarketAssumptionsOpen} title="Market & Economic Assumptions">
        <MarketAssumptionsDrawer />
      </Drawer>

      <Drawer open={retirementFundingOpen} setOpen={setRetirementFundingOpen} title="Retirement Funding & Duration">
        <RetirementFundingDrawer />
      </Drawer>
    </>
  );
}
