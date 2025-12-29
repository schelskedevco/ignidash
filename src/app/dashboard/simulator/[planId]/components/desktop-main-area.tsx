import SecondaryColumn from '@/components/layout/secondary-column';

import NumbersColumnSections from './inputs/numbers-column-sections';
import NumbersColumnHeader from './inputs/numbers-column-header';
import ResultsSections from './outputs/results-sections';
import ResultsColumnHeader from './outputs/results-column-header';

export default function DesktopMainArea() {
  return (
    <>
      <div className="hidden xl:block">
        <ResultsColumnHeader />
        <div className="flex h-full flex-col pt-[4.3125rem]">
          <ResultsSections />
        </div>
      </div>
      <SecondaryColumn>
        <NumbersColumnHeader />
        <div className="flex h-full flex-col pt-[4.3125rem]">
          <NumbersColumnSections />
        </div>
      </SecondaryColumn>
    </>
  );
}
