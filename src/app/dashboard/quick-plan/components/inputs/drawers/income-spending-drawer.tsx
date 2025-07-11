"use client";

import { useState } from "react";
import { NumberField } from "@/components/ui/number-field";
import { SettingsSection } from "@/components/layout/settings-section";

export function IncomeSpendingDrawer() {
  // Growth rates state
  const [incomeGrowthRate, setIncomeGrowthRate] = useState("3");
  const [expenseGrowthRate, setExpenseGrowthRate] = useState("3");

  return (
    <>
      <SettingsSection title="Net Annual Income">
        <NumberField
          id="income-growth-rate"
          label="Income Growth Rate (%)"
          value={incomeGrowthRate}
          onChange={(e) => setIncomeGrowthRate(e.target.value)}
          placeholder="3"
          min="0"
          max="50"
          step="0.1"
          desc="Annual raise percentage. 0% loses purchasing power to inflation."
        />
      </SettingsSection>

      <SettingsSection title="Annual Expenses" hasBorder={false}>
        <NumberField
          id="expense-growth-rate"
          label="Expense Growth Rate (%)"
          value={expenseGrowthRate}
          onChange={(e) => setExpenseGrowthRate(e.target.value)}
          placeholder="3"
          min="0"
          max="10"
          step="0.1"
          desc="Annual spending increase. 0% means buying less as prices rise due to inflation."
        />
      </SettingsSection>
    </>
  );
}
