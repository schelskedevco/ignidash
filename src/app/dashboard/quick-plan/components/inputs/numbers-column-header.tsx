'use client';

import { useState } from 'react';
import { CalculatorIcon, AdjustmentsHorizontalIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

import IconButton from '@/components/ui/icon-button';
import Drawer from '@/components/ui/drawer';
import ColumnHeader from '@/components/ui/column-header';

import MarketAssumptionsDrawer from './drawers/market-assumptions-drawer';
import SimulationPreferencesDrawer from './drawers/simulation-preferences-drawer';

export default function NumbersColumnHeader() {
  const [marketAssumptionsOpen, setMarketAssumptionsOpen] = useState(false);
  const [simulationPreferencesOpen, setSimulationPreferencesOpen] = useState(false);

  const marketAssumptionsTitleComponent = (
    <div className="flex items-center gap-2">
      <ArrowTrendingUpIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Market Assumptions</span>
    </div>
  );

  const simulationPreferencesTitleComponent = (
    <div className="flex items-center gap-2">
      <AdjustmentsHorizontalIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Preferences</span>
    </div>
  );

  return (
    <>
      <ColumnHeader
        title="Numbers"
        icon={CalculatorIcon}
        iconButton={
          <div className="flex items-center gap-1">
            <IconButton
              icon={ArrowTrendingUpIcon}
              label="Market Assumptions"
              onClick={() => setMarketAssumptionsOpen(true)}
              surfaceColor="emphasized"
            />
            <IconButton
              icon={AdjustmentsHorizontalIcon}
              label="Simulation Preferences"
              onClick={() => setSimulationPreferencesOpen(true)}
              surfaceColor="emphasized"
            />
          </div>
        }
        className="left-76 w-96 border-r group-data-[state=collapsed]/sidebar:left-20"
      />

      <Drawer open={marketAssumptionsOpen} setOpen={setMarketAssumptionsOpen} title={marketAssumptionsTitleComponent}>
        <MarketAssumptionsDrawer />
      </Drawer>

      <Drawer open={simulationPreferencesOpen} setOpen={setSimulationPreferencesOpen} title={simulationPreferencesTitleComponent}>
        <SimulationPreferencesDrawer />
      </Drawer>
    </>
  );
}
