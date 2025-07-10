"use client";

import { useState } from "react";
import { NumberField } from "@/components/number-field";
import { FormSection } from "@/components/form-section";
import InvalidInputError from "@/components/invalid-input-error";

interface GrowthAllocationProps {
  annualExpenses?: string;
}

export function GrowthAllocation({ annualExpenses }: GrowthAllocationProps) {
  // Growth rates
  const [incomeGrowthRate, setIncomeGrowthRate] = useState("3");
  const [expenseGrowthRate, setExpenseGrowthRate] = useState("3");
  const [retirementExpenses, setRetirementExpenses] = useState("");

  // Asset allocation
  const [stockAllocation, setStockAllocation] = useState("70");
  const [bondAllocation, setBondAllocation] = useState("30");
  const [cashAllocation, setCashAllocation] = useState("0");

  // Expected returns
  const [stockReturn, setStockReturn] = useState("10");
  const [bondReturn, setBondReturn] = useState("5");
  const [cashReturn, setCashReturn] = useState("3");

  // Utility functions

  const isAllocationValid = (
    stocks: string,
    bonds: string,
    cash: string
  ): boolean => {
    const sum =
      parseFloat(stocks || "0") +
      parseFloat(bonds || "0") +
      parseFloat(cash || "0");
    return Math.abs(sum - 100) < 0.01;
  };

  // Dynamic placeholder for retirement expenses
  const retirementExpensesPlaceholder = annualExpenses || "$50,000";

  // Show allocation error message
  const showAllocationError = !isAllocationValid(
    stockAllocation,
    bondAllocation,
    cashAllocation
  );

  return (
    <>
      <FormSection title="Annual Income">
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
      </FormSection>

      <FormSection title="Annual Expenses">
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
        <NumberField
          id="retirement-expenses"
          label="Retirement Expenses"
          value={retirementExpenses}
          onChange={(e) => setRetirementExpenses(e.target.value)}
          placeholder={retirementExpensesPlaceholder}
          desc="Annual retirement spending in today's currency. Sometimes lower than current expenses."
        />
      </FormSection>

      <FormSection
        title="Asset Allocation"
        desc="How your investments are divided. Must total 100%."
        errorComponent={
          showAllocationError && (
            <InvalidInputError title="Asset allocation must total 100%" />
          )
        }
      >
        <NumberField
          id="stock-allocation"
          label="Stocks (%)"
          value={stockAllocation}
          onChange={(e) => setStockAllocation(e.target.value)}
          placeholder="70"
          min="0"
          max="100"
          desc="Higher risk, higher returns. Typically decreases closer to retirement."
        />
        <NumberField
          id="bond-allocation"
          label="Bonds (%)"
          value={bondAllocation}
          onChange={(e) => setBondAllocation(e.target.value)}
          placeholder="30"
          min="0"
          max="100"
          desc="Lower risk, steady income. Typically increases closer to retirement."
        />
        <NumberField
          id="cash-allocation"
          label="Cash (%)"
          value={cashAllocation}
          onChange={(e) => setCashAllocation(e.target.value)}
          placeholder="0"
          min="0"
          max="100"
          desc="Emergency fund and stability. Amount varies by personal needs."
        />
      </FormSection>
      <FormSection
        title="Expected Returns"
        hasBorder={false}
        desc="Annual returns before inflation. Historical averages vary."
      >
        <NumberField
          id="stock-return"
          label="Stock Returns (%)"
          value={stockReturn}
          onChange={(e) => setStockReturn(e.target.value)}
          placeholder="10"
          min="0"
          max="20"
          step="0.1"
          desc="Historical average 9-11%. Conservative projections use 7-8%."
        />
        <NumberField
          id="bond-return"
          label="Bond Returns (%)"
          value={bondReturn}
          onChange={(e) => setBondReturn(e.target.value)}
          placeholder="5"
          min="0"
          max="15"
          step="0.1"
          desc="Historical average 5-6%. Varies with interest rates."
        />
        <NumberField
          id="cash-return"
          label="Cash Returns (%)"
          value={cashReturn}
          onChange={(e) => setCashReturn(e.target.value)}
          placeholder="3"
          min="0"
          max="10"
          step="0.1"
          desc="Money market rates. Often 2-5%, tracks Fed rates."
        />
      </FormSection>
    </>
  );
}
