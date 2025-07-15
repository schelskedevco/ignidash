import { PartyPopper } from "lucide-react";

const stats = [
  { name: "Total Subscribers", stat: "71,897" },
  { name: "Avg. Open Rate", stat: "58.16%" },
  { name: "Avg. Click Rate", stat: "24.57%" },
];

export function ResultsSections() {
  return (
    <>
      <div>
        <h3 className="text-foreground flex items-center justify-center gap-4 text-center text-2xl font-semibold">
          <PartyPopper className="h-6 w-6" />
          You can FIRE at X!
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
                {item.stat}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
