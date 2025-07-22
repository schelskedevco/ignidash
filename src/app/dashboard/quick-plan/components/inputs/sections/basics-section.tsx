'use client';

import { useState, useEffect } from 'react';
import { ArrowTrendingUpIcon, ChartPieIcon } from '@heroicons/react/24/outline';

import Card from '@/components/ui/card';
import NumberInput from '@/components/ui/number-input';
import InvalidInputError from '@/components/ui/invalid-input-error';
import SectionHeader from '@/components/ui/section-header';
import SectionContainer from '@/components/ui/section-container';
import DisclosureCard from '@/components/ui/disclosure-card';
import {
  useBasicsData,
  useGrowthRatesData,
  useAllocationData,
  useUpdateBasics,
  useUpdateGrowthRates,
  useUpdateAllocation,
  useStocksDollarAmount,
  useBondsDollarAmount,
  useCashDollarAmount,
  useIncomeRealGrowthRate,
  useExpenseRealGrowthRate,
} from '@/lib/stores/quick-plan-store';
import { formatNumber } from '@/lib/utils';

export default function BasicsSection() {
  const basics = useBasicsData();
  const growthRates = useGrowthRatesData();
  const allocation = useAllocationData();

  const updateBasics = useUpdateBasics();
  const updateGrowthRates = useUpdateGrowthRates();
  const updateAllocation = useUpdateAllocation();

  // Get dollar amounts for each asset class
  const stocksDollarAmount = useStocksDollarAmount();
  const bondsDollarAmount = useBondsDollarAmount();
  const cashDollarAmount = useCashDollarAmount();

  // Get real growth rates
  const incomeRealGrowthRate = useIncomeRealGrowthRate();
  const expenseRealGrowthRate = useExpenseRealGrowthRate();

  // Local state for allocation tracking
  const [localAllocation, setLocalAllocation] = useState({
    stockAllocation: allocation.stockAllocation,
    bondAllocation: allocation.bondAllocation,
    cashAllocation: allocation.cashAllocation,
  });

  // Sync store changes to local state
  useEffect(() => {
    setLocalAllocation({
      stockAllocation: allocation.stockAllocation,
      bondAllocation: allocation.bondAllocation,
      cashAllocation: allocation.cashAllocation,
    });
  }, [allocation]);

  // Error state for allocation validation
  const [allocationError, setAllocationError] = useState<string | undefined>(undefined);

  // Handler for allocation field changes
  const handleAllocationBlur = (field: keyof typeof localAllocation, value: unknown) => {
    const updatedAllocation = {
      ...localAllocation,
      [field]: value,
    };

    setLocalAllocation(updatedAllocation);

    const result = updateAllocation(updatedAllocation);
    if (!result.success) {
      setAllocationError(result.error);
    } else {
      setAllocationError(undefined);
    }

    /*
     * HACK: Always return success to prevent field-level errors, relying on section-level validation instead.
     * TODO: Properly route field-specific vs form-level errors to appropriate UI locations.
     */
    return { success: true };
  };

  return (
    <SectionContainer showBottomBorder>
      <SectionHeader
        title="Financial Foundation"
        desc="Enter the core numbers needed to estimate your financial independence timeline."
        status="complete"
      />
      <Card>
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset className="space-y-4">
            <legend className="sr-only">Basic financial information for FIRE calculation</legend>
            <NumberInput
              id="current-age"
              label="Current Age"
              value={basics.currentAge}
              onBlur={(value) => updateBasics('currentAge', value)}
              inputMode="numeric"
              placeholder="28"
              decimalScale={0}
            />
            <NumberInput
              id="annual-income"
              label="Net Annual Income"
              value={basics.annualIncome}
              onBlur={(value) => updateBasics('annualIncome', value)}
              inputMode="decimal"
              placeholder="$85,000"
              prefix="$"
            />
            <NumberInput
              id="annual-expenses"
              label="Annual Spending"
              value={basics.annualExpenses}
              onBlur={(value) => updateBasics('annualExpenses', value)}
              inputMode="decimal"
              placeholder="$50,000"
              prefix="$"
            />
            <NumberInput
              id="invested-assets"
              label="Invested Assets"
              value={basics.investedAssets}
              onBlur={(value) => updateBasics('investedAssets', value)}
              inputMode="decimal"
              placeholder="$75,000"
              prefix="$"
            />
          </fieldset>
        </form>
      </Card>

      <div className="space-y-4">
        <DisclosureCard title="Investment Portfolio" desc="Configure asset allocation across stocks, bonds, and cash." icon={ChartPieIcon}>
          <form onSubmit={(e) => e.preventDefault()}>
            <fieldset className="space-y-4">
              <legend className="sr-only">Asset allocation percentages for investment portfolio</legend>
              <NumberInput
                id="stock-allocation"
                label={
                  stocksDollarAmount > 0 ? (
                    <div className="flex w-full items-center justify-between">
                      <span>Stocks (%)</span>
                      <span className="text-muted-foreground text-sm/6">${formatNumber(stocksDollarAmount, 1)}</span>
                    </div>
                  ) : (
                    'Stocks (%)'
                  )
                }
                value={localAllocation.stockAllocation}
                onBlur={(value) => handleAllocationBlur('stockAllocation', value)}
                inputMode="decimal"
                placeholder="70%"
                suffix="%"
              />
              <NumberInput
                id="bond-allocation"
                label={
                  bondsDollarAmount > 0 ? (
                    <div className="flex w-full items-center justify-between">
                      <span>Bonds (%)</span>
                      <span className="text-muted-foreground text-sm/6">${formatNumber(bondsDollarAmount, 1)}</span>
                    </div>
                  ) : (
                    'Bonds (%)'
                  )
                }
                value={localAllocation.bondAllocation}
                onBlur={(value) => handleAllocationBlur('bondAllocation', value)}
                inputMode="decimal"
                placeholder="30%"
                suffix="%"
              />
              <NumberInput
                id="cash-allocation"
                label={
                  cashDollarAmount > 0 ? (
                    <div className="flex w-full items-center justify-between">
                      <span>Cash (%)</span>
                      <span className="text-muted-foreground text-sm/6">${formatNumber(cashDollarAmount, 1)}</span>
                    </div>
                  ) : (
                    'Cash (%)'
                  )
                }
                value={localAllocation.cashAllocation}
                onBlur={(value) => handleAllocationBlur('cashAllocation', value)}
                inputMode="decimal"
                placeholder="0%"
                suffix="%"
              />
            </fieldset>
          </form>
        </DisclosureCard>

        {allocationError && <InvalidInputError title="Asset Allocation Error" desc={allocationError} />}

        <DisclosureCard
          title="Income & Spending Growth"
          desc="Set expected nominal growth rates for income and spending over time."
          icon={ArrowTrendingUpIcon}
        >
          <form onSubmit={(e) => e.preventDefault()}>
            <fieldset className="space-y-4">
              <legend className="sr-only">Income and spending growth rate projections</legend>
              <NumberInput
                id="income-growth-rate"
                label={
                  <div className="flex w-full items-center justify-between">
                    <span>Income Growth Rate (%)</span>
                    <span className="text-muted-foreground text-sm/6">{incomeRealGrowthRate.toFixed(1)}% real</span>
                  </div>
                }
                value={growthRates.incomeGrowthRate}
                onBlur={(value) => updateGrowthRates('incomeGrowthRate', value)}
                inputMode="decimal"
                placeholder="3%"
                suffix="%"
              />
              <NumberInput
                id="expense-growth-rate"
                label={
                  <div className="flex w-full items-center justify-between">
                    <span>Spending Growth Rate (%)</span>
                    <span className="text-muted-foreground text-sm/6">{expenseRealGrowthRate.toFixed(1)}% real</span>
                  </div>
                }
                value={growthRates.expenseGrowthRate}
                onBlur={(value) => updateGrowthRates('expenseGrowthRate', value)}
                inputMode="decimal"
                placeholder="3%"
                suffix="%"
              />
            </fieldset>
          </form>
        </DisclosureCard>
      </div>
    </SectionContainer>
  );
}
