'use client';

import { useState } from 'react';
import { CalculatorIcon, AdjustmentsHorizontalIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

import IconButton from '@/components/ui/icon-button';
import Drawer from '@/components/ui/drawer';
import ColumnHeader from '@/components/ui/column-header';

import PreferencesDrawer from './drawers/preferences-drawer';
import MarketAssumptionsDrawer from './drawers/market-assumptions-drawer';
import SimulationPreferencesDrawer from './drawers/simulation-preferences-drawer';

export default function NumbersColumnHeader() {
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const [marketAssumptionsOpen, setMarketAssumptionsOpen] = useState(false);
  const [simulationPreferencesOpen, setSimulationPreferencesOpen] = useState(false);

  const titleComponent = (
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
          <div className="flex items-center">
            <IconButton
              icon={ArrowTrendingUpIcon}
              label="Market Assumptions"
              onClick={() => setMarketAssumptionsOpen(true)}
              surfaceColor="emphasized"
            />
            <IconButton
              icon={AdjustmentsHorizontalIcon}
              label="Preferences"
              onClick={() => setPreferencesOpen(true)}
              surfaceColor="emphasized"
            />
          </div>
        }
        className="left-76 w-96 border-r group-data-[state=collapsed]/sidebar:left-20"
      />

      <Drawer open={preferencesOpen} setOpen={setPreferencesOpen} title={titleComponent}>
        <PreferencesDrawer />
      </Drawer>

      <Drawer open={marketAssumptionsOpen} setOpen={setMarketAssumptionsOpen} title={titleComponent}>
        <MarketAssumptionsDrawer />
      </Drawer>

      <Drawer open={simulationPreferencesOpen} setOpen={setSimulationPreferencesOpen} title={titleComponent}>
        <SimulationPreferencesDrawer />
      </Drawer>
    </>
  );
}
