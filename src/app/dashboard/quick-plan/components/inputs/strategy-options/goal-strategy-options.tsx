"use client";

import { NumberInput } from "@/components/ui/number-input";
import { DisclosureSection } from "@/components/layout/disclosure-section";
import { Coffee, RollerCoaster } from "lucide-react";

interface CoastFIREProps {
  targetRetirementAge: number | null;
  setTargetRetirementAge: (value: string | null) => {
    success: boolean;
    error?: string;
  };
}

export function CoastFIRE({
  targetRetirementAge,
  setTargetRetirementAge,
}: CoastFIREProps) {
  return (
    <DisclosureSection
      title="Coast FIRE"
      desc="Front-load savings, then work just enough to cover living expenses."
      icon={<RollerCoaster className="h-5 w-5" aria-hidden="true" />}
    >
      <NumberInput
        id="target-retirement-age"
        label="Target Retirement Age"
        value={targetRetirementAge}
        onBlur={setTargetRetirementAge}
        inputMode="numeric"
        placeholder="65"
        decimalScale={0}
      />
    </DisclosureSection>
  );
}

interface BaristaFIREProps {
  partTimeIncome: number | null;
  setPartTimeIncome: (value: string | null) => {
    success: boolean;
    error?: string;
  };
}

export function BaristaFIRE({
  partTimeIncome,
  setPartTimeIncome,
}: BaristaFIREProps) {
  return (
    <DisclosureSection
      title="Barista FIRE"
      desc="Work part-time in enjoyable jobs while investments cover the rest."
      icon={<Coffee className="h-5 w-5" aria-hidden="true" />}
    >
      <NumberInput
        id="part-time-income"
        label="Part-time Annual Income"
        value={partTimeIncome}
        onBlur={setPartTimeIncome}
        inputMode="decimal"
        placeholder="$18,000"
        prefix="$"
      />
    </DisclosureSection>
  );
}
