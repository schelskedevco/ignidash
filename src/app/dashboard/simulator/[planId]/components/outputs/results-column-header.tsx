'use client';

import { useState, lazy, Suspense } from 'react';
import { PresentationIcon, SlidersHorizontalIcon, WandSparklesIcon } from 'lucide-react';

import IconButton from '@/components/ui/icon-button';
import PageLoading from '@/components/ui/page-loading';
import Drawer from '@/components/ui/drawer';
import ColumnHeader from '@/components/ui/column-header';
import { useRegenSimulation } from '@/hooks/use-regen-simulation';
import { useSimulationSettingsData } from '@/hooks/use-convex-data';

import DrillDownBreadcrumb from './drill-down-breadcrumb';

const SimulationSettingsDrawer = lazy(() => import('./drawers/simulation-settings-drawer'));
const AIChatDrawer = lazy(() => import('./drawers/ai-chat-drawer'));

export default function ResultsColumnHeader() {
  const { icon, label, handleClick, isDisabled } = useRegenSimulation();
  const [simulationSettingsOpen, setSimulationSettingsOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  const simulationSettingsTitleComponent = (
    <div className="flex items-center gap-2">
      <SlidersHorizontalIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Simulation Settings</span>
    </div>
  );
  const aiChatTitleComponent = (
    <div className="flex items-center gap-2">
      <WandSparklesIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Ask AI Anything</span>
    </div>
  );

  const simulationSettings = useSimulationSettingsData();

  let title: string | React.ReactNode = 'Results';
  if (simulationSettings) {
    const { simulationSeed: seed, simulationMode } = simulationSettings;

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
  }

  return (
    <>
      <ColumnHeader
        title={title}
        icon={PresentationIcon}
        iconButton={
          <div className="flex items-center gap-x-1">
            <IconButton icon={WandSparklesIcon} label="Ask AI" onClick={() => setAiChatOpen(true)} surfaceColor="emphasized" />
            <IconButton
              icon={SlidersHorizontalIcon}
              label="Simulation Settings"
              onClick={() => setSimulationSettingsOpen(true)}
              surfaceColor="emphasized"
            />
            {!isDisabled && (
              <IconButton icon={icon} label={label} onClick={handleClick} surfaceColor="emphasized" isDisabled={isDisabled} />
            )}
          </div>
        }
        className="w-[calc(100%-42rem)] group-data-[state=collapsed]/sidebar:w-[calc(100%-28rem)]"
      />

      <Drawer open={simulationSettingsOpen} setOpen={setSimulationSettingsOpen} title={simulationSettingsTitleComponent}>
        <Suspense fallback={<PageLoading message="Loading Simulation Settings" />}>
          <SimulationSettingsDrawer setOpen={setSimulationSettingsOpen} simulationSettings={simulationSettings} />
        </Suspense>
      </Drawer>
      <Drawer open={aiChatOpen} setOpen={setAiChatOpen} title={aiChatTitleComponent} size="large">
        <Suspense fallback={<PageLoading message="Loading AI Chat" />}>
          <AIChatDrawer setOpen={setAiChatOpen} />
        </Suspense>
      </Drawer>
    </>
  );
}
