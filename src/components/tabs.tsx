import { ChevronDownIcon } from "@heroicons/react/16/solid";
import {
  CalculatorIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/20/solid";

const tabs = [
  { name: "Your Numbers", icon: CalculatorIcon, current: false },
  { name: "Results", icon: PresentationChartLineIcon, current: true },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function Tabs() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:hidden">
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          defaultValue={tabs.find((tab) => tab.current)?.name}
          aria-label="Select a tab"
          className="bg-emphasized-background text-foreground outline-foreground/10 col-start-1 row-start-1 w-full appearance-none rounded-md py-2 pr-8 pl-3 text-base outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2 focus:outline-rose-600 dark:focus:outline-rose-400"
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden="true"
          className="fill-muted-foreground pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end"
        />
      </div>
      <div className="hidden sm:block">
        <div className="border-foreground/10 border-b">
          <nav aria-label="Tabs" className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <a
                key={tab.name}
                href={"#"}
                aria-current={tab.current ? "page" : undefined}
                className={classNames(
                  tab.current
                    ? "border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400"
                    : "border-transparent text-gray-700 hover:text-rose-600 dark:text-gray-300 dark:hover:text-rose-400",
                  "group inline-flex items-center border-b-2 px-1 py-4 text-sm font-medium"
                )}
              >
                <tab.icon
                  aria-hidden="true"
                  className={classNames(
                    tab.current
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-gray-400 group-hover:text-rose-600 dark:text-gray-500 dark:group-hover:text-rose-400",
                    "mr-2 -ml-0.5 size-5"
                  )}
                />
                <span>{tab.name}</span>
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
