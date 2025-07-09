import { CalculatorIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import { IconButton } from "@/components/icon-button";

export function YourNumbersHeader() {
  return (
    <div className="border-foreground/10 mb-5 border-b pb-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display flex items-center gap-2 text-lg font-semibold text-gray-900 lg:text-xl dark:text-gray-100">
          <CalculatorIcon className="h-5 w-5" />
          Your Numbers
        </h3>
        <IconButton icon={Cog6ToothIcon} label="Settings" />
      </div>
    </div>
  );
}
