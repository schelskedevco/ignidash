'use client';

import {
  CalculatorIcon,
  SettingsIcon,
  PresentationIcon,
  TrendingUpIcon,
  BanknoteXIcon,
  HourglassIcon,
  WandSparklesIcon,
  MessageCircleMoreIcon,
} from 'lucide-react';
import { useState, lazy, Suspense } from 'react';
import posthog from 'posthog-js';

import { cn } from '@/lib/utils';
import IconButton from '@/components/ui/icon-button';
import PageLoading from '@/components/ui/page-loading';
import Drawer from '@/components/ui/drawer';
import { useRegenSimulation } from '@/hooks/use-regen-simulation';
import { useShowAIChatPulse, useUpdateShowAIChatPulse } from '@/lib/stores/simulator-store';
import { useMarketAssumptionsData, useTaxSettingsData, useTimelineData, useSimulationSettingsData } from '@/hooks/use-convex-data';

const UserFeedbackDrawer = lazy(() => import('@/components/layout/user-feedback-drawer'));
const ExpectedReturnsDrawer = lazy(() => import('./inputs/drawers/expected-returns-drawer'));
const TaxSettingsDrawer = lazy(() => import('./inputs/drawers/tax-settings-drawer'));
const TimelineDrawer = lazy(() => import('./inputs/drawers/timeline-drawer'));
const AIChatDrawer = lazy(() => import('./outputs/drawers/ai-chat-drawer'));
const SimulationSettingsDrawer = lazy(() => import('./outputs/drawers/simulation-settings-drawer'));

type ActiveSection = 'results' | 'your-numbers';

const tabs = [
  { name: 'Numbers', icon: CalculatorIcon, value: 'your-numbers' as ActiveSection },
  { name: 'Results', icon: PresentationIcon, value: 'results' as ActiveSection },
];

interface SectionSelectorProps {
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
}

export default function SectionSelector({ activeSection, setActiveSection }: SectionSelectorProps) {
  const [expectedReturnsOpen, setExpectedReturnsOpen] = useState(false);
  const [taxSettingsOpen, setTaxSettingsOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [simulationSettingsOpen, setSimulationSettingsOpen] = useState(false);
  const [userFeedbackOpen, setUserFeedbackOpen] = useState(false);

  const marketAssumptions = useMarketAssumptionsData();
  const taxSettings = useTaxSettingsData();
  const timeline = useTimelineData();
  const simulationSettings = useSimulationSettingsData();

  const { icon, label, handleClick, isDisabled } = useRegenSimulation();

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

  const showAIChatPulse = useShowAIChatPulse();
  const updateShowAIChatPulse = useUpdateShowAIChatPulse();

  return (
    <>
      <div className="border-border/50 from-emphasized-background to-background fixed top-[4.0625rem] z-30 -mx-2 w-full border-b bg-gradient-to-bl py-2 sm:-mx-3 lg:top-0 lg:-mx-4 lg:w-[calc(100%-18rem)] lg:py-4 lg:group-data-[state=collapsed]/sidebar:w-[calc(100%-4rem)]">
        <div className="mr-4 flex items-stretch justify-between sm:mr-6 lg:mr-8">
          <nav aria-label="Tabs" className="divide-border/50 border-border/50 -my-2 flex divide-x border-r lg:-my-4">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveSection(tab.value)}
                aria-current={tab.value === activeSection ? 'page' : undefined}
                className={cn(
                  'text-muted-foreground focus-visible:ring-primary flex items-center gap-2 p-2 lowercase focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset lg:p-4',
                  { 'text-foreground': tab.value === activeSection },
                  { 'hover:bg-emphasized-background': tab.value !== activeSection }
                )}
              >
                <tab.icon className={cn('size-5 lg:size-6', { 'text-primary': tab.value === activeSection })} aria-hidden="true" />
                <span className="text-sm/6 font-semibold lg:text-lg lg:font-bold lg:tracking-tight">{tab.name}</span>
              </button>
            ))}
          </nav>
          {activeSection === 'your-numbers' && (
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
          )}
          {activeSection === 'results' && (
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
          )}
        </div>
      </div>

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
