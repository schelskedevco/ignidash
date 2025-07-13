"use client";

import { NumberInput } from "@/components/ui/number-input";
import { CardFormSection } from "@/components/layout/card-form-section";
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
      <CardFormSection
        title="Expected Returns"
        desc={getExpectedReturnsDescription()}
        legendText="Expected investment returns configuration"
      >
        <NumberInput
          id="stock-return"
          label="Stock Returns (%)"
          value={marketAssumptions.stockReturn}
          onBlur={(value) => updateMarketAssumptions("stockReturn", value)}
          placeholder="10%"
          suffix="%"
        />
        <NumberInput
          id="bond-return"
          label="Bond Returns (%)"
          value={marketAssumptions.bondReturn}
          onBlur={(value) => updateMarketAssumptions("bondReturn", value)}
          placeholder="5%"
          suffix="%"
        />
        <NumberInput
          id="cash-return"
          label="Cash Returns (%)"
          value={marketAssumptions.cashReturn}
          onBlur={(value) => updateMarketAssumptions("cashReturn", value)}
          placeholder="3%"
          suffix="%"
        />
      </CardFormSection>

      <CardFormSection
        title="Economic Factors"
        desc="Variables that impact your purchasing power and real investment returns over time."
        hasBorder={false}
        legendText="Economic factors for financial projections"
      >
        <NumberInput
          id="inflation-rate"
          label="Inflation Rate (%)"
          value={marketAssumptions.inflationRate}
          onBlur={(value) => updateMarketAssumptions("inflationRate", value)}
          placeholder="3%"
          suffix="%"
          desc={getInflationRateDescription()}
        />
      </CardFormSection>
    </>
  );
}
