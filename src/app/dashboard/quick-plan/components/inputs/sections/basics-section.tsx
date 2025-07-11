"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { NumberField } from "@/components/ui/number-field";
import { SectionHeader } from "@/components/layout/section-header";
import { DisclosureSection } from "@/components/layout/disclosure-section";
import InvalidInputError from "@/components/ui/invalid-input-error";
import { ArrowTrendingUpIcon, ChartPieIcon } from "@heroicons/react/24/outline";

interface BasicsSectionProps {
  currentAge: string;
  setCurrentAge: (value: string) => void;
  annualIncome: string;
  setAnnualIncome: (value: string) => void;
  annualExpenses: string;
  setAnnualExpenses: (value: string) => void;
  investedAssets: string;
  setInvestedAssets: (value: string) => void;
}

export function BasicsSection({
  currentAge,
  setCurrentAge,
  annualIncome,
  setAnnualIncome,
  annualExpenses,
  setAnnualExpenses,
  investedAssets,
  setInvestedAssets,
}: BasicsSectionProps) {
  // Growth rates state
  const [incomeGrowthRate, setIncomeGrowthRate] = useState("3");
  const [expenseGrowthRate, setExpenseGrowthRate] = useState("3");

  // Asset allocation state
  const [stockAllocation, setStockAllocation] = useState("70");
  const [bondAllocation, setBondAllocation] = useState("30");
  const [cashAllocation, setCashAllocation] = useState("0");

  // Utility function to validate allocation totals 100%
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

  // Show allocation error message
  const showAllocationError = !isAllocationValid(
    stockAllocation,
    bondAllocation,
    cashAllocation
  );

  return (
    <div className="border-foreground/10 mb-5 border-b pb-5">
      <SectionHeader
        title="Financial Foundation"
        desc="The core numbers needed to estimate your financial independence timeline."
      />

      <Card>
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset className="space-y-4">
            <legend className="sr-only">
              Basic financial information for FIRE calculation
            </legend>
            <NumberField
              id="current-age"
              label="Current Age"
              value={currentAge}
              onChange={(e) => setCurrentAge(e.target.value)}
              placeholder="28"
            />
            <NumberField
              id="annual-income"
              label="Net Annual Income"
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
              placeholder="$85,000"
            />
            <NumberField
              id="annual-expenses"
              label="Annual Expenses"
              value={annualExpenses}
              onChange={(e) => setAnnualExpenses(e.target.value)}
              placeholder="$50,000"
            />
            <NumberField
              id="invested-assets"
              label="Invested Assets"
              value={investedAssets}
              onChange={(e) => setInvestedAssets(e.target.value)}
              placeholder="$75,000"
            />
          </fieldset>
        </form>
      </Card>

      <div className="mt-4 space-y-4">
        <DisclosureSection
          title="Income & Spending Growth"
          desc="Set expected nominal growth rates for income and expenses over time."
          icon={<ArrowTrendingUpIcon className="h-5 w-5" aria-hidden="true" />}
        >
          <form onSubmit={(e) => e.preventDefault()}>
            <fieldset className="space-y-4">
              <legend className="sr-only">
                Income and expense growth rate projections
              </legend>
              <NumberField
                id="income-growth-rate"
                label="Income Growth Rate (%)"
                value={incomeGrowthRate}
                onChange={(e) => setIncomeGrowthRate(e.target.value)}
                placeholder="3"
                min="0"
                max="50"
                step="0.1"
              />
              <NumberField
                id="expense-growth-rate"
                label="Expense Growth Rate (%)"
                value={expenseGrowthRate}
                onChange={(e) => setExpenseGrowthRate(e.target.value)}
                placeholder="3"
                min="0"
                max="10"
                step="0.1"
              />
            </fieldset>
          </form>
        </DisclosureSection>

        <DisclosureSection
          title="Investment Portfolio"
          desc="Configure asset allocation across stocks, bonds, and cash."
          icon={<ChartPieIcon className="h-5 w-5" aria-hidden="true" />}
        >
          <form onSubmit={(e) => e.preventDefault()}>
            <fieldset className="space-y-4">
              <legend className="sr-only">
                Asset allocation percentages for investment portfolio
              </legend>
              <NumberField
                id="stock-allocation"
                label="Stocks (%)"
                value={stockAllocation}
                onChange={(e) => setStockAllocation(e.target.value)}
                placeholder="70"
                min="0"
                max="100"
                step="1"
              />
              <NumberField
                id="bond-allocation"
                label="Bonds (%)"
                value={bondAllocation}
                onChange={(e) => setBondAllocation(e.target.value)}
                placeholder="30"
                min="0"
                max="100"
                step="1"
              />
              <NumberField
                id="cash-allocation"
                label="Cash (%)"
                value={cashAllocation}
                onChange={(e) => setCashAllocation(e.target.value)}
                placeholder="0"
                min="0"
                max="100"
                step="1"
              />
            </fieldset>
          </form>
        </DisclosureSection>
        {showAllocationError && (
          <InvalidInputError title="Asset allocation must total 100%" />
        )}
      </div>
    </div>
  );
}
