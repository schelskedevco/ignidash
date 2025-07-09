import { MainArea } from "../components/main-area";
import { SecondaryColumn } from "../components/secondary-column";
import {
  CalculatorIcon,
  PresentationChartLineIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { Card } from "@/components/card";
import { IconButton } from "@/components/icon-button";
import { CoreInputs } from "./components/core-inputs";
import { CoastFIRE, BaristaFIRE } from "./components/alternative-paths";
import Tabs from "@/components/tabs";

export default function QuickPlanPage() {
  return (
    <>
      <MainArea>
        <div className="block xl:hidden">
          <Tabs />
        </div>
        <div className="border-foreground/10 mb-5 hidden border-b pb-5 xl:block">
          <h3 className="font-display flex items-center gap-2 text-lg font-semibold text-gray-900 lg:text-xl dark:text-gray-100">
            <PresentationChartLineIcon className="h-5 w-5" />
            Results
          </h3>
        </div>
      </MainArea>
      <SecondaryColumn>
        <div className="border-foreground/10 mb-5 border-b pb-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display flex items-center gap-2 text-lg font-semibold text-gray-900 lg:text-xl dark:text-gray-100">
              <CalculatorIcon className="h-5 w-5" />
              Your Numbers
            </h3>
            <IconButton icon={Cog6ToothIcon} label="Settings" />
          </div>
        </div>
        <div className="border-foreground/10 mb-5 border-b pb-5">
          <div className="ml-2">
            <h4 className="text-base font-semibold">Foundation</h4>
            <p className="text-muted-foreground mt-2 text-sm">
              The core numbers needed to estimate your financial independence
              timeline.
            </p>
          </div>

          <Card>
            <CoreInputs />
          </Card>
        </div>
        <div className="border-foreground/10 mb-5 border-b pb-5">
          <div className="ml-2">
            <h4 className="text-base font-semibold">Alternative Paths</h4>
            <p className="text-muted-foreground mt-2 text-sm">
              Full retirement isn&apos;t your only option. Explore proven
              strategies for earlier freedom.
            </p>
          </div>
          <Card>
            <CoastFIRE />
          </Card>
          <Card>
            <BaristaFIRE />
          </Card>
        </div>
      </SecondaryColumn>
    </>
  );
}
