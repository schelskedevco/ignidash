import { useIsCalculationReady } from "@/lib/stores/quick-plan-store";
import { ResultsOverview } from "./results-overview";

export function ResultsSections() {
  const isCalculationReady = useIsCalculationReady();
  if (isCalculationReady) {
    return <ResultsOverview />;
  }

  return (
    <div className="text-muted-foreground text-center">
      <p>Results content will be displayed here</p>
    </div>
  );
}
