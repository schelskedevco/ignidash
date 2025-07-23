'use client';

import { useState, useEffect } from 'react';
import { ChartPieIcon } from '@heroicons/react/24/outline';

import NumberInput from '@/components/ui/number-input';
import InvalidInputError from '@/components/ui/invalid-input-error';
import DisclosureCard from '@/components/ui/disclosure-card';
import {
  useAllocationData,
  useUpdateAllocation,
  useStocksDollarAmount,
  useBondsDollarAmount,
  useCashDollarAmount,
} from '@/lib/stores/quick-plan-store';
import { formatNumber } from '@/lib/utils';

export default function InvestmentPortfolio() {
  const allocation = useAllocationData();
  const updateAllocation = useUpdateAllocation();

  // Get dollar amounts for each asset class
  const stocksDollarAmount = useStocksDollarAmount();
  const bondsDollarAmount = useBondsDollarAmount();
  const cashDollarAmount = useCashDollarAmount();

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
    <>
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
    </>
  );
}
