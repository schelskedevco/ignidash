"use client";

import { Card } from "@/components/ui/card";
import { NumberField } from "@/components/ui/number-field";
import { SectionHeader } from "@/components/layout/section-header";

interface BasicsSectionProps {
  currentAge: string;
  setCurrentAge: (value: string) => void;
  annualIncome: string;
  setAnnualIncome: (value: string) => void;
  annualExpenses: string;
  setAnnualExpenses: (value: string) => void;
  investedAssets: string;
  setInvestedAssets: (value: string) => void;
}

export function BasicsSection({
  currentAge,
  setCurrentAge,
  annualIncome,
  setAnnualIncome,
  annualExpenses,
  setAnnualExpenses,
  investedAssets,
  setInvestedAssets,
}: BasicsSectionProps) {
  return (
    <div className="border-foreground/10 mb-5 border-b pb-5">
      <SectionHeader
        headline="Basics"
        desc="The core numbers needed to estimate your financial independence timeline."
      />

      <Card>
        <form onSubmit={(e) => e.preventDefault()}>
          <fieldset className="space-y-4">
            <legend className="sr-only">
              Basic financial information for FIRE calculation
            </legend>
            <NumberField
              id="current-age"
              label="Current Age"
              value={currentAge}
              onChange={(e) => setCurrentAge(e.target.value)}
              placeholder="28"
            />
            <NumberField
              id="annual-income"
              label="Net Annual Income"
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
              placeholder="$85,000"
            />
            <NumberField
              id="annual-expenses"
              label="Annual Expenses"
              value={annualExpenses}
              onChange={(e) => setAnnualExpenses(e.target.value)}
              placeholder="$50,000"
            />
            <NumberField
              id="invested-assets"
              label="Invested Assets"
              value={investedAssets}
              onChange={(e) => setInvestedAssets(e.target.value)}
              placeholder="$75,000"
            />
          </fieldset>
        </form>
      </Card>
    </div>
  );
}
