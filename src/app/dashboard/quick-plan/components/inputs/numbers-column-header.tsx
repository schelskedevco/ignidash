'use client';

import { useState } from 'react';
import { CalculatorIcon, TrendingUpIcon } from 'lucide-react';

import IconButton from '@/components/ui/icon-button';
import Drawer from '@/components/ui/drawer';
import ColumnHeader from '@/components/ui/column-header';

import ExpectedReturnsDrawer from './drawers/expected-returns-drawer';

export default function NumbersColumnHeader() {
  const [expectedReturnsOpen, setExpectedReturnsOpen] = useState(false);

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
          <IconButton
            icon={TrendingUpIcon}
            label="Expected Returns"
            onClick={() => setExpectedReturnsOpen(true)}
            surfaceColor="emphasized"
          />
        }
        className="left-76 w-96 border-r group-data-[state=collapsed]/sidebar:left-20"
      />

      <Drawer open={expectedReturnsOpen} setOpen={setExpectedReturnsOpen} title={expectedReturnsTitleComponent}>
        <ExpectedReturnsDrawer />
      </Drawer>
    </>
  );
}
