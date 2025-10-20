'use client';

import { useState, useEffect } from 'react';
import { CalculatorIcon, TrendingUpIcon, BanknoteXIcon, HourglassIcon } from 'lucide-react';

import IconButton from '@/components/ui/icon-button';
import Drawer from '@/components/ui/drawer';
import ColumnHeader from '@/components/ui/column-header';
import { demoInputs3 } from '@/lib/stores/demo-inputs-data';
import { useUpdateInputs } from '@/lib/stores/quick-plan-store';

import ExpectedReturnsDrawer from './drawers/expected-returns-drawer';
import TaxSettingsDrawer from './drawers/tax-settings-drawer';
import TimelineDrawer from './drawers/timeline-drawer';

export default function NumbersColumnHeader() {
  const [expectedReturnsOpen, setExpectedReturnsOpen] = useState(false);
  const [taxSettingsOpen, setTaxSettingsOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const expectedReturnsTitleComponent = (
    <div className="flex items-center gap-2">
      <TrendingUpIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Expected Returns</span>
    </div>
  );
  const taxSettingsTitleComponent = (
    <div className="flex items-center gap-2">
      <BanknoteXIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Tax Settings</span>
    </div>
  );
  const timelineTitleComponent = (
    <div className="flex items-center gap-2">
      <HourglassIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Timeline</span>
    </div>
  );

  const updateInputs = useUpdateInputs();
  useEffect(() => {
    updateInputs(demoInputs3);
  }, [updateInputs]);

  return (
    <>
      <ColumnHeader
        title="Numbers"
        icon={CalculatorIcon}
        iconButton={
          <div className="flex items-center gap-x-1">
            <IconButton
              icon={TrendingUpIcon}
              label="Expected Returns"
              onClick={() => setExpectedReturnsOpen(true)}
              surfaceColor="emphasized"
            />
            <IconButton icon={BanknoteXIcon} label="Tax Settings" onClick={() => setTaxSettingsOpen(true)} surfaceColor="emphasized" />
            <IconButton icon={HourglassIcon} label="Timeline" onClick={() => setTimelineOpen(true)} surfaceColor="emphasized" />
          </div>
        }
        className="left-76 w-96 border-r group-data-[state=collapsed]/sidebar:left-20"
      />

      <Drawer open={expectedReturnsOpen} setOpen={setExpectedReturnsOpen} title={expectedReturnsTitleComponent}>
        <ExpectedReturnsDrawer setOpen={setExpectedReturnsOpen} />
      </Drawer>
      <Drawer open={taxSettingsOpen} setOpen={setTaxSettingsOpen} title={taxSettingsTitleComponent}>
        <TaxSettingsDrawer />
      </Drawer>
      <Drawer open={timelineOpen} setOpen={setTimelineOpen} title={timelineTitleComponent}>
        <TimelineDrawer setOpen={setTimelineOpen} />
      </Drawer>
    </>
  );
}
