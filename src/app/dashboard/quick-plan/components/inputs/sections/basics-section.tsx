"use client";

import { Card } from "@/components/ui/card";
import { NumberField } from "@/components/ui/number-field";
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
import { useAllocationValidation } from "@/lib/hooks/use-validation";

export function BasicsSection() {
  const basics = useBasicsData();
  const growthRates = useGrowthRatesData();
  const allocation = useAllocationData();

  const { isValid: allocationIsValid } = useAllocationValidation(allocation);

  const updateBasics = useUpdateBasics();
  const updateGrowthRates = useUpdateGrowthRates();
  const updateAllocation = useUpdateAllocation();

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
              value={basics.currentAge}
              onChange={(value) => updateBasics("currentAge", value)}
              placeholder="28"
              min={16}
              max={100}
            />
            <NumberField
              id="annual-income"
              label="Net Annual Income"
              value={basics.annualIncome}
              onChange={(value) => updateBasics("annualIncome", value)}
              placeholder="$85,000"
              min={0}
            />
            <NumberField
              id="annual-expenses"
              label="Annual Expenses"
              value={basics.annualExpenses}
              onChange={(value) => updateBasics("annualExpenses", value)}
              placeholder="$50,000"
              min={0}
            />
            <NumberField
              id="invested-assets"
              label="Invested Assets"
              value={basics.investedAssets}
              onChange={(value) => updateBasics("investedAssets", value)}
              placeholder="$75,000"
              min={0}
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
                value={growthRates.incomeGrowthRate}
                onChange={(value) =>
                  updateGrowthRates("incomeGrowthRate", value ?? 3)
                }
                placeholder="3%"
                min={0}
                max={50}
                step={0.1}
              />
              <NumberField
                id="expense-growth-rate"
                label="Expense Growth Rate (%)"
                value={growthRates.expenseGrowthRate}
                onChange={(value) =>
                  updateGrowthRates("expenseGrowthRate", value ?? 3)
                }
                placeholder="3%"
                min={0}
                max={10}
                step={0.1}
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
                value={allocation.stockAllocation}
                onChange={(value) =>
                  updateAllocation("stockAllocation", value ?? 70)
                }
                placeholder="70%"
                min={0}
                max={100}
                step={1}
              />
              <NumberField
                id="bond-allocation"
                label="Bonds (%)"
                value={allocation.bondAllocation}
                onChange={(value) =>
                  updateAllocation("bondAllocation", value ?? 30)
                }
                placeholder="30%"
                min={0}
                max={100}
                step={1}
              />
              <NumberField
                id="cash-allocation"
                label="Cash (%)"
                value={allocation.cashAllocation}
                onChange={(value) =>
                  updateAllocation("cashAllocation", value ?? 0)
                }
                placeholder="0%"
                min={0}
                max={100}
                step={1}
              />
            </fieldset>
          </form>
        </DisclosureSection>
        {!allocationIsValid && (
          <InvalidInputError title="Asset allocation must total 100%" />
        )}
      </div>
    </div>
  );
}
