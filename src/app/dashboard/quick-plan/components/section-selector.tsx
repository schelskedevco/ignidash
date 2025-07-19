'use client';

import { ChevronDownIcon } from '@heroicons/react/16/solid';
import { CalculatorIcon, PresentationChartLineIcon } from '@heroicons/react/20/solid';

import { cn } from '@/lib/utils';

type ActiveSection = 'results' | 'your-numbers';

interface SectionSelectorProps {
  activeSection: ActiveSection;
  setActiveSection: (section: ActiveSection) => void;
}

const tabs = [
  {
    name: 'Your Numbers',
    icon: CalculatorIcon,
    value: 'your-numbers' as ActiveSection,
  },
  {
    name: 'Results',
    icon: PresentationChartLineIcon,
    value: 'results' as ActiveSection,
  },
];

export default function SectionSelector({ activeSection, setActiveSection }: SectionSelectorProps) {
  return (
    <div className="mb-5">
      {/* Mobile Navigation */}
      <div className="border-border grid grid-cols-1 border-b pb-5 sm:hidden">
        <select
          value={tabs.find((tab) => tab.value === activeSection)?.name}
          onChange={(e) => {
            const selectedTab = tabs.find((tab) => tab.name === e.target.value);
            if (selectedTab) {
              setActiveSection(selectedTab.value);
            }
          }}
          aria-label="Select a section"
          className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-rose-600"
        >
          {tabs.map((tab) => (
            <option key={tab.name} value={tab.name}>
              {tab.name}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden="true"
          className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500"
        />
      </div>
      {/* Desktop Navigation */}
      <div className="hidden sm:block">
        <div className="border-border border-b">
          <nav aria-label="Tabs" className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => setActiveSection(tab.value)}
                aria-current={tab.value === activeSection ? 'page' : undefined}
                className={cn(
                  tab.value === activeSection
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                  'group focus-outline inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium'
                )}
              >
                <tab.icon
                  aria-hidden="true"
                  className={cn(
                    tab.value === activeSection ? 'text-primary' : 'text-gray-400 group-hover:text-gray-500',
                    'mr-2 -ml-0.5 size-5'
                  )}
                />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
