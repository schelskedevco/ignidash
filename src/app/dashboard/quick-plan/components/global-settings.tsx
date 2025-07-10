"use client";

import { useState } from "react";
import { NumberField } from "@/components/number-field";
import { SelectField } from "@/components/select-field";
import { FormSection } from "@/components/form-section";

export function GlobalSettings() {
  const [safeWithdrawalRate, setSafeWithdrawalRate] = useState("4");
  const [inflationRate, setInflationRate] = useState("3");
  const [lifeExpectancy, setLifeExpectancy] = useState("85");
  const [currencyFormat, setCurrencyFormat] = useState("today"); // "today" or "future"

  return (
    <>
      <FormSection title="Withdrawal Strategy">
        <NumberField
          id="safe-withdrawal-rate"
          label="Safe Withdrawal Rate (%)"
          value={safeWithdrawalRate}
          onChange={(e) => setSafeWithdrawalRate(e.target.value)}
          placeholder="4"
          min="2"
          max="6"
          step="0.1"
          desc="How much of your portfolio you can safely withdraw each year in retirement (2-6%)."
        />
      </FormSection>
      <FormSection
        title={
          <>
            Death & <span className="line-through decoration-2">Taxes</span>{" "}
            Inflation
          </>
        }
      >
        <NumberField
          id="life-expectancy"
          label="Life Expectancy (years)"
          value={lifeExpectancy}
          onChange={(e) => setLifeExpectancy(e.target.value)}
          placeholder="85"
          min="50"
          max="110"
          desc={
            <>
              How far out to project all FIRE calculations (50-110 years). See{" "}
              <a
                href="https://www.cdc.gov/nchs/fastats/life-expectancy.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-foreground/80 underline"
              >
                CDC life expectancy data
              </a>{" "}
              for current averages.
            </>
          }
        />
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
              Used for real return calculations (0-8%). See{" "}
              <a
                href="https://www.bls.gov/charts/consumer-price-index/consumer-price-index-by-category-line-chart.htm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-foreground/80 underline"
              >
                Bureau of Labor Statistics CPI data
              </a>{" "}
              for current inflation rates.
            </>
          }
        />
      </FormSection>
      <FormSection title="Display" hasBorder={false}>
        <SelectField
          id="currency-display"
          label="Currency Format"
          value={currencyFormat}
          onChange={(e) => setCurrencyFormat(e.target.value)}
          options={[
            { value: "today", label: "Today's Currency" },
            { value: "future", label: "Future Inflated Currency" },
          ]}
          description="Today's currency shows purchasing power now, future currency show nominal amounts at retirement."
        />
      </FormSection>
    </>
  );
}
