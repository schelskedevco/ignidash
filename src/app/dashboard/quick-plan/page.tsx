import { MainArea } from "../components/main-area";
import { SecondaryColumn } from "../components/secondary-column";
import {
  CalculatorIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";

export default function QuickPlanPage() {
  return (
    <>
      <MainArea>
        <div className="border-foreground/10 dark:border-foreground/10 border-b pb-5">
          <h3 className="font-display flex items-center gap-2 text-lg font-semibold text-gray-900 lg:text-xl dark:text-gray-100">
            <PresentationChartLineIcon className="h-5 w-5" />
            Results
          </h3>
        </div>
      </MainArea>
      <SecondaryColumn>
        <div className="border-foreground/10 dark:border-foreground/10 border-b pb-5">
          <h3 className="font-display flex items-center gap-2 text-lg font-semibold text-gray-900 lg:text-xl dark:text-gray-100">
            <CalculatorIcon className="h-5 w-5" />
            Your Numbers
          </h3>
        </div>
      </SecondaryColumn>
    </>
  );
}
