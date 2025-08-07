'use client';

import { CalculatorIcon, PresentationChartLineIcon, Cog6ToothIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';

import { cn } from '@/lib/utils';
import IconButton from '@/components/ui/icon-button';
import Drawer from '@/components/ui/drawer';
import { useLinkSharing } from '@/hooks/use-link-sharing';

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
  const { icon, label, handleLinkClick } = useLinkSharing();

  return (
    <>
      <div className="border-border mb-5 flex items-center justify-between border-b">
        <nav aria-label="Tabs" className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveSection(tab.value)}
              aria-current={tab.value === activeSection ? 'page' : undefined}
              className={cn(
                tab.value === activeSection
                  ? 'border-primary text-primary'
                  : 'hover:border-primary/75 hover:text-primary/75 text-muted-foreground border-transparent',
                'group focus-outline inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium'
              )}
            >
              <tab.icon
                aria-hidden="true"
                className={cn(
                  tab.value === activeSection ? 'text-primary' : 'group-hover:text-primary/75 text-muted-foreground',
                  'mr-2 -ml-0.5 size-5'
                )}
              />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
        {activeSection === 'your-numbers' && (
          <IconButton icon={Cog6ToothIcon} label="Preferences" onClick={() => setPreferencesOpen(true)} className="text-muted-foreground" />
        )}
        {activeSection === 'results' && (
          <IconButton icon={icon} label={label} onClick={handleLinkClick} className="text-muted-foreground" />
        )}
      </div>

      <Drawer open={preferencesOpen} setOpen={setPreferencesOpen} title="Preferences">
        <PreferencesDrawer />
      </Drawer>
    </>
  );
}
