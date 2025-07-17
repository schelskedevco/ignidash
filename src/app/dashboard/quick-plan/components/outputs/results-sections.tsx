import { useIsCalculationReady } from '@/lib/stores/quick-plan-store';
import Card from '@/components/ui/card';
import SectionHeader from '@/components/section-header';
import { ResultsOverview } from './results-overview';
import { ResultsChart } from './charts/results-chart';

export default function ResultsSections() {
  const isCalculationReady = useIsCalculationReady();
  if (isCalculationReady) {
    return (
      <div className="space-y-4">
        <div className="border-foreground/10 mb-5 border-b pb-5">
          <SectionHeader title="Overview" desc="Essential insights and forecasts for your retirement planning." />
          <ResultsOverview />
          <Card>
            <h4 className="text-foreground mb-4 text-center text-lg font-semibold sm:text-left">Portfolio Projection</h4>
            <ResultsChart />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="text-muted-foreground text-center">
      <p>Results content will be displayed here</p>
    </div>
  );
}
