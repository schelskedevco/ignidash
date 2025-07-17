'use client';

import { useState } from 'react';

import { MainArea } from '@/components/layout/main-area';
import { SecondaryColumn } from '@/components/layout/secondary-column';

import { SectionSelector } from './components/section-selector';
import { ResultsSections } from './components/outputs/results-sections';
import { ResultsPageHeader } from './components/outputs/results-page-header';
import { NumbersColumnSections } from './components/inputs/numbers-column-sections';
import { NumbersColumnHeader } from './components/inputs/numbers-column-header';

type ActiveSection = 'results' | 'your-numbers';

export default function QuickPlanPage() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('your-numbers');

  return (
    <>
      <MainArea>
        <div className="block xl:hidden">
          <SectionSelector activeSection={activeSection} setActiveSection={setActiveSection} />
          {activeSection === 'results' ? <ResultsSections /> : <NumbersColumnSections />}
        </div>
        <div className="hidden xl:block">
          <ResultsPageHeader />
          <ResultsSections />
        </div>
      </MainArea>
      <SecondaryColumn>
        <NumbersColumnHeader />
        <NumbersColumnSections />
      </SecondaryColumn>
    </>
  );
}
