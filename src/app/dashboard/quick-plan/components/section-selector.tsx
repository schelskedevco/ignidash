'use client';

import {
  CalculatorIcon,
  SlidersHorizontalIcon,
  PresentationIcon,
  TrendingUpIcon,
  BanknoteXIcon,
  HourglassIcon,
  SparklesIcon,
} from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import IconButton from '@/components/ui/icon-button';
import Drawer from '@/components/ui/drawer';
import { useRegenSimulation } from '@/hooks/use-regen-simulation';

import ExpectedReturnsDrawer from './inputs/drawers/expected-returns-drawer';
import TaxSettingsDrawer from './inputs/drawers/tax-settings-drawer';
import TimelineDrawer from './inputs/drawers/timeline-drawer';
import SimulationSettingsDrawer from './outputs/drawers/simulation-settings-drawer';

type ActiveSection = 'results' | 'your-numbers';

const tabs = [
  {
    name: 'Numbers',
    icon: CalculatorIcon,
    value: 'your-numbers' as ActiveSection,
  },
  {
    name: 'Results',
    icon: PresentationIcon,
    value: 'results' as ActiveSection,
  },
];

interface SectionSelectorProps {
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
}

export default function SectionSelector({ activeSection, setActiveSection }: SectionSelectorProps) {
  const [expectedReturnsOpen, setExpectedReturnsOpen] = useState(false);
  const [taxSettingsOpen, setTaxSettingsOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [simulationSettingsOpen, setSimulationSettingsOpen] = useState(false);

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
  const simulationSettingsTitleComponent = (
    <div className="flex items-center gap-2">
      <SlidersHorizontalIcon className="text-primary size-6 shrink-0" aria-hidden="true" />
      <span>Simulation Settings</span>
    </div>
  );

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
              <IconButton icon={SparklesIcon} label="Ask AI (Coming soon!)" onClick={() => {}} surfaceColor="emphasized" />
              <IconButton
                icon={SlidersHorizontalIcon}
                label="Simulation Settings"
                onClick={() => setSimulationSettingsOpen(true)}
                surfaceColor="emphasized"
              />
              <IconButton icon={icon} label={label} onClick={handleClick} surfaceColor="emphasized" isDisabled={isDisabled} />
            </div>
          )}
        </div>
      </div>

      <Drawer open={expectedReturnsOpen} setOpen={setExpectedReturnsOpen} title={expectedReturnsTitleComponent}>
        <ExpectedReturnsDrawer setOpen={setExpectedReturnsOpen} />
      </Drawer>
      <Drawer open={taxSettingsOpen} setOpen={setTaxSettingsOpen} title={taxSettingsTitleComponent}>
        <TaxSettingsDrawer />
      </Drawer>
      <Drawer open={timelineOpen} setOpen={setTimelineOpen} title={timelineTitleComponent}>
        <TimelineDrawer setOpen={setTimelineOpen} />
      </Drawer>
      <Drawer open={simulationSettingsOpen} setOpen={setSimulationSettingsOpen} title={simulationSettingsTitleComponent}>
        <SimulationSettingsDrawer setOpen={setSimulationSettingsOpen} />
      </Drawer>
    </>
  );
}
