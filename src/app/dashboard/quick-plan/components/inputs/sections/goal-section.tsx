"use client";

import { Card } from "@/components/ui/card";
import {
  CoastFIRE,
  BaristaFIRE,
} from "../strategy-options/goal-strategy-options";
import { NumberField } from "@/components/ui/number-field";
import { SectionHeader } from "@/components/layout/section-header";
import { useGoalsData, useUpdateGoals } from "@/lib/stores/quick-plan-store";

export function GoalSection() {
  const goals = useGoalsData();
  const updateGoals = useUpdateGoals();

  return (
    <div className="border-foreground/10 mb-5 border-b pb-5">
      <SectionHeader
        title="Retirement Goal"
        desc="Your retirement spending level determines when you'll have enough to retire.
          Consider optional strategies for getting there."
      />
      <form onSubmit={(e) => e.preventDefault()}>
        <fieldset className="space-y-4">
          <legend className="sr-only">
            Retirement goal and strategy options
          </legend>
          <Card>
            <NumberField
              id="retirement-expenses"
              label="Retirement Expenses"
              value={goals.retirementExpenses}
              onChange={(value) => updateGoals("retirementExpenses", value)}
              placeholder="$50,000"
              min={0}
            />
          </Card>
          <CoastFIRE
            targetRetirementAge={goals.targetRetirementAge}
            setTargetRetirementAge={(value) =>
              updateGoals("targetRetirementAge", value)
            }
          />
          <BaristaFIRE
            partTimeIncome={goals.partTimeIncome}
            setPartTimeIncome={(value) => updateGoals("partTimeIncome", value)}
          />
        </fieldset>
      </form>
    </div>
  );
}
