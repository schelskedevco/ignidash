"use client";

import { useState } from "react";
import { NumberField } from "@/components/number-field";
import { SelectField } from "@/components/select-field";
import { FormSection } from "@/components/form-section";

export function CalculationSettings() {
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
          desc={
            <>
              Annual portfolio withdrawal percentage.{" "}
              <a
                href="https://www.investopedia.com/terms/f/four-percent-rule.asp"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-foreground/80 underline"
              >
                4% is standard.
              </a>{" "}
              Lower rates are more conservative.
            </>
          }
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
              Age you expect to live to. See{" "}
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
          description="Today's shows purchasing power now. Future shows actual dollar amounts at retirement."
        />
      </FormSection>
    </>
  );
}
