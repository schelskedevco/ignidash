'use client';

import { CalculatorIcon, PresentationChartLineIcon } from '@heroicons/react/20/solid';

import { cn } from '@/lib/utils';

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
  // current ? 'bg-background text-primary ring-primary ring' : 'hover:bg-background',
  //       'group focus-outline flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold'
  return (
    <div className="mb-5">
      {/* Mobile Navigation */}
      <div className="border-border grid grid-cols-1 border-b pt-3 pb-5 sm:hidden">
        <span className="isolate inline-flex w-full rounded-md shadow-xs">
          <button
            type="button"
            onClick={() => setActiveSection('your-numbers')}
            className={cn(
              activeSection === 'your-numbers' ? 'text-primary' : 'hover:text-primary/75 text-muted-foreground',
              'ring-border relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold ring-1 ring-inset focus:z-10'
            )}
          >
            <CalculatorIcon aria-hidden="true" className="mr-2 -ml-0.5 size-5" />
            Numbers
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('results')}
            className={cn(
              activeSection === 'results' ? 'text-primary' : 'hover:text-primary/75 text-muted-foreground',
              'ring-border relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold ring-1 ring-inset focus:z-10'
            )}
          >
            <PresentationChartLineIcon aria-hidden="true" className="mr-2 -ml-0.5 size-5" />
            Results
          </button>
        </span>
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
        </div>
      </div>
    </div>
  );
}
