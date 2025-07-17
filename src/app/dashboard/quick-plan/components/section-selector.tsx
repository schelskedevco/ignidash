'use client';

import { ChevronDownIcon } from '@heroicons/react/16/solid';
import { CalculatorIcon, PresentationChartLineIcon } from '@heroicons/react/20/solid';

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

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function SectionSelector({ activeSection, setActiveSection }: SectionSelectorProps) {
  return (
    <div className="mb-5">
      <div className="border-foreground/10 grid grid-cols-1 border-b pb-5 sm:hidden">
        <select
          value={tabs.find((tab) => tab.value === activeSection)?.name}
          onChange={(e) => {
            const selectedTab = tabs.find((tab) => tab.name === e.target.value);
            if (selectedTab) {
              setActiveSection(selectedTab.value);
            }
          }}
          aria-label="Select a section"
          className="bg-emphasized-background text-foreground outline-foreground/10 focus:outline-foreground col-start-1 row-start-1 w-full appearance-none rounded-md py-2 pr-8 pl-3 text-base outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2"
        >
          {tabs.map((tab) => (
            <option key={tab.name} value={tab.name}>
              {tab.name}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden="true"
          className="fill-muted-foreground pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end"
        />
      </div>
      <div className="hidden sm:block">
        <div className="border-foreground/10 border-b">
          <nav aria-label="Tabs" className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const isActive = tab.value === activeSection;
              return (
                <button
                  key={tab.name}
                  onClick={() => setActiveSection(tab.value)}
                  aria-current={isActive ? 'page' : undefined}
                  className={classNames(
                    isActive
                      ? 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400'
                      : 'border-transparent text-gray-700 hover:text-rose-600 dark:text-gray-300 dark:hover:text-rose-400',
                    'group focus-outline inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium'
                  )}
                >
                  <tab.icon
                    aria-hidden="true"
                    className={classNames(
                      isActive
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-gray-400 group-hover:text-rose-600 dark:text-gray-500 dark:group-hover:text-rose-400',
                      'mr-2 -ml-0.5 size-5'
                    )}
                  />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
