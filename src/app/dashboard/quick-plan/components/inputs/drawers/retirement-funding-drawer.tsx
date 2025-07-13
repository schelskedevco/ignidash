"use client";

import { NumberInput } from "@/components/ui/number-input";
import { CardFormSection } from "@/components/layout/card-form-section";
import {
  useRetirementFundingData,
  useUpdateRetirementFunding,
} from "@/lib/stores/quick-plan-store";

function getSafeWithdrawalRateDescription() {
  return (
    <>
      Annual portfolio withdrawal percentage.{" "}
      <a
        href="https://www.investopedia.com/terms/f/four-percent-rule.asp"
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground hover:text-foreground/80 underline"
      >
        4% is standard
      </a>
      , and lower rates are more conservative.
    </>
  );
}

function getLifeExpectancyDescription() {
  return (
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
  );
}

function getEffectiveTaxRateDescription() {
  return (
    <>
      Estimated tax rate on retirement withdrawals. See{" "}
      <a
        href="https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-tax-on-early-distributions"
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground hover:text-foreground/80 underline"
      >
        IRS retirement tax guidance
      </a>{" "}
      for planning details. Affects after-tax income calculations.
    </>
  );
}

export function RetirementFundingDrawer() {
  const retirementFunding = useRetirementFundingData();
  const updateRetirementFunding = useUpdateRetirementFunding();

  return (
    <>
      <CardFormSection
        title="Cash Flow"
        desc="Portfolio withdrawals and income sources that will cover your retirement expenses."
        legendText="Retirement cash flow planning settings"
      >
        <NumberInput
          id="safe-withdrawal-rate"
          label="Safe Withdrawal Rate (%)"
          value={retirementFunding.safeWithdrawalRate}
          onBlur={(value) =>
            updateRetirementFunding("safeWithdrawalRate", value)
          }
          placeholder="4%"
          suffix="%"
          desc={getSafeWithdrawalRateDescription()}
        />
        <NumberInput
          id="retirement-income"
          label="Passive Retirement Income"
          value={retirementFunding.retirementIncome}
          onBlur={(value) => updateRetirementFunding("retirementIncome", value)}
          placeholder="$0"
          prefix="$"
          desc="Passive income sources in retirement like Social Security, pensions, or annuities. This helps estimate total retirement income beyond investment withdrawals."
        />
      </CardFormSection>

      <CardFormSection
        title="Death & Taxes"
        desc="Life expectancy and tax assumptions that affect retirement planning."
        hasBorder={false}
        legendText="Life expectancy and tax planning assumptions"
      >
        <NumberInput
          id="life-expectancy"
          label="Life Expectancy (years)"
          value={retirementFunding.lifeExpectancy}
          onBlur={(value) => updateRetirementFunding("lifeExpectancy", value)}
          placeholder="85"
          decimalScale={0}
          desc={getLifeExpectancyDescription()}
        />
        <NumberInput
          id="effective-tax-rate"
          label="Estimated Effective Tax Rate (%)"
          value={retirementFunding.effectiveTaxRate}
          onBlur={(value) => updateRetirementFunding("effectiveTaxRate", value)}
          placeholder="15%"
          suffix="%"
          desc={getEffectiveTaxRateDescription()}
        />
      </CardFormSection>
    </>
  );
}
