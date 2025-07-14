"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { NumberInput } from "@/components/ui/number-input";
import { SectionHeader } from "@/components/layout/section-header";
import { DisclosureSection } from "@/components/layout/disclosure-section";
import InvalidInputError from "@/components/ui/invalid-input-error";
import { ArrowTrendingUpIcon, ChartPieIcon } from "@heroicons/react/24/outline";
import {
  useBasicsData,
  useGrowthRatesData,
  useAllocationData,
  useUpdateBasics,
  useUpdateGrowthRates,
  useUpdateAllocation,
} from "@/lib/stores/quick-plan-store";

export function BasicsSection() {
  const basics = useBasicsData();
  const growthRates = useGrowthRatesData();
  const allocation = useAllocationData();

  const updateBasics = useUpdateBasics();
  const updateGrowthRates = useUpdateGrowthRates();
  const updateAllocation = useUpdateAllocation();

  // Local state for allocation tracking
  const [localAllocation, setLocalAllocation] = useState({
    stockAllocation: allocation.stockAllocation,
    bondAllocation: allocation.bondAllocation,
    cashAllocation: allocation.cashAllocation,
  });

  // Error state for allocation validation
  const [allocationError, setAllocationError] = useState<string | null>(null);

  // Sync store changes to local state
  useEffect(() => {
    setLocalAllocation({
      stockAllocation: allocation.stockAllocation,
      bondAllocation: allocation.bondAllocation,
      cashAllocation: allocation.cashAllocation,
    });
  }, [allocation]);

  // Handler for allocation field changes
  const handleAllocationBlur = (
    field: keyof typeof localAllocation,
    value: unknown
  ) => {
    const updatedAllocation = {
      ...localAllocation,
      [field]: value,
    };

    setLocalAllocation(updatedAllocation);

    const result = updateAllocation(updatedAllocation);
    if (!result.success) {
      setAllocationError(result.error || "Invalid allocation values");
    } else {
      setAllocationError(null);
    }

    // HACK: Always return success to prevent field-level errors, relying on section-level validation instead.
    // TODO: Properly route field-specific vs form-level errors to appropriate UI locations.
    return { success: true };
  };

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
            <NumberInput
              id="current-age"
              label="Current Age"
              value={basics.currentAge}
              onBlur={(value) => updateBasics("currentAge", value)}
              inputMode="numeric"
              placeholder="28"
              decimalScale={0}
            />
            <NumberInput
              id="annual-income"
              label="Net Annual Income"
              value={basics.annualIncome}
              onBlur={(value) => updateBasics("annualIncome", value)}
              inputMode="decimal"
              placeholder="$85,000"
              prefix="$"
            />
            <NumberInput
              id="annual-expenses"
              label="Annual Expenses"
              value={basics.annualExpenses}
              onBlur={(value) => updateBasics("annualExpenses", value)}
              inputMode="decimal"
              placeholder="$50,000"
              prefix="$"
            />
            <NumberInput
              id="invested-assets"
              label="Invested Assets"
              value={basics.investedAssets}
              onBlur={(value) => updateBasics("investedAssets", value)}
              inputMode="decimal"
              placeholder="$75,000"
              prefix="$"
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
              <NumberInput
                id="income-growth-rate"
                label="Income Growth Rate (%)"
                value={growthRates.incomeGrowthRate}
                onBlur={(value) => updateGrowthRates("incomeGrowthRate", value)}
                inputMode="decimal"
                placeholder="3%"
                suffix="%"
              />
              <NumberInput
                id="expense-growth-rate"
                label="Expense Growth Rate (%)"
                value={growthRates.expenseGrowthRate}
                onBlur={(value) =>
                  updateGrowthRates("expenseGrowthRate", value)
                }
                inputMode="decimal"
                placeholder="3%"
                suffix="%"
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
              <NumberInput
                id="stock-allocation"
                label="Stocks (%)"
                value={localAllocation.stockAllocation}
                onBlur={(value) =>
                  handleAllocationBlur("stockAllocation", value)
                }
                inputMode="decimal"
                placeholder="70%"
                suffix="%"
              />
              <NumberInput
                id="bond-allocation"
                label="Bonds (%)"
                value={localAllocation.bondAllocation}
                onBlur={(value) =>
                  handleAllocationBlur("bondAllocation", value)
                }
                inputMode="decimal"
                placeholder="30%"
                suffix="%"
              />
              <NumberInput
                id="cash-allocation"
                label="Cash (%)"
                value={localAllocation.cashAllocation}
                onBlur={(value) =>
                  handleAllocationBlur("cashAllocation", value)
                }
                inputMode="decimal"
                placeholder="0%"
                suffix="%"
              />
            </fieldset>
          </form>
        </DisclosureSection>
        {allocationError && (
          <InvalidInputError
            title="Asset Allocation Error"
            description={allocationError}
          />
        )}
      </div>
    </div>
  );
}
