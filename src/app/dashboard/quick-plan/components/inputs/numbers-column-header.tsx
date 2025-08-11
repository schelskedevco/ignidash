'use client';

import { useState } from 'react';
import { CalculatorIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

import IconButton from '@/components/ui/icon-button';
import Drawer from '@/components/ui/drawer';
import ColumnHeader from '@/components/ui/column-header';
import { useDrawerHistory } from '@/hooks/use-drawer-history';

import PreferencesDrawer from './drawers/preferences-drawer';

export default function NumbersColumnHeader() {
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  useDrawerHistory({
    isOpen: preferencesOpen,
    onClose: () => setPreferencesOpen(false),
    drawerName: 'preferences',
  });

  return (
    <>
      <ColumnHeader
        title="Numbers"
        icon={CalculatorIcon}
        iconButton={<IconButton icon={Cog6ToothIcon} label="Preferences" onClick={() => setPreferencesOpen(true)} />}
      />

      <Drawer open={preferencesOpen} setOpen={setPreferencesOpen} title="Preferences">
        <PreferencesDrawer />
      </Drawer>
    </>
  );
}
