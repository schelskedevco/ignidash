import { useFIREAnalysis } from "@/lib/stores/quick-plan-store";
import { formatNumber } from "@/lib/utils";
import { PartyPopper } from "lucide-react";

export function ResultsOverview() {
  const fireAnalysis = useFIREAnalysis();

  const stats = [
    { name: "FIRE Age", stat: fireAnalysis.fireAge },
    { name: "Years to FIRE", stat: fireAnalysis.yearsToFIRE },
    { name: "Required Portfolio Size", stat: fireAnalysis.requiredPortfolio },
  ];

  return (
    <>
      <h3 className="text-foreground flex items-center justify-center gap-4 text-center text-2xl font-semibold">
        <PartyPopper className="h-6 w-6 shrink-0" />
        {fireAnalysis.message}
      </h3>
      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {stats.map((item) => (
          <div
            key={item.name}
            className="bg-emphasized-background overflow-hidden rounded-lg px-4 py-5 shadow-sm sm:p-6"
          >
            <dt className="text-muted-foreground truncate text-sm font-medium">
              {item.name}
            </dt>
            <dd className="text-foreground mt-1 text-3xl font-semibold tracking-tight">
              {formatNumber(item.stat)}
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}
