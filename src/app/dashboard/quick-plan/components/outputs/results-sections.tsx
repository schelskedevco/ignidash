import { useIsCalculationReady } from "@/lib/stores/quick-plan-store";
import { Card } from "@/components/ui/card";
import { ResultsOverview } from "./results-overview";
import { ResultsChart } from "./charts/results-chart";

export function ResultsSections() {
  const isCalculationReady = useIsCalculationReady();
  if (isCalculationReady) {
    return (
      <div className="mx-auto max-w-7xl space-y-8">
        <ResultsOverview />
        <Card>
          <h4 className="text-foreground mb-4 text-lg font-semibold">
            Portfolio Projection
          </h4>
          <ResultsChart />
        </Card>
      </div>
    );
  }

  return (
    <div className="text-muted-foreground text-center">
      <p>Results content will be displayed here</p>
    </div>
  );
}
