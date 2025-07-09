import { Card } from "@/components/card";
import { CoreInputs } from "./core-inputs";
import { CoastFIRE, BaristaFIRE } from "./alternative-paths";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

export function YourNumbersContent() {
  return (
    <>
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

        <button
          type="button"
          className="bg-emphasized-background text-foreground hover:bg-background hover:ring-foreground/10 flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-sm shadow-sm hover:ring-1 hover:ring-inset sm:px-6"
        >
          <span>Advanced</span>
          <ChevronRightIcon className="h-5 w-5" />
        </button>
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
    </>
  );
}
