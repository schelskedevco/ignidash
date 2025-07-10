"use client";

import { Input } from "@/components/catalyst/input";
import { DisclosureSection } from "@/components/disclosure-section";
import { Coffee, RollerCoaster } from "lucide-react";

export function CoastFIRE() {
  return (
    <DisclosureSection
      title="Coast FIRE"
      desc="Front-load savings, then work just enough to cover living expenses."
      icon={<RollerCoaster className="h-5 w-5" />}
    >
      <form onSubmit={(e) => e.preventDefault()} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="target-retirement-age"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Target Retirement Age
          </label>
          <Input id="target-retirement-age" type="number" placeholder="65" />
        </div>
      </form>
    </DisclosureSection>
  );
}

export function BaristaFIRE() {
  return (
    <DisclosureSection
      title="Barista FIRE"
      desc="Work part-time in enjoyable jobs while investments cover the rest."
      icon={<Coffee className="h-5 w-5" />}
    >
      <form onSubmit={(e) => e.preventDefault()} className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="part-time-income"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Part-time Monthly Income
          </label>
          <Input id="part-time-income" type="text" placeholder="$1,500" />
        </div>
      </form>
    </DisclosureSection>
  );
}
