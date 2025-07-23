'use client';

import { RollerCoaster } from 'lucide-react';

import NumberInput from '@/components/ui/number-input';
import DisclosureCard from '@/components/ui/disclosure-card';
import { useFlexiblePathsData, useUpdateFlexiblePaths } from '@/lib/stores/quick-plan-store';

export default function CoastFIRE() {
  const flexiblePaths = useFlexiblePathsData();
  const updateFlexiblePaths = useUpdateFlexiblePaths();

  return (
    <DisclosureCard title="Coast FIRE" desc="Front-load savings, then work just enough to cover living expenses." icon={RollerCoaster}>
      <form onSubmit={(e) => e.preventDefault()}>
        <fieldset className="space-y-4">
          <legend className="sr-only">Coast FIRE target retirement age setting</legend>
          <NumberInput
            id="target-retirement-age"
            label={
              <div className="flex w-full items-center justify-between">
                <span>Target Retirement Age</span>
                <span className="text-muted-foreground text-sm/6">Optional</span>
              </div>
            }
            value={flexiblePaths.targetRetirementAge}
            onBlur={(value) => updateFlexiblePaths('targetRetirementAge', value)}
            inputMode="numeric"
            placeholder="65"
            decimalScale={0}
            desc="When you want to fully retire. Determines when you can stop saving and coast."
          />
        </fieldset>
      </form>
    </DisclosureCard>
  );
}
