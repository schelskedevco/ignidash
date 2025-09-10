'use client';

import { useState } from 'react';
import { CalculatorIcon, SlidersHorizontalIcon } from 'lucide-react';

import IconButton from '@/components/ui/icon-button';
import Drawer from '@/components/ui/drawer';
import ColumnHeader from '@/components/ui/column-header';

import PreferencesDrawer from './drawers/preferences-drawer';

export default function NumbersColumnHeader() {
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const titleComponent = (
    <div className="flex items-center gap-2">
      <SlidersHorizontalIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Preferences</span>
    </div>
  );

  return (
    <>
      <ColumnHeader
        title="Numbers"
        icon={CalculatorIcon}
        iconButton={
          <IconButton icon={SlidersHorizontalIcon} label="Preferences" onClick={() => setPreferencesOpen(true)} surfaceColor="emphasized" />
        }
        className="left-76 w-96 border-r group-data-[state=collapsed]/sidebar:left-20"
      />

      <Drawer open={preferencesOpen} setOpen={setPreferencesOpen} title={titleComponent}>
        <PreferencesDrawer />
      </Drawer>
    </>
  );
}
