import ResultsSections from './outputs/results-sections';
import ResultsColumnHeader from './outputs/results-column-header';

export default function DesktopMainArea() {
  return (
    <div className="hidden xl:block">
      <ResultsColumnHeader />
      <ResultsSections />
    </div>
  );
}
