'use client';

import { useState } from 'react';
import { PresentationIcon, SlidersHorizontalIcon } from 'lucide-react';

import IconButton from '@/components/ui/icon-button';
import Drawer from '@/components/ui/drawer';
import ColumnHeader from '@/components/ui/column-header';
import { useRegenSimulation } from '@/hooks/use-regen-simulation';

import SimulationSettingsDrawer from './drawers/simulation-settings-drawer';

export default function ResultsColumnHeader() {
  const { icon, label, handleClick, className } = useRegenSimulation();
  const [simulationSettingsOpen, setSimulationSettingsOpen] = useState(false);

  const simulationSettingsTitleComponent = (
    <div className="flex items-center gap-2">
      <SlidersHorizontalIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Simulation Settings</span>
    </div>
  );

  return (
    <>
      <ColumnHeader
        title="Results"
        icon={PresentationIcon}
        iconButton={
          <div className="flex items-center gap-2">
            <IconButton
              icon={SlidersHorizontalIcon}
              label="Simulation Settings"
              onClick={() => setSimulationSettingsOpen(true)}
              surfaceColor="emphasized"
            />
            <IconButton icon={icon} label={label} onClick={handleClick} className={className} surfaceColor="emphasized" />
          </div>
        }
        className="w-[calc(100%-42rem)] group-data-[state=collapsed]/sidebar:w-[calc(100%-28rem)]"
      />

      <Drawer open={simulationSettingsOpen} setOpen={setSimulationSettingsOpen} title={simulationSettingsTitleComponent}>
        <SimulationSettingsDrawer />
      </Drawer>
    </>
  );
}
