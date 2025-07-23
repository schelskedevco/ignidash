'use client';

import { Coffee } from 'lucide-react';

import NumberInput from '@/components/ui/number-input';
import DisclosureCard from '@/components/ui/disclosure-card';
import { useFlexiblePathsData, useUpdateFlexiblePaths } from '@/lib/stores/quick-plan-store';

export default function BaristaFIRE() {
  const flexiblePaths = useFlexiblePathsData();
  const updateFlexiblePaths = useUpdateFlexiblePaths();

  return (
    <DisclosureCard title="Barista FIRE" desc="Work part-time in enjoyable jobs while investments cover the rest." icon={Coffee}>
      <form onSubmit={(e) => e.preventDefault()}>
        <fieldset className="space-y-4">
          <legend className="sr-only">Barista FIRE part-time income configuration</legend>
          <NumberInput
            id="part-time-income"
            label={
              <div className="flex w-full items-center justify-between">
                <span>Part-Time Income</span>
                <span className="text-muted-foreground text-sm/6">Optional</span>
              </div>
            }
            value={flexiblePaths.partTimeIncome}
            onBlur={(value) => updateFlexiblePaths('partTimeIncome', value)}
            inputMode="decimal"
            placeholder="$18,000"
            prefix="$"
            desc="Expected gross annual income from part-time work in today's dollars."
          />
        </fieldset>
      </form>
    </DisclosureCard>
  );
}
