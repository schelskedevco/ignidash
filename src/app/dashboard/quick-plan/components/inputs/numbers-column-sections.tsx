import BasicsSection from './sections/basics/section';
import GoalSection from './sections/retirement-goal/section';
import FineTuneSection from './sections/fine-tune/section';
import FIREPathsSection from './sections/fire-paths/section';

export default function NumbersColumnSections() {
  return (
    <>
      <BasicsSection />
      <GoalSection />
      <FineTuneSection />
      <FIREPathsSection />
    </>
  );
}
