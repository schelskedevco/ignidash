"use client";

import { NumberField } from "@/components/ui/number-field";
import { DisclosureSection } from "@/components/layout/disclosure-section";
import { Coffee, RollerCoaster } from "lucide-react";

interface CoastFIREProps {
  targetRetirementAge: number | null;
  setTargetRetirementAge: (value: number | null) => void;
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
      <NumberField
        id="target-retirement-age"
        label="Target Retirement Age"
        value={targetRetirementAge}
        onChange={(value) => setTargetRetirementAge(value)}
        placeholder="65"
        min={16}
        max={100}
      />
    </DisclosureSection>
  );
}

interface BaristaFIREProps {
  partTimeIncome: number | null;
  setPartTimeIncome: (value: number | null) => void;
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
      <NumberField
        id="part-time-income"
        label="Part-time Annual Income"
        value={partTimeIncome}
        onChange={(value) => setPartTimeIncome(value)}
        placeholder="$18,000"
        min={0}
      />
    </DisclosureSection>
  );
}
