import { InfoIcon } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCompactCurrency } from '@/lib/utils/number-formatters';

interface ContributionLimitTooltipProps {
  annualLimit: number | null;
}

/**
 * Explains the account-level cap behind an "All Remaining" contribution rule.
 */
export default function ContributionLimitTooltip({ annualLimit }: ContributionLimitTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger className="text-muted-foreground">
        <InfoIcon className="size-4 fill-white dark:fill-stone-950" />
      </TooltipTrigger>
      <TooltipContent>
        {annualLimit !== null && Number.isFinite(annualLimit) ? (
          <p>
            Uses the current annual account limit of {formatCompactCurrency(annualLimit, 0)} before earlier rules, income caps, employer
            match, and max balance are applied.
          </p>
        ) : (
          <p>This account type has no annual contribution limit before income caps or max balance are applied.</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
