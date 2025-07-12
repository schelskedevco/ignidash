"use client";

import { NumberField } from "@/components/ui/number-field";
import { SettingsSection } from "@/components/layout/settings-section";
import {
  useMarketAssumptionsData,
  useUpdateMarketAssumptions,
} from "@/lib/stores/quick-plan-store";

function getInflationRateDescription() {
  return (
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
  );
}

function getExpectedReturnsDescription() {
  return (
    <>
      Expected annual returns before inflation. See{" "}
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
  );
}

export function MarketAssumptionsDrawer() {
  const marketAssumptions = useMarketAssumptionsData();
  const updateMarketAssumptions = useUpdateMarketAssumptions();

  return (
    <>
      <SettingsSection
        title="Expected Returns"
        desc={getExpectedReturnsDescription()}
        legendText="Expected investment returns configuration"
      >
        <NumberField
          id="stock-return"
          label="Stock Returns (%)"
          value={marketAssumptions.stockReturn}
          onChange={(value) => updateMarketAssumptions("stockReturn", value)}
          placeholder="10%"
          min={0}
          max={20}
          step={0.1}
        />
        <NumberField
          id="bond-return"
          label="Bond Returns (%)"
          value={marketAssumptions.bondReturn}
          onChange={(value) => updateMarketAssumptions("bondReturn", value)}
          placeholder="5%"
          min={0}
          max={15}
          step={0.1}
        />
        <NumberField
          id="cash-return"
          label="Cash Returns (%)"
          value={marketAssumptions.cashReturn}
          onChange={(value) => updateMarketAssumptions("cashReturn", value)}
          placeholder="3%"
          min={0}
          max={10}
          step={0.1}
        />
      </SettingsSection>

      <SettingsSection
        title="Economic Factors"
        desc="Variables that impact your purchasing power and real investment returns over time."
        hasBorder={false}
        legendText="Economic factors for financial projections"
      >
        <NumberField
          id="inflation-rate"
          label="Inflation Rate (%)"
          value={marketAssumptions.inflationRate}
          onChange={(value) => updateMarketAssumptions("inflationRate", value)}
          placeholder="3%"
          min={0}
          max={8}
          step={0.1}
          desc={getInflationRateDescription()}
        />
      </SettingsSection>
    </>
  );
}
