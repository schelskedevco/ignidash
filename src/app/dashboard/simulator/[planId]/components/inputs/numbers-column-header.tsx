'use client';

import { useState, lazy, Suspense } from 'react';
import { CalculatorIcon, TrendingUpIcon, BanknoteXIcon, HourglassIcon } from 'lucide-react';

import IconButton from '@/components/ui/icon-button';
import PageLoading from '@/components/ui/page-loading';
import Drawer from '@/components/ui/drawer';
import ColumnHeader from '@/components/ui/column-header';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlanName, useMarketAssumptionsData, useTaxSettingsData, useTimelineData } from '@/hooks/use-convex-data';
import { useSelectedPlanId } from '@/hooks/use-selected-plan-id';
import { useHasOpenedTaxSettings, useUpdateHasOpenedTaxSettings } from '@/lib/stores/simulator-store';

const ExpectedReturnsDrawer = lazy(() => import('./drawers/expected-returns-drawer'));
const TaxSettingsDrawer = lazy(() => import('./drawers/tax-settings-drawer'));
const TimelineDrawer = lazy(() => import('./drawers/timeline-drawer'));

export default function NumbersColumnHeader() {
  const planId = useSelectedPlanId();
  const { name: planName, isLoading: isPlanNameLoading } = usePlanName();

  const [expectedReturnsOpen, setExpectedReturnsOpen] = useState(false);
  const [taxSettingsOpen, setTaxSettingsOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const marketAssumptions = useMarketAssumptionsData();
  const taxSettings = useTaxSettingsData();
  const timeline = useTimelineData();

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

  const hasOpenedTaxSettings = useHasOpenedTaxSettings(planId);
  const updateHasOpenedTaxSettings = useUpdateHasOpenedTaxSettings();

  return (
    <>
      <ColumnHeader
        title={isPlanNameLoading ? <Skeleton className="bg-background h-8 w-32" /> : (planName ?? 'Numbers')}
        icon={CalculatorIcon}
        iconButton={
          <div className="flex items-center gap-x-1">
            <IconButton
              icon={TrendingUpIcon}
              label="Expected Returns"
              onClick={() => setExpectedReturnsOpen(true)}
              surfaceColor="emphasized"
            />
            <IconButton
              icon={BanknoteXIcon}
              label="Tax Settings"
              onClick={() => {
                if (!hasOpenedTaxSettings) updateHasOpenedTaxSettings(planId, true);
                setTaxSettingsOpen(true);
              }}
              surfaceColor="emphasized"
            />
            <IconButton icon={HourglassIcon} label="Timeline" onClick={() => setTimelineOpen(true)} surfaceColor="emphasized" />
          </div>
        }
        className="left-76 w-96 border-r group-data-[state=collapsed]/sidebar:left-20"
      />

      <Drawer open={expectedReturnsOpen} setOpen={setExpectedReturnsOpen} title={expectedReturnsTitleComponent}>
        <Suspense fallback={<PageLoading message="Loading Expected Returns" />}>
          <ExpectedReturnsDrawer setOpen={setExpectedReturnsOpen} marketAssumptions={marketAssumptions} />
        </Suspense>
      </Drawer>
      <Drawer open={taxSettingsOpen} setOpen={setTaxSettingsOpen} title={taxSettingsTitleComponent}>
        <Suspense fallback={<PageLoading message="Loading Tax Settings" />}>
          <TaxSettingsDrawer setOpen={setTaxSettingsOpen} taxSettings={taxSettings} />
        </Suspense>
      </Drawer>
      <Drawer open={timelineOpen} setOpen={setTimelineOpen} title={timelineTitleComponent}>
        <Suspense fallback={<PageLoading message="Loading Timeline" />}>
          <TimelineDrawer setOpen={setTimelineOpen} timeline={timeline} />
        </Suspense>
      </Drawer>
    </>
  );
}
