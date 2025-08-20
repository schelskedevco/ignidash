'use client';

import { useState } from 'react';
import { CalculatorIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

import IconButton from '@/components/ui/icon-button';
import { Dialog } from '@/components/catalyst/dialog';
import ColumnHeader from '@/components/ui/column-header';

import PreferencesDialog from './dialogs/preferences-dialog';

export default function NumbersColumnHeader() {
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  return (
    <>
      <ColumnHeader
        title="Numbers"
        icon={CalculatorIcon}
        iconButton={
          <IconButton
            icon={AdjustmentsHorizontalIcon}
            label="Preferences"
            onClick={() => setPreferencesOpen(true)}
            surfaceColor="emphasized"
          />
        }
      />

      <Dialog open={preferencesOpen} onClose={setPreferencesOpen}>
        <PreferencesDialog />
      </Dialog>
    </>
  );
}
