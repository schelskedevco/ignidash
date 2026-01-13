'use client';

import { useState, lazy, Suspense } from 'react';
import { MessageCircleMoreIcon, PresentationIcon, SettingsIcon, WandSparklesIcon } from 'lucide-react';
import posthog from 'posthog-js';

import { cn } from '@/lib/utils';
import IconButton from '@/components/ui/icon-button';
import PageLoading from '@/components/ui/page-loading';
import Drawer from '@/components/ui/drawer';
import ColumnHeader from '@/components/ui/column-header';
import { useRegenSimulation } from '@/hooks/use-regen-simulation';
import { useSimulationSettingsData } from '@/hooks/use-convex-data';
import { useShowAIChatPulse, useUpdateShowAIChatPulse } from '@/lib/stores/simulator-store';

import DrillDownBreadcrumb from './drill-down-breadcrumb';

const UserFeedbackDrawer = lazy(() => import('@/components/layout/user-feedback-drawer'));
const AIChatDrawer = lazy(() => import('./drawers/ai-chat-drawer'));
const SimulationSettingsDrawer = lazy(() => import('./drawers/simulation-settings-drawer'));

export default function ResultsColumnHeader() {
  const { icon, label, handleClick, isDisabled } = useRegenSimulation();

  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [simulationSettingsOpen, setSimulationSettingsOpen] = useState(false);
  const [userFeedbackOpen, setUserFeedbackOpen] = useState(false);

  const aiChatTitleComponent = (
    <div className="flex items-center gap-2">
      <WandSparklesIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Ask AI Anything</span>
    </div>
  );
  const simulationSettingsTitleComponent = (
    <div className="flex items-center gap-2">
      <SettingsIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Simulation Settings</span>
    </div>
  );
  const userFeedbackTitleComponent = (
    <div className="flex items-center gap-2">
      <MessageCircleMoreIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Share Feedback</span>
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

  const showAIChatPulse = useShowAIChatPulse();
  const updateShowAIChatPulse = useUpdateShowAIChatPulse();

  return (
    <>
      <ColumnHeader
        title={title}
        icon={PresentationIcon}
        iconButton={
          <div className="flex items-center gap-x-1">
            <IconButton
              icon={WandSparklesIcon}
              iconClassName={cn({ 'animate-pulse': showAIChatPulse })}
              className="text-primary ring-primary"
              label="Ask AI"
              onClick={() => {
                if (showAIChatPulse) updateShowAIChatPulse(false);
                posthog.capture('open_ai_chat');
                setAiChatOpen(true);
              }}
              surfaceColor="emphasized"
            />
            {!isDisabled && (
              <IconButton icon={icon} label={label} onClick={handleClick} surfaceColor="emphasized" isDisabled={isDisabled} />
            )}
            <IconButton
              icon={SettingsIcon}
              label="Simulation Settings"
              onClick={() => setSimulationSettingsOpen(true)}
              surfaceColor="emphasized"
            />
            <IconButton
              icon={MessageCircleMoreIcon}
              label="Share Feedback"
              onClick={() => setUserFeedbackOpen(true)}
              surfaceColor="emphasized"
            />
          </div>
        }
        className="w-[calc(100%-42rem)] group-data-[state=collapsed]/sidebar:w-[calc(100%-28rem)]"
      />

      <Drawer open={aiChatOpen} setOpen={setAiChatOpen} title={aiChatTitleComponent} size="large">
        <Suspense fallback={<PageLoading message="Loading AI Chat" />}>
          <AIChatDrawer setOpen={setAiChatOpen} />
        </Suspense>
      </Drawer>
      <Drawer open={simulationSettingsOpen} setOpen={setSimulationSettingsOpen} title={simulationSettingsTitleComponent}>
        <Suspense fallback={<PageLoading message="Loading Simulation Settings" />}>
          <SimulationSettingsDrawer setOpen={setSimulationSettingsOpen} simulationSettings={simulationSettings} />
        </Suspense>
      </Drawer>
      <Drawer open={userFeedbackOpen} setOpen={setUserFeedbackOpen} title={userFeedbackTitleComponent}>
        <Suspense fallback={<PageLoading message="Loading User Feedback" />}>
          <UserFeedbackDrawer setOpen={setUserFeedbackOpen} />
        </Suspense>
      </Drawer>
    </>
  );
}
