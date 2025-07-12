import { BasicsSection } from "./sections/basics-section";
import { GoalSection } from "./sections/goal-section";
import { FineTuneSection } from "./sections/fine-tune-section";

export function YourNumbersSections() {
  return (
    <>
      <BasicsSection />

      <GoalSection />

      <FineTuneSection />
    </>
  );
}
