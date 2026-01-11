'use client';

import { CalendarRangeIcon, CheckIcon } from 'lucide-react';

import { Dropdown, DropdownButton, DropdownItem, DropdownMenu, DropdownLabel } from '@/components/catalyst/dropdown';
import { cn, formatChartString } from '@/lib/utils';
import {
  useChartTimeFrameToShow,
  useMonteCarloTimeFrameToShow,
  useUpdateChartTimeFrameToShow,
  useUpdateMonteCarloTimeFrameToShow,
} from '@/lib/stores/simulator-store';

interface ChartTimeFrameDropdownProps {
  timeFrameType: 'single' | 'monteCarlo';
}

export default function ChartTimeFrameDropdown({ timeFrameType }: ChartTimeFrameDropdownProps) {
  const chartTimeFrameToShow = useChartTimeFrameToShow();
  const updateChartTimeFrameToShow = useUpdateChartTimeFrameToShow();

  const monteCarloTimeFrameToShow = useMonteCarloTimeFrameToShow();
  const updateMonteCarloTimeFrameToShow = useUpdateMonteCarloTimeFrameToShow();

  const chartTimeFrameOptions = ['tenYears', 'twentyYears', 'thirtyYears', 'fullPlan'] as const;

  const timeFrameToShow = timeFrameType === 'single' ? chartTimeFrameToShow : monteCarloTimeFrameToShow;
  const updateTimeFrameToShow = timeFrameType === 'single' ? updateChartTimeFrameToShow : updateMonteCarloTimeFrameToShow;

  return (
    <Dropdown>
      <DropdownButton plain aria-label="Open chart view options">
        <CalendarRangeIcon data-slot="icon" />
      </DropdownButton>
      <DropdownMenu>
        {chartTimeFrameOptions.map((chartTimeFrameOption) => (
          <DropdownItem key={chartTimeFrameOption} onClick={() => updateTimeFrameToShow(chartTimeFrameOption)}>
            <CheckIcon data-slot="icon" className={cn({ invisible: timeFrameToShow !== chartTimeFrameOption })} />
            <DropdownLabel>{formatChartString(chartTimeFrameOption)}</DropdownLabel>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
