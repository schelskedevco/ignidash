"use client";

import { NumberField } from "@/components/ui/number-field";
import { SettingsSection } from "@/components/layout/settings-section";
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
      <SettingsSection
        title="Cash Flow"
        desc="Portfolio withdrawals and income sources that will cover your retirement expenses."
        legendText="Retirement cash flow planning settings"
      >
        <NumberField
          id="safe-withdrawal-rate"
          label="Safe Withdrawal Rate (%)"
          value={retirementFunding.safeWithdrawalRate}
          onChange={(value) =>
            updateRetirementFunding("safeWithdrawalRate", value ?? 4)
          }
          placeholder="4%"
          min={2}
          max={6}
          step={0.1}
          desc={getSafeWithdrawalRateDescription()}
        />
        <NumberField
          id="retirement-income"
          label="Passive Retirement Income"
          value={retirementFunding.retirementIncome}
          onChange={(value) =>
            updateRetirementFunding("retirementIncome", value ?? 0)
          }
          placeholder="$0"
          min={0}
          desc="Passive income sources in retirement like Social Security, pensions, or annuities. This helps estimate total retirement income beyond investment withdrawals."
        />
      </SettingsSection>

      <SettingsSection
        title="Death & Taxes"
        desc="Life expectancy and tax assumptions that affect retirement planning."
        hasBorder={false}
        legendText="Life expectancy and tax planning assumptions"
      >
        <NumberField
          id="life-expectancy"
          label="Life Expectancy (years)"
          value={retirementFunding.lifeExpectancy}
          onChange={(value) =>
            updateRetirementFunding("lifeExpectancy", value ?? 85)
          }
          placeholder="85"
          min={50}
          max={110}
          desc={getLifeExpectancyDescription()}
        />
        <NumberField
          id="effective-tax-rate"
          label="Estimated Effective Tax Rate (%)"
          value={retirementFunding.effectiveTaxRate}
          onChange={(value) =>
            updateRetirementFunding("effectiveTaxRate", value ?? 15)
          }
          placeholder="15%"
          min={0}
          max={50}
          step={0.1}
          desc={getEffectiveTaxRateDescription()}
        />
      </SettingsSection>
    </>
  );
}
