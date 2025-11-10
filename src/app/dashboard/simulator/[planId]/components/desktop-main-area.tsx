import ResultsSections from './outputs/results-sections';
import ResultsColumnHeader from './outputs/results-column-header';

export default function DesktopMainArea() {
  return (
    <div className="hidden xl:block">
      <ResultsColumnHeader />
      <div className="flex h-full flex-col pt-[4.3125rem]">
        <ResultsSections />
      </div>
    </div>
  );
}
