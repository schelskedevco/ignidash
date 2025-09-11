'use client';

import { useState } from 'react';
import { CalculatorIcon, SlidersHorizontalIcon, TrendingUpIcon } from 'lucide-react';

import IconButton from '@/components/ui/icon-button';
import Drawer from '@/components/ui/drawer';
import ColumnHeader from '@/components/ui/column-header';

import SimulationSettingsDrawer from './drawers/simulation-settings-drawer';
import ExpectedReturnsDrawer from './drawers/expected-returns-drawer';

export default function NumbersColumnHeader() {
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [expectedReturnsOpen, setExpectedReturnsOpen] = useState(false);

  const titleComponent = (
    <div className="flex items-center gap-2">
      <SlidersHorizontalIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Preferences</span>
    </div>
  );
  const expectedReturnsTitleComponent = (
    <div className="flex items-center gap-2">
      <TrendingUpIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Expected Returns</span>
    </div>
  );

  return (
    <>
      <ColumnHeader
        title="Numbers"
        icon={CalculatorIcon}
        iconButton={
          <div className="flex items-center gap-2">
            <IconButton
              icon={SlidersHorizontalIcon}
              label="Preferences"
              onClick={() => setPreferencesOpen(true)}
              surfaceColor="emphasized"
            />
            <IconButton
              icon={TrendingUpIcon}
              label="Expected Returns"
              onClick={() => setExpectedReturnsOpen(true)}
              surfaceColor="emphasized"
            />
          </div>
        }
        className="left-76 w-96 border-r group-data-[state=collapsed]/sidebar:left-20"
      />

      <Drawer open={preferencesOpen} setOpen={setPreferencesOpen} title={titleComponent}>
        <SimulationSettingsDrawer />
      </Drawer>

      <Drawer open={expectedReturnsOpen} setOpen={setExpectedReturnsOpen} title={expectedReturnsTitleComponent}>
        <ExpectedReturnsDrawer />
      </Drawer>
    </>
  );
}
