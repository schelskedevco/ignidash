'use client';

import { useState } from 'react';
import { CalculatorIcon, TrendingUpIcon, ReceiptIcon } from 'lucide-react';

import IconButton from '@/components/ui/icon-button';
import Drawer from '@/components/ui/drawer';
import ColumnHeader from '@/components/ui/column-header';

import ExpectedReturnsDrawer from './drawers/expected-returns-drawer';
import TaxSettingsDrawer from './drawers/tax-settings-drawer';

export default function NumbersColumnHeader() {
  const [expectedReturnsOpen, setExpectedReturnsOpen] = useState(false);
  const [taxSettingsOpen, setTaxSettingsOpen] = useState(false);

  const expectedReturnsTitleComponent = (
    <div className="flex items-center gap-2">
      <TrendingUpIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Expected Returns</span>
    </div>
  );
  const taxSettingsTitleComponent = (
    <div className="flex items-center gap-2">
      <ReceiptIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Tax Settings</span>
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
              icon={TrendingUpIcon}
              label="Expected Returns"
              onClick={() => setExpectedReturnsOpen(true)}
              surfaceColor="emphasized"
            />
            <IconButton icon={ReceiptIcon} label="Tax Settings" onClick={() => setTaxSettingsOpen(true)} surfaceColor="emphasized" />
          </div>
        }
        className="left-76 w-96 border-r group-data-[state=collapsed]/sidebar:left-20"
      />

      <Drawer open={expectedReturnsOpen} setOpen={setExpectedReturnsOpen} title={expectedReturnsTitleComponent}>
        <ExpectedReturnsDrawer />
      </Drawer>
      <Drawer open={taxSettingsOpen} setOpen={setTaxSettingsOpen} title={taxSettingsTitleComponent}>
        <TaxSettingsDrawer />
      </Drawer>
    </>
  );
}
