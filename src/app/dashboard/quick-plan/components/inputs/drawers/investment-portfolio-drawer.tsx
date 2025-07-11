"use client";

import { useState } from "react";
import { NumberField } from "@/components/ui/number-field";
import { SettingsSection } from "@/components/layout/settings-section";
import InvalidInputError from "@/components/ui/invalid-input-error";

export function InvestmentPortfolioDrawer() {
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
    <>
      <SettingsSection
        title="Asset Allocation"
        hasBorder={false}
        desc={
          <>
            How your investments are divided. Must total 100%. See{" "}
            <a
              href="https://institutional.vanguard.com/investment/strategies/tdf-glide-path.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-foreground/80 underline"
            >
              typical age-based allocations
            </a>
            .
          </>
        }
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
          desc="Higher risk, higher returns. Typically decreases closer to retirement to reduce volatility."
        />
        <NumberField
          id="bond-allocation"
          label="Bonds (%)"
          value={bondAllocation}
          onChange={(e) => setBondAllocation(e.target.value)}
          placeholder="30"
          min="0"
          max="100"
          desc="Lower risk, steady income. Typically increases closer to retirement to reduce volatility."
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
      </SettingsSection>
    </>
  );
}
