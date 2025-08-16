'use client';

import { AdjustmentsHorizontalIcon, CalculatorIcon, PresentationChartLineIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import IconButton from '@/components/ui/icon-button';
import Drawer from '@/components/ui/drawer';
import { useRegenSimulation } from '@/hooks/use-regen-simulation';

import PreferencesDrawer from './inputs/drawers/preferences-drawer';

type ActiveSection = 'results' | 'your-numbers';

const tabs = [
  {
    name: 'Numbers',
    icon: CalculatorIcon,
    value: 'your-numbers' as ActiveSection,
  },
  {
    name: 'Results',
    icon: PresentationChartLineIcon,
    value: 'results' as ActiveSection,
  },
];

interface SectionSelectorProps {
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
}

export default function SectionSelector({ activeSection, setActiveSection }: SectionSelectorProps) {
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const { icon, label, handleClick, className } = useRegenSimulation();

  return (
    <>
      <div className="border-border bg-emphasized-background -mx-4 mb-5 border-b sm:-mx-6 lg:-mx-8 xl:mt-0">
        <div className="mr-4 flex items-center justify-between sm:mr-6 lg:mr-8">
          <nav aria-label="Tabs" className="divide-border border-border flex divide-x border-r">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveSection(tab.value)}
                aria-current={tab.value === activeSection ? 'page' : undefined}
                className={cn(
                  'text-muted-foreground flex items-center gap-2 p-2 text-sm/6 font-semibold tracking-tight lg:px-4 lg:py-6 lg:text-2xl',
                  { 'text-foreground': tab.value === activeSection },
                  { 'hover:bg-background': tab.value !== activeSection }
                )}
              >
                <tab.icon
                  className={cn('size-6 sm:size-8', {
                    'text-primary': tab.value === activeSection,
                  })}
                  aria-hidden="true"
                />
                {tab.name}
              </button>
            ))}
          </nav>
          {activeSection === 'your-numbers' && (
            <IconButton icon={AdjustmentsHorizontalIcon} label="Preferences" onClick={() => setPreferencesOpen(true)} />
          )}
          {activeSection === 'results' && <IconButton icon={icon} label={label} onClick={handleClick} className={cn(className)} />}
        </div>
      </div>

      <Drawer open={preferencesOpen} setOpen={setPreferencesOpen} title="Preferences">
        <PreferencesDrawer />
      </Drawer>
    </>
  );
}
