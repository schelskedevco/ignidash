import { BasicsSection } from './sections/basics-section';
import { GoalSection } from './sections/goal-section';
import { FineTuneSection } from './sections/fine-tune-section';

export default function NumbersColumnSections() {
  return (
    <>
      <BasicsSection />
      <GoalSection />
      <FineTuneSection />
    </>
  );
}
