"use client";

import { Card } from "@/components/ui/card";
import {
  CoastFIRE,
  BaristaFIRE,
} from "../strategy-options/goal-strategy-options";
import { NumberField } from "@/components/ui/number-field";
import { SectionHeader } from "@/components/layout/section-header";

interface GoalSectionProps {
  retirementExpenses: string;
  setRetirementExpenses: (value: string) => void;
  annualExpenses: string;
}

export function GoalSection({
  retirementExpenses,
  setRetirementExpenses,
  annualExpenses,
}: GoalSectionProps) {
  return (
    <div className="border-foreground/10 mb-5 border-b pb-5">
      <SectionHeader
        headline="Goal"
        desc="Full retirement isn't your only option. Explore proven strategies for earlier freedom."
      />
      <Card>
        <NumberField
          id="retirement-expenses"
          label="Retirement Expenses"
          value={retirementExpenses}
          onChange={(e) => setRetirementExpenses(e.target.value)}
          placeholder={annualExpenses || "$50,000"}
        />
      </Card>
      <Card>
        <CoastFIRE />
      </Card>
      <Card>
        <BaristaFIRE />
      </Card>
    </div>
  );
}
