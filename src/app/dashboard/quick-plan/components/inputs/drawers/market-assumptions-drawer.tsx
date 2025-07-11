"use client";

import { useState } from "react";
import { NumberField } from "@/components/ui/number-field";
import { SettingsSection } from "@/components/layout/settings-section";

export function MarketAssumptionsDrawer() {
  // Expected returns state
  const [stockReturn, setStockReturn] = useState("10");
  const [bondReturn, setBondReturn] = useState("5");
  const [cashReturn, setCashReturn] = useState("3");

  // Economic assumptions state
  const [inflationRate, setInflationRate] = useState("3");

  return (
    <>
      <SettingsSection
        title="Expected Returns"
        desc={
          <>
            Annual returns before inflation. See{" "}
            <a
              href="https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-foreground/80 underline"
            >
              historical data
            </a>
            . Past performance doesn&apos;t guarantee future results.
          </>
        }
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
      </SettingsSection>

      <SettingsSection title="Economic Projections" hasBorder={false}>
        <NumberField
          id="inflation-rate"
          label="Inflation Rate (%)"
          value={inflationRate}
          onChange={(e) => setInflationRate(e.target.value)}
          placeholder="3"
          min="0"
          max="8"
          step="0.1"
          desc={
            <>
              Expected yearly price increases. Historically 3%. See{" "}
              <a
                href="https://www.bls.gov/charts/consumer-price-index/consumer-price-index-by-category-line-chart.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-foreground/80 underline"
              >
                Bureau of Labor Statistics CPI data
              </a>{" "}
              for current rates.
            </>
          }
        />
      </SettingsSection>

      <div className="border-foreground/10 rounded-lg border-1 p-2">
        <p className="text-muted-foreground text-xs">
          <strong>Disclaimer:</strong> This calculator is for educational
          purposes only and does not constitute investment advice. Past
          performance is not indicative of future results. Consult a qualified
          financial advisor for personalized guidance.
        </p>
      </div>
    </>
  );
}
