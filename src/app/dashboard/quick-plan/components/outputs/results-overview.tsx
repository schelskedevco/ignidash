import { useFIREAnalysis } from "@/lib/stores/quick-plan-store";
import { formatNumber } from "@/lib/utils";

export function ResultsOverview() {
  const fireAnalysis = useFIREAnalysis();

  const stats = [
    { name: "FIRE Age", stat: fireAnalysis.fireAge },
    { name: "Years to FIRE", stat: fireAnalysis.yearsToFIRE },
    { name: "Required Portfolio Size", stat: fireAnalysis.requiredPortfolio },
  ];

  return (
    <>
      <dl className="divide-foreground/10 mt-5 grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {stats.map((item) => (
          <div
            key={item.name}
            className="px-4 py-5 text-center sm:p-6 sm:text-left"
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
