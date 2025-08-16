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
      <div className="border-border bg-emphasized-background -mx-4 mb-5 border-b py-2 sm:-mx-6 lg:-mx-8 lg:py-4">
        <div className="mr-4 flex items-stretch justify-between sm:mr-6 lg:mr-8">
          <nav aria-label="Tabs" className="divide-border border-border -my-2 flex divide-x border-r lg:-my-4">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveSection(tab.value)}
                aria-current={tab.value === activeSection ? 'page' : undefined}
                className={cn(
                  'text-muted-foreground flex items-center gap-2 p-2 lg:p-4',
                  { 'text-foreground': tab.value === activeSection },
                  { 'hover:bg-background': tab.value !== activeSection }
                )}
              >
                <tab.icon
                  className={cn('size-5 lg:size-8', {
                    'text-primary': tab.value === activeSection,
                  })}
                  aria-hidden="true"
                />
                <span className="text-sm/6 font-semibold lg:text-2xl lg:font-extrabold lg:tracking-tight">{tab.name}</span>
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
