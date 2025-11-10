'use client';

import { useState } from 'react';
import { PresentationIcon, SlidersHorizontalIcon, SparklesIcon } from 'lucide-react';

import IconButton from '@/components/ui/icon-button';
import Drawer from '@/components/ui/drawer';
import ColumnHeader from '@/components/ui/column-header';
import { useRegenSimulation } from '@/hooks/use-regen-simulation';
import { useSimulationSeed, useSimulationMode } from '@/lib/stores/simulator-store';

import SimulationSettingsDrawer from './drawers/simulation-settings-drawer';
import DrillDownBreadcrumb from './drill-down-breadcrumb';

export default function ResultsColumnHeader() {
  const { icon, label, handleClick, isDisabled } = useRegenSimulation();
  const [simulationSettingsOpen, setSimulationSettingsOpen] = useState(false);

  const simulationSettingsTitleComponent = (
    <div className="flex items-center gap-2">
      <SlidersHorizontalIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Simulation Settings</span>
    </div>
  );

  const seed = useSimulationSeed();
  const simulationMode = useSimulationMode();

  let title: string | React.ReactNode;
  switch (simulationMode) {
    case 'fixedReturns':
      title = 'Results';
      break;
    case 'stochasticReturns':
    case 'historicalReturns':
      title = `Results | Seed #${seed}`;
      break;
    case 'monteCarloStochasticReturns':
    case 'monteCarloHistoricalReturns':
      title = <DrillDownBreadcrumb />;
      break;
  }

  return (
    <>
      <ColumnHeader
        title={title}
        icon={PresentationIcon}
        iconButton={
          <div className="flex items-center gap-x-1">
            <IconButton icon={SparklesIcon} label="Ask AI (Coming soon!)" onClick={() => {}} surfaceColor="emphasized" />
            <IconButton
              icon={SlidersHorizontalIcon}
              label="Simulation Settings"
              onClick={() => setSimulationSettingsOpen(true)}
              surfaceColor="emphasized"
            />
            <IconButton icon={icon} label={label} onClick={handleClick} surfaceColor="emphasized" isDisabled={isDisabled} />
          </div>
        }
        className="w-[calc(100%-42rem)] group-data-[state=collapsed]/sidebar:w-[calc(100%-28rem)]"
      />

      <Drawer open={simulationSettingsOpen} setOpen={setSimulationSettingsOpen} title={simulationSettingsTitleComponent}>
        <SimulationSettingsDrawer setOpen={setSimulationSettingsOpen} />
      </Drawer>
    </>
  );
}
